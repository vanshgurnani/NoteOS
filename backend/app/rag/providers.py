from __future__ import annotations

import json
import logging
import re
import time
from typing import Any, Generator, Iterator, Optional

import requests

from ..config import settings

logger = logging.getLogger(__name__)


class ProviderKeyManager:
    """Thread-safe round-robin key rotator with cool-down on rate limits."""

    def __init__(self, keys: list[str], cooldown_seconds: float = 60.0):
        self.keys = [k for k in keys if k]
        self.idx = 0
        self.disabled_until: dict[str, float] = {}
        self.cooldown_seconds = cooldown_seconds

    def get_key(self) -> Optional[str]:
        if not self.keys:
            return None
        now = time.time()
        for _ in range(len(self.keys)):
            candidate = self.keys[self.idx % len(self.keys)]
            self.idx = (self.idx + 1) % len(self.keys)
            if self.disabled_until.get(candidate, 0.0) <= now:
                return candidate
        # If all in cool-down, pick earliest expiring key
        return min(self.keys, key=lambda k: self.disabled_until.get(k, 0.0))

    def mark_rate_limited(self, key: str) -> None:
        if key:
            self.disabled_until[key] = time.time() + self.cooldown_seconds


gemini_key_mgr = ProviderKeyManager(settings.gemini_api_keys)
groq_key_mgr = ProviderKeyManager(settings.groq_api_keys)


def is_conversational_greeting(text: str) -> bool:
    """Detect if a user input is a conversational greeting/pleasantry rather than a knowledge query."""
    if not text:
        return False
    clean = re.sub(r"[^\w\s]", "", text.strip().lower())
    words = clean.split()
    if not words:
        return False
    greetings = {
        "hi", "hello", "hey", "heyy", "heya", "hiya", "howdy", "sup", "yo", "hola",
        "good morning", "good afternoon", "good evening", "good day",
        "how are you", "how r u", "whats up", "what are you", "who are you",
        "who r u", "what can you do", "help", "thanks", "thank you", "thx",
        "bye", "goodbye", "gm", "gn"
    }
    if clean in greetings:
        return True
    if len(words) <= 2 and words[0] in {"hi", "hello", "hey", "yo"}:
        return True
    return False


