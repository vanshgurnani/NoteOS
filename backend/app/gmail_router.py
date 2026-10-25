from __future__ import annotations

import base64
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from typing import Optional
from urllib.parse import urlencode

import requests
from bson import ObjectId
from cryptography.fernet import Fernet, InvalidToken
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr, Field

from .auth import current_user
from .config import settings
from .database import users_collection

router = APIRouter(prefix="/gmail", tags=["Gmail"])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me"
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.send"]


def _cipher() -> Fernet:
    key = base64.urlsafe_b64encode(hashlib.sha256(settings.jwt_secret.encode("utf-8")).digest())
    return Fernet(key)


def _encrypt(value: str) -> str:
    return _cipher().encrypt(value.encode("utf-8")).decode("ascii")


def _decrypt(value: str) -> str:
    try:
        return _cipher().decrypt(value.encode("ascii")).decode("utf-8")
    except (InvalidToken, ValueError):
        raise HTTPException(status_code=500, detail="Stored Gmail credentials cannot be decrypted; reconnect Gmail")


def _credentials_ready() -> bool:
    return bool(settings.google_client_id and settings.google_client_secret and settings.google_redirect_uri)


def _token_request(data: dict) -> dict:
    try:
        response = requests.post(GOOGLE_TOKEN_URL, data=data, timeout=15)
        if not response.ok:
            raise HTTPException(status_code=502, detail="Google OAuth token exchange failed")
        return response.json()
    except requests.RequestException:
        raise HTTPException(status_code=502, detail="Could not reach Google OAuth")


def _gmail_token(user: dict) -> str:
    stored = users_collection().find_one({"_id": user["_id"]}) or {}
    gmail = stored.get("gmail") or {}
    refresh_token = gmail.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=409, detail="Gmail is not connected")
    if gmail.get("expires_at") and gmail["expires_at"] > datetime.now(timezone.utc) + timedelta(minutes=2):
        return _decrypt(gmail["access_token"])
    refreshed = _token_request({
        "client_id": settings.google_client_id,
        "client_secret": settings.google_client_secret,
        "refresh_token": _decrypt(refresh_token),
        "grant_type": "refresh_token",
    })
    access_token = refreshed.get("access_token")
    if not access_token:
        raise HTTPException(status_code=502, detail="Google did not return an access token")
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(refreshed.get("expires_in", 3600)))
    users_collection().update_one({"_id": user["_id"]}, {"$set": {
        "gmail.access_token": _encrypt(access_token),
        "gmail.expires_at": expires_at,
        "gmail.updated_at": datetime.now(timezone.utc),
    }})
    return access_token


def _gmail_request(user: dict, method: str, path: str, **kwargs):
    token = _gmail_token(user)
    response = requests.request(method, f"{GMAIL_API}/{path.lstrip('/')}",
                                headers={"Authorization": f"Bearer {token}"}, timeout=20, **kwargs)
    if response.status_code == 401:
        raise HTTPException(status_code=401, detail="Gmail authorization expired. Reconnect Gmail.")
    if response.status_code == 429:
        raise HTTPException(status_code=429, detail="Gmail API rate limit reached. Try again shortly.")
    if not response.ok:
        raise HTTPException(status_code=502, detail="Gmail API request failed")
    return response.json() if response.content else {}


class SendEmailRequest(BaseModel):
    to: EmailStr
    subject: str = Field(max_length=998)
    body: str = Field(min_length=1, max_length=100000)


@router.get("/status")
def gmail_status(user: dict = Depends(current_user)):
    doc = users_collection().find_one({"_id": user["_id"]}) or {}
    gmail = doc.get("gmail") or {}
    return {"connected": bool(gmail.get("refresh_token")), "email": gmail.get("email")}


@router.get("/connect")
def gmail_connect(user: dict = Depends(current_user)):
    if not _credentials_ready():
        raise HTTPException(status_code=503, detail="Gmail OAuth is not configured on this NOTE OS deployment")
    state = secrets.token_urlsafe(32)
    users_collection().update_one({"_id": user["_id"]}, {"$set": {
        "gmail_oauth_state": state,
        "gmail_oauth_state_expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
    }})
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "true",
        "state": state,
    }
    return {"authorization_url": f"{GOOGLE_AUTH_URL}?{urlencode(params)}"}


