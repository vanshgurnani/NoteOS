from __future__ import annotations

import hashlib
import os
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from pymongo import ASCENDING

from .auth import current_user
from .database import db, notes_collection, users_collection

router = APIRouter(tags=["collaboration"])


class InviteCreate(BaseModel):
    recipient: str = Field(min_length=3, max_length=254)
    role: str = "editor"


def note_access(note: dict, user: dict, write: bool = False) -> str | None:
    if str(note.get("owner_id")) == str(user["_id"]):
        return "owner"
    email = (user.get("email") or "").strip().lower()
    collaborator = next(
        (entry for entry in note.get("collaborators", [])
         if entry.get("email", "").strip().lower() == email),
        None,
    )
    if not collaborator or not collaborator.get("accepted_at"):
        return None
    if not (user.get("google_id") and user.get("auth_provider") in {"google", "dual"}):
        raise HTTPException(status_code=403, detail={
            "error": "google_auth_required",
            "message": "Sign in with Google using the invited email address to open this shared note.",
        })
    if write and collaborator.get("role") != "editor":
        raise HTTPException(status_code=403, detail="You have view-only access to this note")
    return collaborator.get("role", "viewer")


def _note_or_404(note_id: str, user: dict, write: bool = False) -> dict:
    if not ObjectId.is_valid(note_id):
        raise HTTPException(status_code=400, detail="Invalid note id")
    note = notes_collection().find_one({"_id": ObjectId(note_id)})
    if not note or not note_access(note, user, write=write):
        raise HTTPException(status_code=404, detail="Note not found")
    return note


def _send_invite(email: str, inviter: dict, note: dict, token: str) -> bool:
    host = os.getenv("SMTP_HOST", "")
    if not host:
        return False
    message = EmailMessage()
    message["Subject"] = f'{inviter.get("username", "A teammate")} invited you to edit "{note.get("title", "a note")}" on NoteOS'
    message["From"] = os.getenv("SMTP_FROM_EMAIL", os.getenv("SMTP_USER", ""))
    message["To"] = email
    app_url = os.getenv("APP_URL", "http://localhost:3000").rstrip("/")
    link = f"{app_url}/invite/{token}"
    message.set_content(
        f'{inviter.get("username", "A teammate")} invited you to collaborate on "{note.get("title", "a note")}" in NoteOS.\n\n'
        f'Sign in with Google using {email}, then open this invitation: {link}\n\n'
        f"You have {note.get('invite_role', 'editor')} access to this note. If you were not expecting this invitation, you can ignore this email."
    )
    port = int(os.getenv("SMTP_PORT", "587"))
    with smtplib.SMTP(host, port, timeout=12) as server:
        if os.getenv("SMTP_USE_TLS", "true").lower() == "true":
            server.starttls()
        username = os.getenv("SMTP_USER", "")
        password = os.getenv("SMTP_PASSWORD", "")
        if username:
            server.login(username, password)
        server.send_message(message)
    return True


@router.post("/notes/{note_id}/invites")
def invite_member(note_id: str, payload: InviteCreate, user: dict = Depends(current_user)):
    note = _note_or_404(note_id, user)
    if str(note.get("owner_id")) != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Only the note owner can invite collaborators")
    if payload.role not in {"editor", "viewer"}:
        raise HTTPException(status_code=422, detail="Role must be editor or viewer")
    recipient = payload.recipient.strip()
    matched = users_collection().find_one({
        "$or": [{"email": recipient.lower()}, {"username": recipient}]
    })
    email = (matched or {}).get("email", recipient if "@" in recipient else "").strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=404, detail="Enter a registered username or a valid email address")
    if email == (user.get("email") or "").lower():
        raise HTTPException(status_code=400, detail="You already own this note")
    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    db.note_invites.insert_one({
        "token_hash": hashlib.sha256(token.encode()).hexdigest(),
        "note_id": note["_id"],
        "email": email,
        "role": payload.role,
        "invited_by": user["_id"],
        "created_at": now,
        "expires_at": now + timedelta(days=7),
        "accepted_at": None,
    })
    collaborators = [c for c in note.get("collaborators", []) if c.get("email") != email]
    collaborators.append({
        "email": email, "role": payload.role, "invited_by": user["_id"],
        "invited_at": now, "accepted_at": None,
    })
    notes_collection().update_one({"_id": note["_id"], "owner_id": user["_id"]}, {"$set": {"collaborators": collaborators}})
    email_sent = False
    note["invite_role"] = payload.role
    try:
        email_sent = _send_invite(email, user, note, token)
    except (OSError, smtplib.SMTPException):
        # Keep the invite pending so an owner can resend after configuring SMTP.
        pass
    return {
        "success": True,
        "email": email,
        "role": payload.role,
        "email_sent": email_sent,
        "invite_url": f'{os.getenv("APP_URL", "http://localhost:3000").rstrip("/")}/invite/{token}',
        "message": "Invitation created" if email_sent else "Invitation saved; configure SMTP to deliver email",
    }


@router.post("/invites/{token}/accept")
def accept_invite(token: str, user: dict = Depends(current_user)):
    if not user.get("google_id") or user.get("auth_provider") not in {"google", "dual"}:
        raise HTTPException(status_code=403, detail="Sign in with Google to accept this invitation")
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    invite = db.note_invites.find_one({
        "token_hash": token_hash,
        "email": (user.get("email") or "").lower(),
        "accepted_at": None,
        "expires_at": {"$gt": datetime.now(timezone.utc)},
    })
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation is invalid, expired, or belongs to another email")
    notes_collection().update_one(
        {"_id": invite["note_id"], "collaborators.email": invite["email"]},
        {"$set": {"collaborators.$.accepted_at": datetime.now(timezone.utc)}},
    )
    db.note_invites.update_one({"_id": invite["_id"]}, {"$set": {"accepted_at": datetime.now(timezone.utc)}})
    return {"success": True, "note_id": str(invite["note_id"]), "role": invite["role"]}


@router.get("/notes/shared-with-me")
def shared_notes(user: dict = Depends(current_user)):
    if not user.get("google_id"):
        return {"notes": []}
    notes = notes_collection().find({"collaborators": {"$elemMatch": {"email": (user.get("email") or "").lower(), "accepted_at": {"$ne": None}}}}).sort("updated_at", -1)
    return {"notes": [{
        "id": str(note["_id"]), "title": note.get("title", "Untitled"),
        "icon": note.get("icon", "✦"), "category": note.get("category", "General"),
        "role": next((c.get("role", "viewer") for c in note.get("collaborators", []) if c.get("email") == user.get("email", "").lower()), "viewer"),
        "owner": str(note.get("owner_id")), "updated_at": note.get("updated_at"),
    } for note in notes]}


@router.get("/notes/{note_id}/collaborators")
def list_collaborators(note_id: str, user: dict = Depends(current_user)):
    note = _note_or_404(note_id, user)
    return {"collaborators": [
        {"email": c.get("email"), "role": c.get("role", "viewer"), "invited_at": c.get("invited_at")}
        for c in note.get("collaborators", [])
    ]}


@router.delete("/notes/{note_id}/invites/{email}")
def remove_collaborator(note_id: str, email: str, user: dict = Depends(current_user)):
    note = _note_or_404(note_id, user)
    if str(note.get("owner_id")) != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Only the note owner can remove collaborators")
    normalized = email.strip().lower()
    notes_collection().update_one({"_id": note["_id"]}, {"$pull": {"collaborators": {"email": normalized}}})
    return {"success": True}
