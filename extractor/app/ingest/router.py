"""Unified file and text ingestion router."""

import hashlib
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional
from app.ingest.pdf_reader import read_pdf
from app.ingest.docx_reader import read_docx
from app.ingest.image_reader import read_image
from app.ingest.text_reader import read_text


@dataclass
class IngestionResult:
    """Structured container holding parsed document content and metadata."""
    source_file: str
    source_type: str  # "pdf_text" | "pdf_scanned" | "image" | "docx" | "raw_text"
    sha256: str
    page_count: int
    raw_text: str
    page_texts: Dict[int, str]
    image_bytes_list: List[bytes] = field(default_factory=list)
    is_scanned: bool = False


def calculate_sha256(data: bytes) -> str:
    """Compute hex SHA-256 digest of input bytes."""
    return hashlib.sha256(data).hexdigest()


def ingest_file(file_bytes: bytes, filename: str) -> IngestionResult:
    """Ingest a document file based on extension and magic bytes.

    Raises:
        ValueError: If file format is unsupported or corrupted.
    """
    if not file_bytes:
        raise ValueError("File content is empty (0 bytes)")

    ext = Path(filename).suffix.lower()
    sha256_hash = calculate_sha256(file_bytes)

    if ext == ".pdf":
        try:
            raw_text, page_texts, page_count, is_scanned, images = read_pdf(file_bytes)
        except Exception as e:
            raise ValueError(f"Corrupt or invalid PDF file: {e}") from e

        source_type = "pdf_scanned" if is_scanned else "pdf_text"
        return IngestionResult(
            source_file=filename,
            source_type=source_type,
            sha256=sha256_hash,
            page_count=page_count,
            raw_text=raw_text,
            page_texts=page_texts,
            image_bytes_list=images,
            is_scanned=is_scanned,
        )

    elif ext in {".docx"}:
        try:
            raw_text, page_texts, page_count = read_docx(file_bytes)
        except Exception as e:
            raise ValueError(f"Corrupt or invalid DOCX file: {e}") from e

        return IngestionResult(
            source_file=filename,
            source_type="docx",
            sha256=sha256_hash,
            page_count=page_count,
            raw_text=raw_text,
            page_texts=page_texts,
            image_bytes_list=[],
            is_scanned=False,
        )

    elif ext in {".png", ".jpg", ".jpeg", ".webp"}:
        try:
            raw_text, page_texts, page_count, images = read_image(file_bytes, filename)
        except Exception as e:
            raise ValueError(f"Corrupt or invalid image file: {e}") from e

        return IngestionResult(
            source_file=filename,
            source_type="image",
            sha256=sha256_hash,
            page_count=page_count,
            raw_text=raw_text,
            page_texts=page_texts,
            image_bytes_list=images,
            is_scanned=True,
        )

    elif ext in {".txt"}:
        try:
            text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            text = file_bytes.decode("latin-1", errors="replace")

        raw_text, page_texts, page_count = read_text(text)
        return IngestionResult(
            source_file=filename,
            source_type="raw_text",
            sha256=sha256_hash,
            page_count=page_count,
            raw_text=raw_text,
            page_texts=page_texts,
            image_bytes_list=[],
            is_scanned=False,
        )

    else:
        raise ValueError(f"Unsupported file type: '{ext}'. Allowed: .pdf, .docx, .png, .jpg, .jpeg, .webp, .txt")


def ingest_text(text: str, filename: str = "raw_text.txt") -> IngestionResult:
    """Ingest raw string input directly."""
    if not text or not text.strip():
        raise ValueError("Provided text is empty")

    file_bytes = text.encode("utf-8")
    sha256_hash = calculate_sha256(file_bytes)
    raw_text, page_texts, page_count = read_text(text)

    return IngestionResult(
        source_file=filename,
        source_type="raw_text",
        sha256=sha256_hash,
        page_count=page_count,
        raw_text=raw_text,
        page_texts=page_texts,
        image_bytes_list=[],
        is_scanned=False,
    )
