from __future__ import annotations

import base64
import hashlib
import json
import logging
import os
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import requests
from bson import ObjectId
from cryptography.fernet import Fernet, InvalidToken
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from ..auth import current_user
from ..config import settings
from ..database import db
from ..rag.providers import generate_chat_completion

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/meetings", tags=["Google Meet Summarizer"])
MEET_API = "https://meet.googleapis.com/v2"
TOKEN_URL = "https://oauth2.googleapis.com/token"
SCOPE = "https://www.googleapis.com/auth/meetings.space.readonly"


def _user_id(user: dict) -> str:
    return str(user["_id"])


def _cipher() -> Fernet:
    key = base64.urlsafe_b64encode(hashlib.sha256(settings.jwt_secret.encode()).digest())
    return Fernet(key)


def _encrypt(value: str) -> str:
    return _cipher().encrypt(value.encode()).decode()


def _decrypt(value: str) -> str:
    try:
        return _cipher().decrypt(value.encode()).decode()
    except (InvalidToken, ValueError):
        raise HTTPException(status_code=503, detail="Could not decrypt Google credentials; verify JWT_SECRET is unchanged")


def _oauth_config() -> tuple[str, str, str]:
    values = (
        os.getenv("GOOGLE_CLIENT_ID", "").strip(),
        os.getenv("GOOGLE_CLIENT_SECRET", "").strip(),
        os.getenv("GOOGLE_MEET_REDIRECT_URI", "").strip(),
    )
    if not all(values):
        raise HTTPException(status_code=503, detail="Google Meet OAuth is not configured on the backend")
    return values


def _google_headers(user_id: str) -> dict:
    stored = db.meet_google_tokens.find_one({"user_id": user_id})
    if not stored:
        raise HTTPException(status_code=401, detail="Connect your Google account first")
    now = datetime.now(timezone.utc)
    access = _decrypt(stored["access_token"])
    if stored.get("expires_at", now) <= now + timedelta(seconds=60):
        refresh = stored.get("refresh_token")
        if not refresh:
            raise HTTPException(status_code=401, detail="Google session expired; reconnect your account")
        client_id, client_secret, _ = _oauth_config()
        response = requests.post(TOKEN_URL, data={
            "client_id": client_id, "client_secret": client_secret,
            "refresh_token": _decrypt(refresh), "grant_type": "refresh_token",
        }, timeout=20)
        if not response.ok:
            raise HTTPException(status_code=401, detail="Google token refresh failed; reconnect your account")
        token = response.json()
        access = token["access_token"]
        db.meet_google_tokens.update_one({"user_id": user_id}, {"$set": {
            "access_token": _encrypt(access),
            "expires_at": now + timedelta(seconds=int(token.get("expires_in", 3600))),
        }})
    return {"Authorization": f"Bearer {access}"}


def _meet_get(resource: str, headers: dict, params: dict | None = None) -> dict:
    response = requests.get(f"{MEET_API}/{resource.lstrip('/')}", headers=headers, params=params or {}, timeout=30)
    if response.status_code in (401, 403):
        raise HTTPException(status_code=response.status_code, detail="Google Meet access denied or expired; reconnect and verify Meet API permissions")
    if not response.ok:
        logger.warning("Meet API failed (%s): %s", response.status_code, response.text[:300])
        raise HTTPException(status_code=502, detail="Google Meet API request failed")
    return response.json()


class TranscriptInput(BaseModel):
    transcript: str = Field(min_length=20, max_length=200000)
    title: str = Field(default="Meeting", max_length=200)
    meeting_date: datetime | None = None


def _summarize(transcript: str, title: str) -> dict:
    messages = [
        {"role": "system", "content": (
            "Summarize this meeting faithfully. Return only JSON with keys overview (string), "
            "key_points (array of strings), decisions (array of strings), action_items "
            "(array of objects with task, owner, due_date), and follow_ups (array of strings). "
            "Do not invent facts, owners, deadlines, or decisions; use null for unknown owner or due_date."
        )},
        {"role": "user", "content": f"Meeting: {title}\\nTranscript:\\n{transcript}"},
    ]
    raw = generate_chat_completion(messages)
    try:
        result = json.loads(raw[raw.index("{"):raw.rindex("}") + 1])
    except (ValueError, TypeError):
        result = {"overview": raw.strip(), "key_points": [], "decisions": [], "action_items": [], "follow_ups": []}
    defaults = {"overview": "", "key_points": [], "decisions": [], "action_items": [], "follow_ups": []}
    for key, default in defaults.items():
        if not isinstance(result.get(key), type(default)):
            result[key] = default
    return result