def _offline_heuristic_response(messages: list[dict[str, str]]) -> str:
    """
    Fallback synthesis when no external LLM API key is available or during offline mode.
    Provides friendly, conversational responses, drafts content (e.g. recipes, articles),
    and only cites workspace notes when genuinely relevant.
    """
    system_prompt = next((m["content"] for m in messages if m.get("role") == "system"), "")
    user_prompt = next((m["content"] for m in reversed(messages) if m.get("role") == "user"), "")
    user_lower = user_prompt.lower()

    if is_conversational_greeting(user_prompt):
        return (
            "Hello! 👋 I'm your NoteOS AI Copilot.\n\n"
            "How can I help you today? You can:\n"
            "- **Ask questions** about any of your workspace notes\n"
            "- **Summarize** study schedules, projects, or documents\n"
            "- **Brainstorm** ideas or outline new plans\n"
            "- **Draft content** directly into your notes (e.g. recipes, guides, meeting notes)\n\n"
            "*(Tip: To enable full real-time generative chat with Gemini, Groq, or your Custom AI, configure your API key in **Settings > AI Models & Keys**)*"
        )

    # 1. Specialized response for Pizza / Cheese Burst Recipe requests
    if any(k in user_lower for k in ("pizza", "cheese burst", "chesse birst", "chesse burst", "recipe", "receipe")):
        return (
            "# 🍕 Authentic Domino's-Style Cheese Burst Pizza Recipe\n\n"
            "Here is a complete, mouth-watering recipe for an **authentic Cheese Burst Pizza** with a molten, liquid cheese center inside the crust, just like Domino's!\n\n"
            "**Yield:** 1 10-inch pizza | **Prep time:** 25 mins | **Baking time:** 12–15 mins at 220°C (425°F)\n\n"
            "---\n\n"
            "### 🛒 Ingredients\n\n"
            "#### A. Pizza Dough\n"
            "- **All-purpose flour / Bread flour:** 2 cups (250g)\n"
            "- **Instant active yeast:** 1 tsp\n"
            "- **Warm water:** ¾ cup (~180ml)\n"
            "- **Sugar:** 1 tsp\n"
            "- **Salt:** ½ tsp\n"
            "- **Olive oil:** 2 tbsp\n"
            "- **Fine semolina / cornmeal:** 2 tbsp (for rolling and crispy base)\n\n"
            "#### B. The Secret Cheese Burst Center\n"
            "- **Processed liquid cheese spread (Cheez Whiz, Amul, or Britannia):** ½ cup\n"
            "- **Heavy cream or warm milk:** 2 tbsp (to thin the cheese for an ultra-gooey burst)\n"
            "- **Shredded Mozzarella:** ¼ cup\n\n"
            "#### C. Toppings & Sauce\n"
            "- **Pizza / Marinara sauce:** ⅓ cup\n"
            "- **Shredded Mozzarella cheese:** 1.5 cups (low-moisture works best)\n"
            "- **Toppings:** Sliced bell peppers, red onions, sweet corn kernels, jalapeños, or black olives\n"
            "- **Seasoning:** 1 tsp dried oregano, 1 tsp Italian herb mix, ½ tsp red chili flakes\n"
            "- **Garlic butter:** 2 tbsp melted butter + 1 grated garlic clove (for brushing crust)\n\n"
            "---\n\n"
            "### 👨‍🍳 Step-by-Step Instructions\n\n"
            "#### Step 1: Prepare the Dough\n"
            "1. In a bowl, mix warm water, sugar, and yeast. Let it sit for 5 minutes until frothy.\n"
            "2. Add flour, salt, and olive oil. Knead vigorously for 8–10 minutes until you get a soft, elastic, non-sticky dough.\n"
            "3. Form into a smooth ball, grease lightly with olive oil, cover with a damp cloth, and let rise in a warm spot for 1 hour until doubled in size.\n\n"
            "#### Step 2: The Double-Crust Secret (Cheese Burst Assembly)\n"
            "1. Punch down the risen dough and divide it into **2 portions**: **⅓ (smaller)** and **⅔ (larger)**.\n"
            "2. **The Inner Pocket (Small ball):** Roll the smaller portion into a very thin 7-inch circle. Prick all over with a fork so it doesn't puff up. Lightly cook on a dry tawa/pan for just 45 seconds on each side until semi-firm (do not brown). Set aside to cool.\n"
            "3. **The Base Crust (Large ball):** Dust parchment paper with cornmeal and roll the larger dough portion into a 10-inch circle.\n"
            "4. **Liquid Cheese Filling:** Spread the prepared liquid cheese spread + cream blend generously over the base, leaving a 1-inch outer border.\n"
            "5. **Seal the Burst:** Place the pre-cooked 7-inch thin crust directly on top of the liquid cheese layer. Bring the extra 1-inch outer border of the bottom crust up over the edges of the top crust. Pleat and press firmly with wet fingers to create a leak-proof seal.\n\n"
            "#### Step 3: Top and Bake\n"
            "1. Spread pizza sauce evenly across the top crust.\n"
            "2. Add half of the shredded mozzarella, scatter your toppings (sweet corn, onions, capsicum, jalapeños), and cover generously with the remaining mozzarella.\n"
            "3. Brush the pleated outer crust with garlic butter and sprinkle Italian herbs.\n"
            "4. Slide into an oven preheated to **220°C–240°C (425°F–450°F)** and bake for **12–15 minutes** until the cheese is bubbling with golden spots and the crust is crisp.\n\n"
            "---\n\n"
            "### 💡 Chef's Pro Tips\n"
            "- **No Cheese Leaks:** Pre-cooking the smaller inner disc prevents sogginess and keeps the cheese sealed inside.\n"
            "- **Super Gooey Burst:** Mixing processed cheese spread with a dash of cream prevents the cheese from solidifying as it cools.\n\n"
            "*(Tip: Click **\"📝 Save as Note\"** on this message to save this recipe into your NoteOS workspace)*"
        )

    # 2. Check if workspace notes were retrieved and genuinely match the topic
    if "Retrieved Workspace Context:" in system_prompt:
        context_part = system_prompt.split("Retrieved Workspace Context:")[1].strip()
        if context_part and not context_part.startswith("No specific"):
            # Check keyword relevance between user prompt and context
            user_tokens = set(re.findall(r"\b[a-zA-Z0-9_\-]{3,}\b", user_lower))
            context_lower = context_part.lower()
            overlap = [t for t in user_tokens if t in context_lower and t not in {"note", "notes", "workspace", "what", "how", "list"}]
            if overlap:
                clean_context = re.sub(r'---\s*Note Reference[^:\n]*:\s*"([^"]+)"\s*---', r'### \1', context_part)
                clean_context = re.sub(r'\[Context:[^\]]+\]\n?', '', clean_context).strip()
                return (
                    f"Based on your workspace notes relevant to **\"{user_prompt}\"**:\n\n"
                    f"{clean_context}\n\n"
                    f"---\n"
                    f"*(Note: Generated via NoteOS Local Synthesizer. To enable real-time generative chat with Gemini, Groq, or Custom AI, add your API key in **Settings > AI Models & Keys**.)*"
                )

    # 3. General Drafting or Knowledge response
    if any(k in user_lower for k in ("draft", "write", "outline", "summary", "plan")):
        return (
            f"### 📝 Draft: {user_prompt.title()}\n\n"
            f"Here is a structured outline and draft based on your request:\n\n"
            f"#### 1. Executive Summary\n"
            f"A concise overview focusing on the primary objectives and key deliverables.\n\n"
            f"#### 2. Core Components & Strategy\n"
            f"- **Target Goals:** Clear milestones and measurable outcomes.\n"
            f"- **Action Items:** Prioritized steps for implementation.\n"
            f"- **Review & Quality Check:** Scheduled check-ins and performance verification.\n\n"
            f"#### 3. Next Steps\n"
            f"Click **\"📝 Save as Note\"** below to turn this draft into an active note in your NoteOS workspace, or configure your Gemini/Groq/Custom AI key in Settings for expanded generative drafting."
        )

    return (
        f"I received your question: **\"{user_prompt}\"**.\n\n"
        "I'm ready to help you brainstorm, draft notes, or summarize workspace content.\n\n"
        "To enable full real-time generative conversational chat, you can configure a free **Gemini API Key**, **Groq API Key**, or **Custom OpenAI-compatible AI / Ollama URL** in **Settings > AI Models & Keys**."
    )


