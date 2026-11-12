"""Test schema validation, serialization, and JSON contract."""

import pytest
from pydantic import ValidationError
from app.schemas import (
    MedicalDocumentExtraction,
    DocumentMetadata,
    ExtractorInfo,
    ExtractionStats,
    DateObject,
    MedicationItem,
    Evidence,
    UnverifiedItem,
    BatchExtractionResponse,
    BatchItemResult,
    get_json_schema,
)


def test_schema_generation():
    """Verify JSON schema dictionary generation for Gemini contract."""
    schema = get_json_schema()
    assert isinstance(schema, dict)
    assert schema.get("title") == "MedicalDocumentExtraction"
    assert "document" in schema.get("properties", {})
    assert "medications" in schema.get("properties", {})
    assert "unverified_items" in schema.get("properties", {})


def test_valid_minimal_gemini_extraction():
    """Verify minimal valid extraction model with Gemini extractor info."""
    doc_meta = DocumentMetadata(
        document_id="doc-test-1234",
        source_file="sample.pdf",
        source_type="pdf_text",
        sha256="aabbcc112233",
        page_count=1,
        language="en",
        doc_type="prescription",
        doc_type_confidence=0.95,
        document_date=DateObject(value="2023-01-15", raw="15/01/2023", precision="day", ambiguous=False),
        extracted_at="2026-11-12T12:00:00Z",
        extractor=ExtractorInfo(provider="gemini", model="gemini-3.5-flash-lite", version="1.0"),
        extraction_stats=ExtractionStats(items_extracted=1, items_verified=1, items_unverified=0),
    )

    med = MedicationItem(
        name="Metformin",
        dose_value="500",
        dose_unit="mg",
        dose_raw="500 mg",
        status="prescribed",
        evidence=Evidence(quote="T. Metformin 500 mg BD", page=1, char_start=10, char_end=32),
    )

    extraction = MedicalDocumentExtraction(
        document=doc_meta,
        medications=[med],
        raw_text="--- Page 1 ---\nT. Metformin 500 mg BD",
    )

    dumped_json = extraction.model_dump_json()
    assert "doc-test-1234" in dumped_json
    assert "gemini" in dumped_json

    loaded = MedicalDocumentExtraction.model_validate_json(dumped_json)
    assert loaded.document.extractor.provider == "gemini"
    assert loaded.medications[0].dose_unit == "mg"


def test_unverified_items_schema():
    """Verify UnverifiedItem captures failed entities and reasons."""
    unv = UnverifiedItem(
        item_type="medication",
        reason="numeric_value_not_found_in_quote",
        raw_quote="Tab Metformin BD",
        item_data={"name": "Metformin", "dose_value": "500"},
    )
    assert unv.item_type == "medication"
    assert "numeric_value" in unv.reason


def test_batch_models():
    """Verify batch response models."""
    item = BatchItemResult(
        filename="test.pdf",
        status="error",
        error={"error_code": "gemini_key_missing", "message": "Key missing", "hint": "Check .env"},
    )
    resp = BatchExtractionResponse(
        batch_id="b-123",
        total=1,
        succeeded=0,
        failed=1,
        results=[item],
    )
    assert resp.batch_id == "b-123"
    assert resp.failed == 1
