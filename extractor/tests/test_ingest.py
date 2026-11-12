"""Test ingestion readers for PDF, DOCX, image, and raw text."""

import pytest
from pathlib import Path
from app.ingest.router import ingest_file, ingest_text
from app.config import BASE_DIR

DOCS_DIR = BASE_DIR / "demo_data" / "documents"


def test_ingest_raw_text():
    """Verify raw text ingestion and page tagging."""
    sample = "Patient: Rajesh Sharma. c/o headache."
    res = ingest_text(sample)
    assert res.source_type == "raw_text"
    assert res.page_count == 1
    assert "--- Page 1 ---" in res.raw_text
    assert "Rajesh Sharma" in res.raw_text
    assert len(res.sha256) == 64


def test_ingest_pdf():
    """Verify PDF ingestion with PyMuPDF."""
    pdf_path = DOCS_DIR / "doc1_prescription.pdf"
    assert pdf_path.exists()

    res = ingest_file(pdf_path.read_bytes(), pdf_path.name)
    assert res.source_type in {"pdf_text", "pdf_scanned"}
    assert res.page_count >= 1
    assert "Rajesh Sharma" in res.raw_text
    assert "--- Page 1 ---" in res.raw_text


def test_ingest_docx():
    """Verify DOCX ingestion including table cells."""
    docx_path = DOCS_DIR / "doc4_discharge_summary.docx"
    assert docx_path.exists()

    res = ingest_file(docx_path.read_bytes(), docx_path.name)
    assert res.source_type == "docx"
    assert "Sunita Patel" in res.raw_text
    assert "DISCHARGE SUMMARY" in res.raw_text
    assert "Amlodipine" in res.raw_text


def test_ingest_image():
    """Verify PNG image ingestion and embedded raw text."""
    img_path = DOCS_DIR / "doc2_lab_image.png"
    assert img_path.exists()

    res = ingest_file(img_path.read_bytes(), img_path.name)
    assert res.source_type == "image"
    assert "METRO DIAGNOSTICS" in res.raw_text
    assert "Fasting Blood Sugar" in res.raw_text


def test_unsupported_file_format():
    """Verify ValueError is raised for unsupported extension."""
    with pytest.raises(ValueError, match="Unsupported file type"):
        ingest_file(b"fake data", "file.xlsx")


def test_empty_content_rejected():
    """Verify empty input fails ingestion."""
    with pytest.raises(ValueError, match="empty"):
        ingest_file(b"", "empty.pdf")

    with pytest.raises(ValueError, match="empty"):
        ingest_text("   ")
