"""Test structured error mapping and duplicate detection by SHA-256 + Model."""

import pytest
from app.errors import (
    GeminiKeyMissingError,
    GeminiKeyInvalidError,
    GeminiModelUnavailableError,
    GeminiRateLimitedError,
    GeminiUnreachableError,
    ExtractionInvalidOutputError,
    DocumentUnreadableError,
    GeminiBlockedError,
)
from app.schemas import MedicalDocumentExtraction, DocumentMetadata, ExtractorInfo
from app.storage import find_duplicate, save_extraction


def test_typed_error_structure():
    """Verify error_code, message, and hint are populated for all typed exceptions."""
    errs = [
        GeminiKeyMissingError(),
        GeminiKeyInvalidError(),
        GeminiModelUnavailableError("gemini-test"),
        GeminiRateLimitedError(),
        GeminiUnreachableError(),
        ExtractionInvalidOutputError(),
        DocumentUnreadableError(),
        GeminiBlockedError("safety check"),
    ]

    for err in errs:
        d = err.to_dict()
        assert "error_code" in d
        assert "message" in d
        assert "hint" in d
        assert len(d["error_code"]) > 0
        assert len(d["hint"]) > 0


def test_duplicate_lookup_sha256_and_model(tmp_path):
    """Verify duplicate lookup requires matching BOTH sha256 and model."""
    doc_meta = DocumentMetadata(
        document_id="doc-dup-1",
        source_file="note.txt",
        source_type="raw_text",
        sha256="hash123456",
        page_count=1,
        doc_type="prescription",
        extracted_at="2026-11-12T12:00:00Z",
        extractor=ExtractorInfo(provider="gemini", model="gemini-3.5-flash-lite", version="1.0"),
    )
    extraction = MedicalDocumentExtraction(document=doc_meta)
    save_extraction(extraction, output_dir=tmp_path)

    # 1. Matching sha256 + model -> found
    dup = find_duplicate("hash123456", "gemini-3.5-flash-lite", output_dir=tmp_path)
    assert dup is not None
    assert dup.document.document_id == "doc-dup-1"

    # 2. Matching sha256 but different model -> NOT a duplicate
    diff_model = find_duplicate("hash123456", "gemini-3.8-flash", output_dir=tmp_path)
    assert diff_model is None

    # 3. Different sha256 -> NOT a duplicate
    diff_hash = find_duplicate("differenthash", "gemini-3.5-flash-lite", output_dir=tmp_path)
    assert diff_hash is None
