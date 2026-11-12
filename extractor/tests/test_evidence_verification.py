"""Test strict evidence verification engine: quote matching, offsets, and numeric consistency."""

from app.schemas import (
    MedicalDocumentExtraction,
    DocumentMetadata,
    ExtractorInfo,
    MedicationItem,
    LabResultItem,
    ConditionItem,
    Evidence,
)
from app.validate import validate_extraction


def _make_base_extraction(raw_text: str) -> MedicalDocumentExtraction:
    meta = DocumentMetadata(
        document_id="eval-doc-01",
        source_file="note.txt",
        source_type="raw_text",
        sha256="testsha256",
        page_count=1,
        doc_type="consultation_note",
        extracted_at="2026-11-12T12:00:00Z",
        extractor=ExtractorInfo(provider="gemini", model="gemini-3.5-flash-lite", version="1.0"),
    )
    return MedicalDocumentExtraction(document=meta, raw_text=raw_text)


def test_verified_quote_stays_in_main_list():
    """Verify that a valid verbatim quote stays in main list and gets offsets."""
    text = "--- Page 1 ---\nPatient given Tab Metformin 500 mg BD x 30 days."
    ext = _make_base_extraction(text)
    ext.medications.append(
        MedicationItem(
            name="Metformin",
            dose_value="500",
            dose_unit="mg",
            evidence=Evidence(quote="Tab Metformin 500 mg BD", page=1),
        )
    )

    validated = validate_extraction(ext)
    assert len(validated.medications) == 1
    assert len(validated.unverified_items) == 0
    assert validated.medications[0].evidence.char_start > 0
    assert validated.medications[0].evidence.char_end > validated.medications[0].evidence.char_start
    assert validated.document.extraction_stats.items_verified == 1
    assert validated.document.extraction_stats.items_unverified == 0


def test_quote_not_in_text_moved_to_unverified():
    """Verify that a quote not in raw_text is removed from main list and moved to unverified_items."""
    text = "--- Page 1 ---\nPatient complains of chest pain."
    ext = _make_base_extraction(text)
    # Hallucinated medication not in text
    ext.medications.append(
        MedicationItem(
            name="Atorvastatin",
            dose_value="20",
            dose_unit="mg",
            evidence=Evidence(quote="Tab Atorvastatin 20 mg HS", page=1),
        )
    )

    validated = validate_extraction(ext)
    assert len(validated.medications) == 0, "Unverified item must NEVER remain in main list"
    assert len(validated.unverified_items) == 1
    assert validated.unverified_items[0].reason == "quote_not_found_in_raw_text"
    assert validated.unverified_items[0].item_type == "medication"
    assert validated.document.extraction_stats.items_verified == 0
    assert validated.document.extraction_stats.items_unverified == 1


def test_numeric_value_not_in_quote_moved_to_unverified():
    """Verify that an item with numeric value not in quote is moved to unverified_items."""
    text = "--- Page 1 ---\nDoctor prescribed Metformin daily."
    ext = _make_base_extraction(text)
    # Quote is in text, BUT dose "500" does not appear in quote!
    ext.medications.append(
        MedicationItem(
            name="Metformin",
            dose_value="500",
            dose_unit="mg",
            evidence=Evidence(quote="prescribed Metformin daily", page=1),
        )
    )

    validated = validate_extraction(ext)
    assert len(validated.medications) == 0
    assert len(validated.unverified_items) == 1
    assert "numeric_value" in validated.unverified_items[0].reason
    assert validated.document.extraction_stats.items_unverified == 1


def test_lab_numeric_value_verification():
    """Verify lab result numeric values against quote."""
    text = "--- Page 1 ---\nFasting Blood Sugar: 142 mg/dL [High]"
    ext = _make_base_extraction(text)
    ext.lab_results.append(
        LabResultItem(
            test_name="Fasting Blood Sugar",
            value="142",
            unit="mg/dL",
            evidence=Evidence(quote="Fasting Blood Sugar: 142 mg/dL", page=1),
        )
    )

    validated = validate_extraction(ext)
    assert len(validated.lab_results) == 1
    assert validated.lab_results[0].evidence.char_start > 0
    assert validated.document.extraction_stats.items_verified == 1
