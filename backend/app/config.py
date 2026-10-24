import os


class Settings:
    app_name = os.getenv("APP_NAME", "NoteOS API")
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    mongo_db = os.getenv("MONGO_DB", "noteform")
    jwt_secret = os.getenv("JWT_SECRET", "change-me-in-production")
    jwt_expiry_minutes = int(os.getenv("JWT_EXPIRY_MINUTES", "10080"))
    # Always permit the production Vercel frontend, local development, and Render frontend
    _default_origins = [
        "https://noteform-blush.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://noteform-1.onrender.com",
    ]
    _env_origins = []
    for origin in os.getenv("CORS_ORIGINS", "").split(","):
        cleaned = origin.strip().rstrip("/")
        if not cleaned:
            continue
        if cleaned.startswith("http://") or cleaned.startswith("https://"):
            _env_origins.append(cleaned)
        else:
            _env_origins.append(f"https://{cleaned}")
            _env_origins.append(f"http://{cleaned}")
    cors_origins = list(dict.fromkeys([o.rstrip("/") for o in _default_origins] + _env_origins))
    cors_origin_regex = os.getenv("CORS_ORIGIN_REGEX", r"https://.*(\.vercel\.app|\.onrender\.com)")
    mcp_api_key = os.getenv("MCP_API_KEY", "")
    _raw_mcp_url = os.getenv("MCP_PUBLIC_URL", "https://mcp.example.com/mcp").strip().rstrip("/")
    if _raw_mcp_url and not (_raw_mcp_url.startswith("http://") or _raw_mcp_url.startswith("https://")):
        _raw_mcp_url = f"https://{_raw_mcp_url}"
    mcp_public_url = _raw_mcp_url

    # AI & RAG Configuration
    gemini_api_key = os.getenv("GEMINI_API_KEY", "")
    gemini_api_keys = [
        k.strip() for k in os.getenv("GEMINI_API_KEYS", os.getenv("GEMINI_API_KEY", "")).split(",") if k.strip()
    ]
    groq_api_key = os.getenv("GROQ_API_KEY", "")
    groq_api_keys = [
        k.strip() for k in os.getenv("GROQ_API_KEYS", os.getenv("GROQ_API_KEY", "")).split(",") if k.strip()
    ]
    ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    ollama_model = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
    default_ai_model = os.getenv("DEFAULT_AI_MODEL", "gemini-2.0-flash")
    rag_chunk_size = int(os.getenv("RAG_CHUNK_SIZE", "300"))
    rag_chunk_overlap = int(os.getenv("RAG_CHUNK_OVERLAP", "40"))


settings = Settings()
