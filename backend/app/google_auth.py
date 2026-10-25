from __future__ import annotations

import re
import requests
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from pymongo.errors import DuplicateKeyError

from .auth import create_access_token, public_user
from .config import settings
from .database import users_collection

router = APIRouter(prefix="/auth", tags=["authentication"])


class GoogleCredential(BaseModel):
    credential: str = Field(min_length=20, max_length=10000)


def _username_for(email: str) -> str:
    base = re.sub(r"[^a-zA-Z0-9_]", "_", email.split("@", 1)[0]).strip("_")[:30] or "google_user"
    candidate = base
    suffix = 1
    while users_collection().find_one({"username": candidate}):
        suffix += 1
        candidate = f"{base[:30-len(str(suffix))]}{suffix}"
    return candidate


@router.post("/google")
def google_sign_in(payload: GoogleCredential):
    if not settings.google_client_id:
        raise HTTPException(status_code=503, detail="Google Sign-In is not configured")
    try:
        response = requests.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": payload.credential},
            timeout=8,
        )
        response.raise_for_status()
        claims = response.json()
    except requests.RequestException:
        raise HTTPException(status_code=401, detail="Could not verify Google credential")
    if claims.get("aud") != settings.google_client_id:
        raise HTTPException(status_code=401, detail="Google credential was issued for another application")
    if claims.get("iss") not in {"accounts.google.com", "https://accounts.google.com"}:
        raise HTTPException(status_code=401, detail="Invalid Google credential issuer")
    if claims.get("email_verified") not in {"true", True} or not claims.get("email"):
        raise HTTPException(status_code=401, detail="A verified Google email is required")

    email = claims["email"].strip().lower()
    google_id = claims.get("sub")
    if not google_id:
        raise HTTPException(status_code=401, detail="Google account identifier is missing")
    user = users_collection().find_one({"$or": [{"google_id": google_id}, {"email": email}]})
    now = datetime.now(timezone.utc)
    if user:
        updates = {
            "google_id": google_id,
            "auth_provider": "dual" if user.get("password_hash") else "google",
            "avatar_url": claims.get("picture"),
            "updated_at": now,
        }
        users_collection().update_one({"_id": user["_id"]}, {"$set": updates})
        user.update(updates)
    else:
        user = {
            "username": _username_for(email),
            "email": email,
            "google_id": google_id,
            "auth_provider": "google",
            "avatar_url": claims.get("picture"),
            "created_at": now,
            "updated_at": now,
        }
        try:
            result = users_collection().insert_one(user)
            user["_id"] = result.inserted_id
        except DuplicateKeyError:
            user = users_collection().find_one({"email": email})
            if not user:
                raise HTTPException(status_code=409, detail="Could not link this Google account")

    return {"user": public_user(user), "token": create_access_token(str(user["_id"]), user["username"])}
