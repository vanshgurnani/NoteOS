from __future__ import annotations

import datetime
import logging
from typing import Any, Callable, Optional

from bson import ObjectId

from ..database import notes_collection, rag_query_cache_collection
from ..rag.cache import invalidate_user_rag_cache
from ..rag.retriever import delete_note_chunks, index_all_user_notes, index_note
from .celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.workers.tasks.index_note_task", bind=True, max_retries=3, default_retry_delay=5)
def index_note_task(self, note_id: str, owner_id: str) -> dict[str, Any]:
    """
    Background worker task to chunk and embed a note for RAG.
    Decouples embedding generation from the HTTP request cycle.
    """
    try:
        if not ObjectId.is_valid(note_id):
            return {"status": "error", "message": "Invalid note id"}

        note = notes_collection().find_one({"_id": ObjectId(note_id)})
        if not note:
            return {"status": "not_found", "note_id": note_id}

        chunks_indexed = index_note(
            note_id=str(note["_id"]),
            owner_id=owner_id,
            title=note.get("title", ""),
            content=note.get("content", ""),
            category=note.get("category", "general"),
            tags=note.get("tags", []),
        )
        invalidate_user_rag_cache(owner_id)
        return {
            "status": "success",
            "note_id": note_id,
            "chunks_indexed": chunks_indexed,
        }
    except Exception as exc:
        logger.error(f"Error indexing note {note_id}: {exc}", exc_info=True)
        # Retry with exponential backoff on transient errors
        raise self.retry(exc=exc, countdown=min(60, 5 * (2 ** self.request.retries)))


@celery_app.task(name="app.workers.tasks.delete_note_chunks_task")
def delete_note_chunks_task(note_id: str, owner_id: str) -> dict[str, Any]:
    """
    Background worker task to remove indexed chunks when a note is deleted.
    """
    try:
        deleted = delete_note_chunks(note_id, owner_id)
        invalidate_user_rag_cache(owner_id)
        return {"status": "success", "note_id": note_id, "deleted_chunks": deleted}
    except Exception as exc:
        logger.error(f"Error deleting chunks for note {note_id}: {exc}", exc_info=True)
        return {"status": "error", "message": str(exc)}


@celery_app.task(name="app.workers.tasks.reindex_workspace_task", bind=True)
def reindex_workspace_task(self, owner_id: str) -> dict[str, Any]:
    """
    Background worker task to reindex all notes for an entire workspace.
    Reports progress and handles large workspaces asynchronously.
    """
    try:
        self.update_state(state="PROGRESS", meta={"status": "indexing_notes"})
        stats = index_all_user_notes(owner_id)
        invalidate_user_rag_cache(owner_id)
        return {
            "status": "success",
            "owner_id": owner_id,
            "notes_indexed": stats.get("notes_indexed", 0),
            "chunks_indexed": stats.get("chunks_indexed", 0),
        }
    except Exception as exc:
        logger.error(f"Error reindexing workspace for user {owner_id}: {exc}", exc_info=True)
        raise exc


@celery_app.task(name="app.workers.tasks.import_notes_rag_task")
def import_notes_rag_task(note_ids: list[str], owner_id: str) -> dict[str, Any]:
    """
    Background worker task to index newly imported notes from a ZIP archive.
    """
    indexed_count = 0
    total_chunks = 0
    for nid in note_ids:
        try:
            if not ObjectId.is_valid(nid):
                continue
            note = notes_collection().find_one({"_id": ObjectId(nid)})
            if not note:
                continue
            count = index_note(
                note_id=str(note["_id"]),
                owner_id=owner_id,
                title=note.get("title", ""),
                content=note.get("content", ""),
                category=note.get("category", "general"),
                tags=note.get("tags", []),
            )
            indexed_count += 1
            total_chunks += count
        except Exception as exc:
            logger.warning(f"Failed to index imported note {nid}: {exc}")

    invalidate_user_rag_cache(owner_id)
    return {
        "status": "success",
        "notes_indexed": indexed_count,
        "chunks_indexed": total_chunks,
    }


@celery_app.task(name="app.workers.tasks.cleanup_expired_cache_task")
def cleanup_expired_cache_task() -> dict[str, Any]:
    """
    Periodic task run by Celery Beat to purge expired RAG cache entries.
    """
    try:
        col = rag_query_cache_collection()
        now = datetime.datetime.utcnow()
        res = col.delete_many({"expires_at": {"$lt": now}})
        logger.info(f"Cleaned up {res.deleted_count} expired RAG cache entries.")
        return {"status": "success", "deleted_count": res.deleted_count}
    except Exception as exc:
        logger.error(f"Error cleaning expired cache: {exc}", exc_info=True)
        return {"status": "error", "message": str(exc)}


def dispatch_background_task(
    task: Any,
    *args: Any,
    sync_fallback: Optional[Callable[..., Any]] = None,
    **kwargs: Any,
) -> Optional[str]:
    """
    Robust dispatch helper for enqueuing Celery tasks.
    If Redis or Celery broker is unavailable, gracefully falls back
    to running the sync_fallback function or logs a warning without crashing the API.
    Returns the task ID if queued, or None.
    """
    try:
        async_result = task.delay(*args, **kwargs)
        return str(async_result.id)
    except Exception as exc:
        logger.warning(
            f"Celery task dispatch failed for '{getattr(task, 'name', str(task))}': {exc}. "
            "Falling back to synchronous execution if provided."
        )
        if sync_fallback is not None:
            try:
                try:
                    sync_fallback(*args, **kwargs)
                except TypeError:
                    sync_fallback()
            except Exception as fallback_exc:
                logger.error(f"Sync fallback also failed: {fallback_exc}", exc_info=True)
        return None

