from __future__ import annotations

import os
from typing import Optional



class Settings:
    app_name = os.getenv("APP_NAME", "NoteOS API")
    google_client_id = os.getenv("GOOGLE_CLIENT_ID", "")
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    mongo_db = os.getenv("MONGO_DB", "noteform")
    jwt_secret = os.getenv("JWT_SECRET", "change-me-in-production")
    jwt_expiry_minutes = int(os.getenv("JWT_EXPIRY_MINUTES", "10080"))
    # Permitted origins for frontend connections
    _default_origins = [
        "https://noteform-blush.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "https://noteform-1.onrender.com",
    ]
    _env_origins = []
    _raw_cors = os.getenv("CORS_ORIGINS", "").strip()
    if _raw_cors == "*":
        cors_origins = ["*"]
    else:
        for origin in _raw_cors.split(","):
            cleaned = origin.strip().rstrip("/")
            if not cleaned:
                continue
            if cleaned == "*":
                _env_origins = ["*"]
                break
            if cleaned.startswith("http://") or cleaned.startswith("https://"):
                _env_origins.append(cleaned)
            else:
                _env_origins.append(f"https://{cleaned}")
                _env_origins.append(f"http://{cleaned}")
        if "*" in _env_origins:
            cors_origins = ["*"]
        else:
            cors_origins = list(dict.fromkeys([o.rstrip("/") for o in _default_origins] + _env_origins))

    # Match any valid http/https origin by default (Render, Vercel, localhost, custom domains)
    cors_origin_regex = os.getenv("CORS_ORIGIN_REGEX", r"^https?:\/\/.*$")

    def is_origin_allowed(self, origin: Optional[str]) -> bool:
        if not origin:
            return True
        if "*" in self.cors_origins:
            return True
        if origin.rstrip("/") in self.cors_origins:
            return True
        if self.cors_origin_regex:
            import re
            return bool(re.match(self.cors_origin_regex, origin))
        return False
    mcp_api_key = os.getenv("MCP_API_KEY", "")
    _raw_mcp_url = os.getenv("MCP_PUBLIC_URL", "https://mcp.example.com/mcp").strip().rstrip("/")
    if _raw_mcp_url and not (_raw_mcp_url.startswith("http://") or _raw_mcp_url.startswith("https://")):
        _raw_mcp_url = f"https://{_raw_mcp_url}"
    mcp_public_url = _raw_mcp_url

    # AI & RAG Configuration
    gemini_api_key = os.getenv("GEMINI_API_KEY", "")
    llama_gateway_url = os.getenv("LLAMA_GATEWAY_URL", "https://llama-api-gateway.onrender.com").rstrip("/")
    llama_gateway_api_key = os.getenv("LLAMA_GATEWAY_API_KEY", "")
    llama_gateway_model = os.getenv("LLAMA_GATEWAY_MODEL", "llama-3.2-3b-instruct")
    gemini_api_keys = [
        k.strip() for k in os.getenv("GEMINI_API_KEYS", os.getenv("GEMINI_API_KEY", "")).split(",") if k.strip()
    ]
    groq_api_key = os.getenv("GROQ_API_KEY", "")
    groq_api_keys = [
        k.strip() for k in os.getenv("GROQ_API_KEYS", os.getenv("GROQ_API_KEY", "")).split(",") if k.strip()
    ]
    ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    ollama_model = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
    custom_ai_base_url = os.getenv("CUSTOM_AI_BASE_URL", os.getenv("OLLAMA_BASE_URL", "")).rstrip("/")
    custom_ai_api_key = os.getenv("CUSTOM_AI_API_KEY", "")
    custom_ai_model = os.getenv("CUSTOM_AI_MODEL", os.getenv("OLLAMA_MODEL", "gpt-4o-mini"))
    default_ai_model = os.getenv("DEFAULT_AI_MODEL", "gemini-3.8-flash")
    rag_chunk_size = int(os.getenv("RAG_CHUNK_SIZE", "300"))
    rag_chunk_overlap = int(os.getenv("RAG_CHUNK_OVERLAP", "40"))


settings = Settings()
