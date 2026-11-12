"""Comprehensive offline tests for health, schema, duplicate caching, lifecycle, retries, and errors."""

import time
import pytest
from fastapi.testclient import TestClient
from google.genai import errors as genai_errors
from app.main import app, BATCH_JOBS
from app.schemas import (
    MedicalDocumentExtraction,
    DocumentMetadata,
    ExtractorInfo,
    ExtractionStats,
    PatientInfo,
)
from app.errors import (
    GeminiKeyMissingError,
    GeminiUnreachableError,
    ExtractionTimeoutError,
)
from app.storage import delete_extraction, find_duplicate, save_extraction
from app.extract.gemini_provider import GeminiProvider

client = TestClient(app)


def make_dummy_doc(doc_id: str, filename: str, sha256: str) -> MedicalDocumentExtraction:
    return MedicalDocumentExtraction(
        schema_version="1.0",
        document=DocumentMetadata(
            document_id=doc_id,
            source_file=filename,
            source_type="raw_text",
            sha256=sha256,
            page_count=1,
            doc_type="prescription",
            extracted_at="2026-11-12T12:00:00Z",
            extractor=ExtractorInfo(provider="gemini", model="gemini-3.5-flash-lite", version="1.0"),
            extraction_stats=ExtractionStats(
                items_extracted=1,
                items_verified=1,
                items_unverified=0,
                timings_ms={"ingest_ms": 1.0, "llm_ms": 100.0, "verify_ms": 2.0, "total_ms": 103.0},
            ),
        ),
        patient=PatientInfo(name="Test Patient", age="40", sex="M"),
        raw_text="Patient: Test Patient (40/M). Rx: Paracetamol 500mg.",
    )


def test_schema_endpoint():
    """Verify GET /schema returns valid JSON Schema."""
    resp = client.get("/schema")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("title") == "MedicalDocumentExtraction"


def test_health_endpoint_structure():
    """Verify GET /health returns required diagnostic keys."""
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert "key_present" in data
    assert "model_available" in data
    assert "reachable" in data
    assert "model_name" in data


def test_unsupported_file_type_415():
    """Verify 415 returned with typed error for unsupported extension."""
    resp = client.post(
        "/extract",
        files={"file": ("malicious.exe", b"binarycontent", "application/octet-stream")},
    )
    assert resp.status_code == 415
    detail = resp.json()
    assert "error_code" in detail or "error_code" in detail.get("detail", {})


def test_empty_input_422():
    """Verify 422 returned when no content is provided."""
    resp1 = client.post("/extract")
    assert resp1.status_code == 422

    resp2 = client.post("/extract", data={"text": "   "})
    assert resp2.status_code == 422

    resp3 = client.post("/extract", files={"file": ("empty.pdf", b"", "application/pdf")})
    assert resp3.status_code == 422


def test_key_missing_error_mapping(monkeypatch):
    """Verify that when GEMINI_API_KEY is missing, API returns gemini_key_missing."""
    monkeypatch.setattr("app.extract.gemini_provider.get_gemini_api_key", lambda: "")
    resp = client.post("/extract", data={"text": "Patient note."})
    assert resp.status_code in {503, 401}
    data = resp.json()
    assert data["error_code"] == "gemini_key_missing"
    assert "hint" in data


def test_same_file_twice_in_one_batch(tmp_path, monkeypatch):
    """Verify that uploading the same file twice in one batch processes the first and marks the second duplicate."""
    sample_doc = make_dummy_doc("doc-batch-dup-1", "file.txt", "same_sha_content")
    monkeypatch.setattr("app.extract.gemini_provider.GeminiProvider.extract", lambda self, ing: sample_doc)
    monkeypatch.setattr("app.main.OUTPUT_DIR", tmp_path)

    files = [
        ("files", ("file.txt", b"Unique text content for batch test", "text/plain")),
        ("files", ("file.txt", b"Unique text content for batch test", "text/plain")),
    ]
    resp = client.post("/extract/batch", files=files)
    assert resp.status_code == 200
    batch = resp.json()
    assert batch["total"] == 2

    # Second item should be marked duplicate with original_filename
    item1, item2 = batch["results"][0], batch["results"][1]
    assert item2["status"] == "duplicate"
    assert item2["original_filename"] == "file.txt"


