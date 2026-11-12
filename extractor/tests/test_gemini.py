"""Live end-to-end tests for Google GeminiProvider on all four document formats."""

import os
import pytest
from app.config import get_gemini_api_key, BASE_DIR
from app.extract.gemini_provider import GeminiProvider
from app.ingest.router import ingest_text, ingest_file

DOCS_DIR = BASE_DIR / "demo_data" / "documents"


@pytest.fixture
def check_live_key():
    key = get_gemini_api_key()
    if not key or key.startswith("your_"):
        pytest.skip("SKIPPING LIVE TEST: GEMINI_API_KEY is not set or is a placeholder.")
    return key


@pytest.mark.live
def test_live_gemini_raw_text(check_live_key):
    """Verify live Gemini extraction on clinical text note."""
    note = (
        "Patient: Amit Kumar (35M). Date: 03/04/2022.\n"
        "Clinic: Family Health Clinic, Jaipur.\n"
        "Diagnosis: viral fever.\n"
        "Allergies: NKDA.\n"
        "Rx: Tab Paracetamol 650 mg TDS x 5 days."
    )
    provider = GeminiProvider()
    ing = ingest_text(note)
    res = provider.extract(ing)

    assert res.document.doc_type in {"prescription", "consultation_note"}
    assert res.allergies.status == "explicit_negative"
    assert res.document.extraction_stats.items_verified >= 1
    assert any("paracetamol" in m.name.lower() for m in res.medications)


@pytest.mark.live
def test_live_gemini_text_pdf(check_live_key):
    """Verify live Gemini extraction on digital text PDF."""
    pdf_path = DOCS_DIR / "doc1_prescription.pdf"
    assert pdf_path.exists()

    provider = GeminiProvider()
    ing = ingest_file(pdf_path.read_bytes(), pdf_path.name)
    res = provider.extract(ing)

    assert res.document.doc_type == "prescription"
    assert res.document.extraction_stats.items_verified >= 2
    assert any("metformin" in m.name.lower() for m in res.medications)


@pytest.mark.live
def test_live_gemini_image(check_live_key):
    """Verify live Gemini multimodal extraction on lab image."""
    img_path = DOCS_DIR / "doc2_lab_image.png"
    assert img_path.exists()

    provider = GeminiProvider()
    ing = ingest_file(img_path.read_bytes(), img_path.name)
    res = provider.extract(ing)

    assert res.document.doc_type == "lab_report"
    assert res.document.extraction_stats.items_verified >= 1
    fbs = next((l for l in res.lab_results if "blood" in l.test_name.lower()), None)
    assert fbs is not None
    assert "142" in fbs.value


@pytest.mark.live
def test_live_gemini_docx(check_live_key):
    """Verify live Gemini extraction on DOCX discharge summary."""
    docx_path = DOCS_DIR / "doc4_discharge_summary.docx"
    assert docx_path.exists()

    provider = GeminiProvider()
    ing = ingest_file(docx_path.read_bytes(), docx_path.name)
    res = provider.extract(ing)

    assert res.document.doc_type == "discharge_summary"
    assert res.allergies.status == "explicit_negative"
    assert res.document.extraction_stats.items_verified >= 2


@pytest.mark.live
def test_live_batch_multi_files_and_corrupt(check_live_key):
    """Verify live batch of 6 demo files + 1 corrupt PDF + 1 unsupported file."""
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)

    demo_names = [
        "doc1_prescription.pdf",
        "doc2_lab_image.png",
        "doc3_lab_specialist.pdf",
        "doc4_discharge_summary.docx",
        "doc5_consultation_note.txt",
        "doc6_allergy_record_a.txt",
    ]

    files_payload = []
    for name in demo_names:
        p = DOCS_DIR / name
        assert p.exists()
        files_payload.append(("files", (name, p.read_bytes())))

    # Add corrupt PDF and unsupported file
    files_payload.append(("files", ("corrupt.pdf", b"%PDF-invalid-bytes-non-parseable-data")))
    files_payload.append(("files", ("unsupported.exe", b"MZ\x90\x00\x03\x00\x00\x00")))

    resp = client.post("/extract/batch", files=files_payload)
    assert resp.status_code == 200
    batch = resp.json()

    assert batch["total"] == 8
    assert batch["succeeded"] == 6
    assert batch["failed"] == 2

    status_map = {r["filename"]: r for r in batch["results"]}
    for name in demo_names:
        assert status_map[name]["status"] in {"ok", "duplicate"}, f"Expected ok/duplicate for {name}, got {status_map[name]['status']}"
        assert status_map[name]["document"] is not None

    assert status_map["corrupt.pdf"]["status"] == "error"
    assert status_map["corrupt.pdf"]["error"]["error_code"] == "document_unreadable"

    assert status_map["unsupported.exe"]["status"] == "error"
    assert status_map["unsupported.exe"]["error"]["error_code"] == "document_unreadable"