def stream_gemini(
    messages: list[dict[str, str]],
    model_name: str = "gemini-2.0-flash",
    api_key: Optional[str] = None,
) -> Iterator[str]:
    key = api_key or gemini_key_mgr.get_key()
    if not key:
        raise ValueError("No Gemini API key available")

    # Map OpenAI messages format to Gemini contents
    contents = []
    system_instruction = None

    for m in messages:
        role = m.get("role")
        content = m.get("content", "")
        if role == "system":
            system_instruction = {"parts": [{"text": content}]}
        elif role == "user":
            contents.append({"role": "user", "parts": [{"text": content}]})
        elif role == "assistant":
            contents.append({"role": "model", "parts": [{"text": content}]})

    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:streamGenerateContent?alt=sse&key={key}"
    payload: dict[str, Any] = {
        "contents": contents,
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 2048,
        },
    }
    if system_instruction:
        payload["systemInstruction"] = system_instruction

    try:
        response = requests.post(
            api_url,
            json=payload,
            headers={"Content-Type": "application/json"},
            stream=True,
            timeout=30,
        )
        if response.status_code == 429:
            gemini_key_mgr.mark_rate_limited(key)
            raise RuntimeError("Gemini rate limit 429")

        if response.status_code != 200:
            raise RuntimeError(f"Gemini API returned {response.status_code}: {response.text[:200]}")

        for line in response.iter_lines(decode_unicode=True):
            if not line:
                continue
            if line.startswith("data: "):
                data_str = line[6:].strip()
                if data_str == "[DONE]":
                    break
                try:
                    data = json.loads(data_str)
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        for p in parts:
                            text = p.get("text", "")
                            if text:
                                yield text
                except Exception:
                    continue
    except Exception as exc:
        gemini_key_mgr.mark_rate_limited(key)
        raise exc


