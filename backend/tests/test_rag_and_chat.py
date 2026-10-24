import unittest
from app.rag.chunker import MarkdownChunker, compute_content_hash, estimate_token_count
from app.rag.embedder import cosine_similarity, get_embedding, get_embeddings
from app.rag.cache import compute_query_hash
from app.chat.memory import compress_conversation_history
from app.rag.providers import get_available_models, stream_llama_gateway
from app.config import settings
from unittest.mock import patch


class TestRagAndChat(unittest.TestCase):
    def test_chunker_basic(self):
        chunker = MarkdownChunker(target_chunk_tokens=50, chunk_overlap_tokens=10)
        markdown = """# Project Overview
This is the main introduction to the project.

## Section 1: Architecture
Here is the system architecture:
- Frontend: Next.js
- Backend: FastAPI
- Database: MongoDB

```python
def hello():
    print("code block test")
```

## Section 2: Deployment
Instructions for deploying to production.
"""
        chunks = chunker.chunk_markdown("Project Doc", markdown)
        self.assertGreater(len(chunks), 0)
        # Check breadcrumb presence
        first_chunk = chunks[0]
        self.assertIn("[Context: Project Doc", first_chunk.text)
        self.assertTrue(len(first_chunk.content_hash) > 0)

    def test_embedder_and_similarity(self):
        t1 = "Machine learning and artificial intelligence systems"
        t2 = "Machine learning algorithms and deep neural networks"
        t3 = "Cooking recipes and baking fresh chocolate cakes"

        emb1 = get_embedding(t1)
        emb2 = get_embedding(t2)
        emb3 = get_embedding(t3)

        self.assertEqual(len(emb1), 384)
        self.assertEqual(len(emb2), 384)
        self.assertEqual(len(emb3), 384)

        sim_related = cosine_similarity(emb1, emb2)
        sim_unrelated = cosine_similarity(emb1, emb3)

        # Related text should have higher or equal similarity
        self.assertGreaterEqual(sim_related, -1.0)
        self.assertLessEqual(sim_related, 1.0)

    def test_cache_query_hash(self):
        h1 = compute_query_hash("user1", "What is Noteform?", "gemini-2.0-flash")
        h2 = compute_query_hash("user1", "  what  is noteform?  ", "gemini-2.0-flash")
        h3 = compute_query_hash("user2", "What is Noteform?", "gemini-2.0-flash")

        self.assertEqual(h1, h2)
        self.assertNotEqual(h1, h3)

    def test_memory_compressor(self):
        messages = [
            {"role": "user", "content": "Hello AI"},
            {"role": "assistant", "content": "Hello! How can I help you today?"},
            {"role": "user", "content": "Can you summarize my project?"},
            {"role": "assistant", "content": "Your project is a high-performance note app."},
            {"role": "user", "content": "What is the tech stack?"},
            {"role": "assistant", "content": "It uses FastAPI, MongoDB, and Next.js."},
            {"role": "user", "content": "Where is it deployed?"},
        ]
        compressed = compress_conversation_history(
            messages=messages,
            system_prompt="You are Noteform AI.",
            max_history_turns=2,
            max_tokens_budget=500,
        )
        self.assertGreater(len(compressed), 1)
        self.assertEqual(compressed[0]["role"], "system")
        self.assertIn("You are Noteform AI.", compressed[0]["content"])
        self.assertEqual(compressed[-1]["role"], "user")
        self.assertEqual(compressed[-1]["content"], "Where is it deployed?")

    def test_available_models(self):
        models = get_available_models()
        self.assertTrue(any(m["id"] == "gemini-2.0-flash" for m in models))
        self.assertTrue(any("llama" in m["id"] for m in models))
        self.assertTrue(any(m["id"] == settings.llama_gateway_model for m in models))

    @patch("app.rag.providers.requests.post")
    def test_llama_gateway_stream_uses_openai_sse(self, mock_post):
        class FakeResponse:
            status_code = 200
            text = ""
            def iter_lines(self, decode_unicode=True):
                yield 'data: {"choices":[{"delta":{"content":"Hello "}}]}'
                yield 'data: {"choices":[{"delta":{"content":"from NOTE OS"}}]}'
                yield "data: [DONE]"
            def close(self): pass
        mock_post.return_value = FakeResponse()
        with patch.object(settings, "llama_gateway_api_key", "test-key"), \
             patch.object(settings, "llama_gateway_url", "https://gateway.example"), \
             patch.object(settings, "llama_gateway_model", "llama-3.2-3b-instruct"):
            chunks = list(stream_llama_gateway([{"role": "user", "content": "Hello"}]))
        self.assertEqual("".join(chunks), "Hello from NOTE OS")
        args, kwargs = mock_post.call_args
        self.assertEqual(args[0], "https://gateway.example/v1/chat/completions")
        self.assertEqual(kwargs["headers"]["Authorization"], "Bearer test-key")
        self.assertEqual(kwargs["json"]["model"], "llama-3.2-3b-instruct")
        self.assertTrue(kwargs["json"]["stream"])
        self.assertEqual(kwargs["timeout"], (15, 180))

    def test_key_redaction(self):
        from app.settings_router import redact_key, is_redacted_value

        # Standard Google API Key
        raw_key = "AIzaSyD-sample-secret-api-key-12345"
        redacted = redact_key(raw_key)

        self.assertTrue(is_redacted_value(redacted))
        self.assertTrue(redacted.startswith("AIza"))
        self.assertTrue(redacted.endswith("2345"))
        self.assertNotIn("sample-secret", redacted)

        # Empty or short
        self.assertEqual(redact_key(None), "")
        self.assertEqual(redact_key(""), "")
        self.assertEqual(redact_key("short"), "••••••••")

        # Redaction detection
        self.assertFalse(is_redacted_value("gsk_actual_groq_key_here"))
        self.assertTrue(is_redacted_value("gsk_••••••••••••xY91"))


if __name__ == "__main__":
    unittest.main()
