"""Application configuration and environment variables."""

import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env explicitly from project root regardless of working directory
load_dotenv(dotenv_path=BASE_DIR / ".env", override=True)

def get_gemini_api_key() -> str:
    """Retrieve current GEMINI_API_KEY from environment, reloading .env dynamically."""
    load_dotenv(dotenv_path=BASE_DIR / ".env", override=True)
    return os.getenv("GEMINI_API_KEY", "").strip()

def get_gemini_model() -> str:
    """Retrieve current GEMINI_MODEL from environment, reloading .env dynamically."""
    load_dotenv(dotenv_path=BASE_DIR / ".env", override=True)
    return os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite").strip()

OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", str(BASE_DIR / "outputs")))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

BATCHES_DIR = OUTPUT_DIR / "batches"
BATCHES_DIR.mkdir(parents=True, exist_ok=True)

MAX_UPLOAD_SIZE_BYTES = int(os.getenv("MAX_UPLOAD_SIZE_BYTES", str(20 * 1024 * 1024)))
MAX_CONCURRENCY = int(os.getenv("MAX_CONCURRENCY", "1"))

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".docx",
    ".txt",
}

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}