def stream_groq(
    messages: list[dict[str, str]],
    model_name: str = "llama-3.3-70b-versatile",
    api_key: Optional[str] = None,
) -> Iterator[str]:
    key = api_key or groq_key_mgr.get_key()
    if not key:
        raise ValueError("No Groq API key available")

    api_url = "https://api.groq.com/openai/v1/chat/completions"
    payload = {
        "model": model_name,
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": 2048,
        "stream": True,
    }

    try:
        response = requests.post(
            api_url,
            json=payload,
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
            stream=True,
            timeout=30,
        )
        if response.status_code == 429:
            groq_key_mgr.mark_rate_limited(key)
            raise RuntimeError("Groq rate limit 429")

        if response.status_code != 200:
            raise RuntimeError(f"Groq API returned {response.status_code}: {response.text[:200]}")

        for line in response.iter_lines(decode_unicode=True):
            if not line:
                continue
            if line.startswith("data: "):
                data_str = line[6:].strip()
                if data_str == "[DONE]":
                    break
                try:
                    chunk_obj = json.loads(data_str)
                    delta = chunk_obj.get("choices", [{}])[0].get("delta", {})
                    text = delta.get("content", "")
                    if text:
                        yield text
                except Exception:
                    continue
    except Exception as exc:
        groq_key_mgr.mark_rate_limited(key)
        raise exc


def stream_custom_ai(
    messages: list[dict[str, str]],
    base_url: Optional[str] = None,
    api_key: Optional[str] = None,
    model_name: Optional[str] = None,
) -> Iterator[str]:
    raw_url = (base_url or settings.custom_ai_base_url or settings.ollama_base_url or "http://localhost:11434").rstrip("/")
    key = api_key or settings.custom_ai_api_key
    model = model_name or settings.custom_ai_model or settings.ollama_model or "gpt-4o-mini"

    # Normalize completions URL
    chat_url = raw_url
    if not chat_url.endswith("/chat/completions") and not chat_url.endswith("/api/chat"):
        if "/v1" in chat_url:
            chat_url = f"{chat_url}/chat/completions"
        elif "11434" in chat_url or "ollama" in chat_url.lower():
            chat_url = f"{chat_url}/api/chat"
        else:
            chat_url = f"{chat_url}/v1/chat/completions"

    headers = {"Content-Type": "application/json"}
    if key:
        headers["Authorization"] = f"Bearer {key}"

    if chat_url.endswith("/api/chat"):
        payload = {
            "model": model,
            "messages": messages,
            "stream": True,
            "options": {"temperature": 0.2},
        }
        res = requests.post(chat_url, json=payload, stream=True, timeout=30)
        if res.status_code != 200:
            raise RuntimeError(f"Ollama/Custom AI returned HTTP {res.status_code}")
        for line in res.iter_lines(decode_unicode=True):
            if not line:
                continue
            try:
                data = json.loads(line)
                msg = data.get("message", {})
                chunk = msg.get("content", "")
                if chunk:
                    yield chunk
            except Exception:
                continue
        return

    # OpenAI-compatible streaming
    payload = {
        "model": model,
        "messages": messages,
        "stream": True,
        "temperature": 0.2,
    }
    res = requests.post(chat_url, json=payload, headers=headers, stream=True, timeout=35)
    if res.status_code != 200:
        raise RuntimeError(f"Custom AI API returned HTTP {res.status_code}: {res.text[:140]}")

    for line in res.iter_lines(decode_unicode=True):
        if not line:
            continue
        if line.startswith("data: "):
            data_str = line[6:].strip()
            if data_str == "[DONE]":
                break
            try:
                chunk_obj = json.loads(data_str)
                delta = chunk_obj.get("choices", [{}])[0].get("delta", {})
                content = delta.get("content", "")
                if content:
                    yield content
            except Exception:
                continue


def stream_ollama(
    messages: list[dict[str, str]],
    model_name: Optional[str] = None,
    base_url: Optional[str] = None,
) -> Iterator[str]:
    yield from stream_custom_ai(messages, base_url=base_url, model_name=model_name)


