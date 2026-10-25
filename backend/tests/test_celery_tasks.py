from __future__ import annotations

import unittest
from unittest.mock import MagicMock, patch

from app.workers import (
    celery_app,
    cleanup_expired_cache_task,
    delete_note_chunks_task,
    dispatch_background_task,
    import_notes_rag_task,
    index_note_task,
    reindex_workspace_task,
    tasks_router,
)


class TestCeleryTasksAndDispatch(unittest.TestCase):
    def test_celery_app_configuration(self):
        self.assertEqual(celery_app.main, "noteos_workers")
        self.assertIn("cleanup-expired-rag-cache-daily", celery_app.conf.beat_schedule)

    def test_task_registration(self):
        registered_tasks = celery_app.tasks
        self.assertIn("app.workers.tasks.index_note_task", registered_tasks)
        self.assertIn("app.workers.tasks.delete_note_chunks_task", registered_tasks)
        self.assertIn("app.workers.tasks.reindex_workspace_task", registered_tasks)
        self.assertIn("app.workers.tasks.import_notes_rag_task", registered_tasks)
        self.assertIn("app.workers.tasks.cleanup_expired_cache_task", registered_tasks)

    def test_dispatch_fallback_when_broker_fails(self):
        mock_task = MagicMock()
        mock_task.delay.side_effect = ConnectionError("Redis is offline")

        fallback_called = []

        def sync_cb(arg1, arg2):
            fallback_called.append((arg1, arg2))

        # Test arg-accepting fallback
        task_id = dispatch_background_task(mock_task, "note-123", "user-456", sync_fallback=sync_cb)
        self.assertIsNone(task_id)
        self.assertEqual(fallback_called, [("note-123", "user-456")])

        # Test 0-arg fallback
        fallback_no_args = []
        task_id2 = dispatch_background_task(
            mock_task, "note-999", "user-888", sync_fallback=lambda: fallback_no_args.append(True)
        )
        self.assertIsNone(task_id2)
        self.assertEqual(fallback_no_args, [True])

    def test_dispatch_success_returns_task_id(self):
        mock_task = MagicMock()
        mock_async_res = MagicMock()
        mock_async_res.id = "mocked-task-uuid-123"
        mock_task.delay.return_value = mock_async_res

        task_id = dispatch_background_task(mock_task, "note-123", "user-456")
        self.assertEqual(task_id, "mocked-task-uuid-123")


if __name__ == "__main__":
    unittest.main()