def test_error_then_retry_is_not_duplicate(tmp_path, monkeypatch):
    """Verify that a document that failed on previous extraction is NOT marked duplicate on retry."""
    monkeypatch.setattr("app.main.OUTPUT_DIR", tmp_path)

    # First attempt fails
    def fail_extract(self, ing):
        raise GeminiUnreachableError("Transient network failure")

    monkeypatch.setattr("app.extract.gemini_provider.GeminiProvider.extract", fail_extract)
    resp1 = client.post("/extract", data={"text": "Patient Amit note for retry."})
    assert resp1.status_code == 503

    # Confirm not cached as duplicate
    model_name = "gemini-3.5-flash-lite"
    from app.ingest.router import ingest_text
    ing = ingest_text("Patient Amit note for retry.")
    assert find_duplicate(ing.sha256, model_name, tmp_path) is None

    # Second attempt succeeds and is extracted fresh
    sample_doc = make_dummy_doc("doc-retry-success", "raw_text", ing.sha256)
    monkeypatch.setattr("app.extract.gemini_provider.GeminiProvider.extract", lambda self, ing: sample_doc)
    resp2 = client.post("/extract", data={"text": "Patient Amit note for retry."})
    assert resp2.status_code == 200
    assert resp2.json()["document"]["document_id"] == "doc-retry-success"


def test_delete_saved_result_then_reextract(tmp_path, monkeypatch):
    """Verify that DELETE /documents/{id} deletes the saved JSON so re-extraction runs."""
    monkeypatch.setattr("app.main.OUTPUT_DIR", tmp_path)

    # Save initial extraction
    doc = make_dummy_doc("doc-delete-test-123", "test.txt", "delete_sha")
    save_extraction(doc, tmp_path)

    # Verify duplicate is found
    model_name = "gemini-3.5-flash-lite"
    assert find_duplicate("delete_sha", model_name, tmp_path) is not None

    # Delete via endpoint
    resp = client.delete("/documents/doc-delete-test-123")
    assert resp.status_code == 200
    assert resp.json()["status"] == "deleted"

    # Verify duplicate is gone
    assert find_duplicate("delete_sha", model_name, tmp_path) is None

    # Deleting nonexistent returns 404
    resp_404 = client.delete("/documents/doc-delete-test-123")
    assert resp_404.status_code == 404


def test_503_retry_then_success(monkeypatch):
    """Verify that transient 503 UNAVAILABLE retries with backoff and succeeds."""
    provider = GeminiProvider()
    attempts = [0]

    class FakeCandidate:
        finish_reason = "STOP"

    class FakeResponse:
        candidates = [FakeCandidate()]
        text = '{"doc_type": "prescription"}'

    def fake_generate(model, contents, config):
        attempts[0] += 1
        if attempts[0] == 1:
            raise Exception("503 UNAVAILABLE. This model is currently experiencing high demand.")
        return FakeResponse()

    monkeypatch.setattr(provider.client.models, "generate_content", fake_generate)
    monkeypatch.setattr("time.sleep", lambda s: None)

    resp = provider._call_gemini_with_retry(["prompt"], None, max_rate_retries=3)
    assert resp.text == '{"doc_type": "prescription"}'
    assert attempts[0] == 2  # 1 failure + 1 retry success


def test_503_exhaustion_error(monkeypatch):
    """Verify that continuous 503 UNAVAILABLE raises GeminiUnreachableError after retries."""
    provider = GeminiProvider()

    def fake_generate(model, contents, config):
        raise Exception("503 UNAVAILABLE. This model is currently experiencing high demand.")

    monkeypatch.setattr(provider.client.models, "generate_content", fake_generate)
    monkeypatch.setattr("time.sleep", lambda s: None)

    with pytest.raises(GeminiUnreachableError):
        provider._call_gemini_with_retry(["prompt"], None, max_rate_retries=3)


def test_timeout_error_status_and_code():
    """Verify ExtractionTimeoutError has 'timeout' error_code and 504 status."""
    err = ExtractionTimeoutError("Processing exceeded 90 seconds")
    assert err.error_code == "timeout"
    assert err.status_code == 504
    assert "90 seconds" in err.message


def test_batch_lifecycle_and_cancel(monkeypatch):
    """Verify POST /extract/batch and POST /batch/{id}/cancel lifecycle."""
    files = [("files", ("patient1.txt", b"Patient A notes", "text/plain"))]

    resp = client.post("/extract/batch", files=files)
    assert resp.status_code == 200
    batch = resp.json()
    batch_id = batch["batch_id"]

    # Poll status
    poll_resp = client.get(f"/batch/{batch_id}")
    assert poll_resp.status_code == 200
    poll_data = poll_resp.json()
    assert poll_data["batch_id"] == batch_id

    # Cancel batch
    cancel_resp = client.post(f"/batch/{batch_id}/cancel")
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "cancelled"