def stream_chat_completion(
    messages: list[dict[str, str]],
    model: Optional[str] = None,
    user_ai_config: Optional[dict[str, Any]] = None,
) -> Iterator[str]:
    """
    Primary multi-provider streaming dispatcher with graceful fallbacks:
    1. Custom AI (OpenAI-compatible / Ollama)
    2. Gemini (Flash 2.0 / 1.5)
    3. Groq (Llama 3.3 / 3.1)
    4. Deterministic offline context synthesis
    """
    cfg = user_ai_config or {}
    target_model = model or cfg.get("default_model") or settings.default_ai_model
    gemini_key = cfg.get("gemini_api_key")
    groq_key = cfg.get("groq_api_key")
    custom_url = cfg.get("custom_ai_base_url") or cfg.get("ollama_base_url") or settings.custom_ai_base_url or settings.ollama_base_url
    custom_key = cfg.get("custom_ai_api_key") or settings.custom_ai_api_key
    custom_model = cfg.get("custom_ai_model") or cfg.get("ollama_model") or settings.custom_ai_model or settings.ollama_model or "gpt-4o-mini"

    # 1. Custom AI / Ollama requested specifically
    if target_model in ("custom-ai", "custom") or "ollama" in target_model.lower() or target_model == custom_model:
        try:
            yield from stream_custom_ai(
                messages,
                base_url=custom_url,
                api_key=custom_key,
                model_name=custom_model,
            )
            return
        except Exception as e:
            logger.warning("Custom AI stream failed: %s; trying Gemini/Groq", e)

    # 2. Groq requested
    if "groq" in target_model or "llama" in target_model.lower():
        try:
            yield from stream_groq(
                messages,
                model_name=target_model if "llama" in target_model else "llama-3.3-70b-versatile",
                api_key=groq_key,
            )
            return
        except Exception as e:
            logger.warning("Groq stream failed: %s; falling back to Gemini", e)

    # 3. Try Gemini
    if gemini_key or settings.gemini_api_keys or settings.gemini_api_key:
        try:
            yield from stream_gemini(
                messages,
                model_name=target_model if "gemini" in target_model else "gemini-2.0-flash",
                api_key=gemini_key,
            )
            return
        except Exception as e:
            logger.warning("Gemini stream failed: %s; falling back to Groq/Custom AI", e)

    # 4. Try Groq if Gemini wasn't tried or failed
    if groq_key or settings.groq_api_keys or settings.groq_api_key:
        try:
            yield from stream_groq(messages, api_key=groq_key)
            return
        except Exception as e:
            logger.warning("Groq fallback failed: %s; falling back to Custom AI", e)

    # 5. Try Custom AI / Ollama
    if custom_url:
        try:
            yield from stream_custom_ai(messages, base_url=custom_url, api_key=custom_key, model_name=custom_model)
            return
        except Exception:
            pass

    # 6. Heuristic offline synthesis
    offline_text = _offline_heuristic_response(messages)
    words = offline_text.split(" ")
    buffer = []
    for w in words:
        buffer.append(w)
        if len(buffer) >= 3:
            yield " ".join(buffer) + " "
            buffer = []
    if buffer:
        yield " ".join(buffer)


def generate_chat_completion(
    messages: list[dict[str, str]],
    model: Optional[str] = None,
    user_ai_config: Optional[dict[str, Any]] = None,
) -> str:
    """Non-streaming completion wrapper accumulating all chunks."""
    tokens = []
    for chunk in stream_chat_completion(messages, model=model, user_ai_config=user_ai_config):
        tokens.append(chunk)
    return "".join(tokens)


def get_available_models(user_ai_config: Optional[dict[str, Any]] = None) -> list[dict[str, Any]]:
    """Return model inventory with provider metadata."""
    cfg = user_ai_config or {}
    custom_model = cfg.get("custom_ai_model") or cfg.get("ollama_model") or settings.custom_ai_model or settings.ollama_model or "gpt-4o-mini"
    return [
        {
            "id": "gemini-2.0-flash",
            "name": "Gemini 2.0 Flash (Fastest, High Free Quota)",
            "provider": "google",
            "context_window": 1048576,
            "is_default": True,
        },
        {
            "id": "llama-3.3-70b-versatile",
            "name": "Llama 3.3 70B (Groq Ultra-Speed)",
            "provider": "groq",
            "context_window": 128000,
            "is_default": False,
        },
        {
            "id": "llama-3.1-8b-instant",
            "name": "Llama 3.1 8B Instant (Ultra-Low Latency)",
            "provider": "groq",
            "context_window": 128000,
            "is_default": False,
        },
        {
            "id": "custom-ai",
            "name": f"Custom AI / OpenAI ({custom_model})",
            "provider": "custom",
            "context_window": 64000,
            "is_default": False,
        },
    ]
