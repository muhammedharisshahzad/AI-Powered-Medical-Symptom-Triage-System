import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[3]
load_dotenv(BASE_DIR / ".env")


def get_settings() -> dict:
    return {
        "groq_api_key": os.getenv("GROQ_API_KEY", ""),
        "groq_model": os.getenv("GROQ_MODEL", "llama-3.1-70b-versatile"),
        "backend_host": os.getenv("BACKEND_HOST", "127.0.0.1"),
        "backend_port": int(os.getenv("BACKEND_PORT", "8000")),
    }