@router.get("/oauth/callback")
def gmail_callback(code: Optional[str] = None, state: Optional[str] = None, error: Optional[str] = None):
    frontend = settings.app_url.rstrip("/") + "/gmail"
    if error:
        return RedirectResponse(f"{frontend}?gmail_error=consent_denied")
    if not code or not state:
        return RedirectResponse(f"{frontend}?gmail_error=invalid_callback")
    user = users_collection().find_one({
        "gmail_oauth_state": state,
        "gmail_oauth_state_expires_at": {"$gt": datetime.now(timezone.utc)},
    })
    if not user:
        return RedirectResponse(f"{frontend}?gmail_error=state_expired")
    try:
        token_data = _token_request({
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": settings.google_redirect_uri,
            "grant_type": "authorization_code",
        })
        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        if not access_token:
            raise ValueError("Missing access token")
        profile = requests.get("https://www.googleapis.com/oauth2/v2/userinfo",
                               headers={"Authorization": f"Bearer {access_token}"}, timeout=12)
        profile.raise_for_status()
        profile_data = profile.json()
        existing = user.get("gmail") or {}
        if not refresh_token:
            refresh_token = _decrypt(existing["refresh_token"]) if existing.get("refresh_token") else None
        if not refresh_token:
            return RedirectResponse(f"{frontend}?gmail_error=missing_refresh_token")
        now = datetime.now(timezone.utc)
        users_collection().update_one({"_id": user["_id"]}, {"$set": {
            "gmail": {
                "email": profile_data.get("email", ""),
                "access_token": _encrypt(access_token),
                "refresh_token": _encrypt(refresh_token),
                "expires_at": now + timedelta(seconds=int(token_data.get("expires_in", 3600))),
                "connected_at": now,
                "updated_at": now,
                "scopes": SCOPES,
            },
        }, "$unset": {"gmail_oauth_state": "", "gmail_oauth_state_expires_at": ""}})
        return RedirectResponse(f"{frontend}?gmail_connected=1")
    except Exception:
        users_collection().update_one({"_id": user["_id"]}, {"$unset": {"gmail_oauth_state": "", "gmail_oauth_state_expires_at": ""}})
        return RedirectResponse(f"{frontend}?gmail_error=connection_failed")


@router.get("/messages")
def list_gmail_messages(q: str = Query(default="", max_length=500), limit: int = Query(default=20, ge=1, le=50),
                        page_token: Optional[str] = None, user: dict = Depends(current_user)):
    params = {"maxResults": limit}
    if q.strip():
        params["q"] = q.strip()
    if page_token:
        params["pageToken"] = page_token
    result = _gmail_request(user, "GET", "messages", params=params)
    messages = []
    for item in result.get("messages", []):
        detail = _gmail_request(user, "GET", f"messages/{item['id']}", params={"format": "metadata", "metadataHeaders": ["From", "To", "Subject", "Date"]})
        headers = {h["name"].lower(): h["value"] for h in detail.get("payload", {}).get("headers", [])}
        messages.append({"id": item["id"], "thread_id": item.get("threadId"), "snippet": detail.get("snippet", ""),
                         "from": headers.get("from", ""), "to": headers.get("to", ""),
                         "subject": headers.get("subject", "(no subject)"), "date": headers.get("date", ""),
                         "unread": "UNREAD" in detail.get("labelIds", [])})
    return {"messages": messages, "next_page_token": result.get("nextPageToken")}


@router.get("/messages/{message_id}")
def get_gmail_message(message_id: str, user: dict = Depends(current_user)):
    data = _gmail_request(user, "GET", f"messages/{message_id}", params={"format": "full"})
    headers = {h["name"].lower(): h["value"] for h in data.get("payload", {}).get("headers", [])}
    def decode_part(part):
        body = part.get("body", {}).get("data")
        if body:
            try:
                return base64.urlsafe_b64decode(body + "=" * (-len(body) % 4)).decode("utf-8", errors="replace")
            except Exception:
                return ""
        return "".join(decode_part(p) for p in part.get("parts", []))
    return {"id": data.get("id"), "thread_id": data.get("threadId"), "snippet": data.get("snippet", ""),
            "from": headers.get("from", ""), "to": headers.get("to", ""), "subject": headers.get("subject", ""),
            "date": headers.get("date", ""), "body": decode_part(data.get("payload", {}))}


@router.post("/send")
def send_gmail_message(payload: SendEmailRequest, user: dict = Depends(current_user)):
    message = EmailMessage()
    message["To"] = str(payload.to)
    message["Subject"] = payload.subject
    message.set_content(payload.body)
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode("ascii")
    return _gmail_request(user, "POST", "messages/send", json={"raw": raw})


@router.delete("/disconnect")
def disconnect_gmail(user: dict = Depends(current_user)):
    users_collection().update_one({"_id": user["_id"]}, {"$unset": {"gmail": "", "gmail_oauth_state": "", "gmail_oauth_state_expires_at": ""}})
    return {"status": "ok"}
