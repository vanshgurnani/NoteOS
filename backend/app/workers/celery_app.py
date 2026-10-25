from __future__ import annotations

import logging
from celery import Celery

from ..config import settings

logger = logging.getLogger(__name__)

celery_app = Celery(
    "noteos_workers",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=600,  # 10 minute hard execution limit
    task_soft_time_limit=540,  # 9 minute soft limit
    broker_connection_retry_on_startup=True,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    beat_schedule={
        "cleanup-expired-rag-cache-daily": {
            "task": "app.workers.tasks.cleanup_expired_cache_task",
            "schedule": 86400.0,  # Every 24 hours
        },
    },
)

if __name__ == "__main__":
    celery_app.start()
