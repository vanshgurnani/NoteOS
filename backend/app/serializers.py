from datetime import datetime
from typing import Any


def _format_datetime(val: Any) -> str:
    if val is None:
        return datetime.utcnow().isoformat()
    if isinstance(val, str):
        return val
    if hasattr(val, "isoformat"):
        return val.isoformat()
    return str(val)


def serialize_note(note: dict) -> dict:
    tags = note.get("tags")
    if not isinstance(tags, list):
        tags = []
    else:
        tags = [tag for tag in tags if isinstance(tag, str)]

    return {
        "id": str(note["_id"]),
        "title": note.get("title", "Untitled"),
        "content": note.get("content", ""),
        "category": note.get("category", "General"),
        "icon": note.get("icon", "✦"),
        "parent_id": str(note["parent_id"]) if note.get("parent_id") else None,
        "source_url": note.get("source_url"),
        "inbox": bool(note.get("inbox", False)),
        "version": int(note.get("version", 1)),
        "bookmarked": bool(note.get("bookmarked", False)),
        "pinned": bool(note.get("pinned", False)),
        "tags": tags,
        "is_public": bool(note.get("is_public", False)),
        "public_id": note.get("public_id"),
        "created_at": _format_datetime(note.get("created_at")),
        "updated_at": _format_datetime(note.get("updated_at")),
    }


def serialize_public_note(note: dict) -> dict:
    tags = note.get("tags")
    if not isinstance(tags, list):
        tags = []
    else:
        tags = [tag for tag in tags if isinstance(tag, str)]

    return {
        "title": note.get("title", "Untitled"),
        "content": note.get("content", ""),
        "category": note.get("category", "General"),
        "icon": note.get("icon", "✦"),
        "tags": tags,
        "created_at": _format_datetime(note.get("created_at")),
        "updated_at": _format_datetime(note.get("updated_at")),
    }
