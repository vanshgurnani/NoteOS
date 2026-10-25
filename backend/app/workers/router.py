from __future__ import annotations

import logging
from typing import Any

from celery.result import AsyncResult
from fastapi import APIRouter, Depends, HTTPException, status

from ..auth import current_user
from .celery_app import celery_app

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tasks", tags=["Background Tasks"])


@router.get("/{task_id}")
def get_task_status(task_id: str, user: dict = Depends(current_user)) -> dict[str, Any]:
    """
    Query the real-time execution status of a Celery background task.
    """
    try:
        res = AsyncResult(task_id, app=celery_app)
        data: dict[str, Any] = {
            "task_id": task_id,
            "status": res.status,
            "ready": res.ready(),
            "successful": res.successful() if res.ready() else False,
        }
        if res.ready():
            if res.successful():
                data["result"] = res.result
            else:
                data["error"] = str(res.result)
        elif res.status == "PROGRESS":
            data["progress"] = res.info
        return data
    except Exception as exc:
        logger.error(f"Error checking task status for {task_id}: {exc}")
        return {"task_id": task_id, "status": "UNKNOWN", "error": str(exc)}


@router.post("/{task_id}/revoke")
def revoke_task(
    task_id: str,
    terminate: bool = False,
    user: dict = Depends(current_user),
) -> dict[str, Any]:
    """
    Revoke or cancel a queued or running background task.
    """
    try:
        celery_app.control.revoke(task_id, terminate=terminate)
        return {"status": "revoked", "task_id": task_id, "terminated": terminate}
    except Exception as exc:
        logger.error(f"Error revoking task {task_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to revoke task: {exc}",
        )
