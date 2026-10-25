#!/bin/sh
set -e

# If a Redis broker URL is available, start the Celery background worker & scheduler
if [ -n "$REDIS_URL" ] || [ -n "$CELERY_BROKER_URL" ]; then
  echo "[entrypoint] Starting Celery worker with embedded beat scheduler in background..."
  celery -A app.workers.celery_app worker --beat --loglevel=info --concurrency=2 &
else
  echo "[entrypoint] No Redis URL provided; running in sync fallback mode without Celery worker."
fi

# Start FastAPI with Uvicorn in the foreground (binds to Render's assigned $PORT)
echo "[entrypoint] Starting Uvicorn FastAPI server on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