@router.get("/google/connect")
def connect_google(user: dict = Depends(current_user)):
    client_id, _, redirect_uri = _oauth_config()
    state = secrets.token_urlsafe(32)
    db.meet_oauth_states.insert_one({
        "state": state, "user_id": _user_id(user),
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
    })
    params = {
        "client_id": client_id, "redirect_uri": redirect_uri, "response_type": "code",
        "scope": SCOPE, "access_type": "offline", "prompt": "consent", "state": state,
    }
    return {"authorization_url": "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)}


@router.get("/google/callback")
def google_callback(code: str = Query(...), state: str = Query(...)):
    saved = db.meet_oauth_states.find_one_and_delete({
        "state": state, "expires_at": {"$gt": datetime.now(timezone.utc)},
    })
    if not saved:
        raise HTTPException(status_code=400, detail="Invalid or expired Google OAuth state")
    client_id, client_secret, redirect_uri = _oauth_config()
    response = requests.post(TOKEN_URL, data={
        "code": code, "client_id": client_id, "client_secret": client_secret,
        "redirect_uri": redirect_uri, "grant_type": "authorization_code",
    }, timeout=20)
    if not response.ok:
        raise HTTPException(status_code=502, detail="Google authorization exchange failed")
    token = response.json()
    previous = db.meet_google_tokens.find_one({"user_id": saved["user_id"]})
    refresh_token = token.get("refresh_token")
    if refresh_token:
        encrypted_refresh = _encrypt(refresh_token)
    elif previous:
        encrypted_refresh = previous["refresh_token"]
    else:
        raise HTTPException(status_code=400, detail="Google did not issue a refresh token; revoke NOTE OS access and reconnect")
    now = datetime.now(timezone.utc)
    db.meet_google_tokens.update_one({"user_id": saved["user_id"]}, {"$set": {
        "user_id": saved["user_id"], "access_token": _encrypt(token["access_token"]),
        "refresh_token": encrypted_refresh,
        "expires_at": now + timedelta(seconds=int(token.get("expires_in", 3600))),
        "updated_at": now,
    }}, upsert=True)
    return {"success": True, "message": "Google Meet connected. Return to NOTE OS."}


@router.get("/google/conferences")
def conferences(user: dict = Depends(current_user), page_size: int = Query(20, ge=1, le=100)):
    return _meet_get("conferenceRecords", _google_headers(_user_id(user)), {"pageSize": page_size})


@router.get("/google/conferences/{conference_id:path}/transcripts")
def transcripts(conference_id: str, user: dict = Depends(current_user)):
    if not conference_id.startswith("conferenceRecords/"):
        raise HTTPException(status_code=400, detail="Invalid conference record")
    return _meet_get(f"{conference_id}/transcripts", _google_headers(_user_id(user)), {"pageSize": 100})


@router.post("/google/transcripts/{transcript_id:path}/summarize")
def summarize_google_transcript(transcript_id: str, user: dict = Depends(current_user)):
    if not transcript_id.startswith("conferenceRecords/") or "/transcripts/" not in transcript_id:
        raise HTTPException(status_code=400, detail="Invalid transcript resource name")
    headers = _google_headers(_user_id(user))
    entries, page_token = [], None
    for _ in range(20):
        params = {"pageSize": 100}
        if page_token:
            params["pageToken"] = page_token
        page = _meet_get(f"{transcript_id}/entries", headers, params)
        entries.extend(page.get("transcriptEntries", []))
        page_token = page.get("nextPageToken")
        if not page_token:
            break
    lines = [
        f"{entry.get('participant', 'Speaker')}: {entry.get('text', '').strip()}"
        for entry in entries if entry.get("text", "").strip()
    ]
    if not lines:
        raise HTTPException(status_code=404, detail="No transcript entries found; transcription may not have been enabled")
    transcript_text = "\\n".join(lines)
    summary = _summarize(transcript_text, "Google Meet")
    now = datetime.now(timezone.utc)
    doc = {
        "owner_id": _user_id(user), "source": "google_meet_api",
        "transcript_resource": transcript_id, "title": "Google Meet",
        "summary": summary, "created_at": now, "updated_at": now,
    }
    inserted = db.meeting_summaries.insert_one(doc)
    return {"id": str(inserted.inserted_id), "title": doc["title"], **summary}


@router.post("/summarize")
def summarize_manual(payload: TranscriptInput, user: dict = Depends(current_user)):
    summary = _summarize(payload.transcript, payload.title)
    now = datetime.now(timezone.utc)
    inserted = db.meeting_summaries.insert_one({
        "owner_id": _user_id(user), "source": "manual_transcript",
        "title": payload.title, "meeting_date": payload.meeting_date,
        "summary": summary, "created_at": now, "updated_at": now,
    })
    return {"id": str(inserted.inserted_id), "title": payload.title, "meeting_date": payload.meeting_date, **summary}


@router.get("")
def list_summaries(user: dict = Depends(current_user), limit: int = Query(20, ge=1, le=100)):
    docs = db.meeting_summaries.find({"owner_id": _user_id(user)}).sort("created_at", -1).limit(limit)
    return {"meetings": [{
        "id": str(doc["_id"]), "title": doc.get("title"),
        "summary": doc.get("summary"), "created_at": doc.get("created_at"),
    } for doc in docs]}


@router.delete("/{summary_id}")
def delete_summary(summary_id: str, user: dict = Depends(current_user)):
    if not ObjectId.is_valid(summary_id):
        raise HTTPException(status_code=400, detail="Invalid summary id")
    result = db.meeting_summaries.delete_one({"_id": ObjectId(summary_id), "owner_id": _user_id(user)})
    if not result.deleted_count:
        raise HTTPException(status_code=404, detail="Meeting summary not found")
    return {"success": True}


@router.delete("/google/disconnect")
def disconnect_google(user: dict = Depends(current_user)):
    db.meet_google_tokens.delete_one({"user_id": _user_id(user)})
    return {"success": True}
