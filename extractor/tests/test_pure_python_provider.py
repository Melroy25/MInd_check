"""Comprehensive unit and integration tests for PurePythonProvider."""

from pathlib import Path
from app.ingest.router import ingest_file, ingest_text
from app.extract.pure_python_provider import PurePythonProvider

BASE_DIR = Path(__file__).resolve().parent.parent
DOCS_DIR = BASE_DIR / "demo_data" / "documents"


def test_pure_python_consultation_note():
    doc_path = DOCS_DIR / "doc5_consultation_note.txt"
    ingestion = ingest_file(doc_path.read_bytes(), doc_path.name)
    provider = PurePythonProvider()
    res = provider.extract(ingestion)

    assert res.document.doc_type == "consultation_note"
    assert res.patient.name == "Amit Kumar"
    assert res.patient.age == "35"
    assert res.allergies.status == "explicit_negative"
    
    med_names = [m.name for m in res.medications]
    assert "Paracetamol" in med_names
    assert "Telmisartan" in med_names

    cond_names = [c.name for c in res.conditions]
    assert "HTN" in cond_names
    assert "Viral Fever" in cond_names
    assert res.document.extraction_stats.items_verified > 0


def test_pure_python_prescription_pdf():
    doc_path = DOCS_DIR / "doc1_prescription.pdf"
    ingestion = ingest_file(doc_path.read_bytes(), doc_path.name)
    provider = PurePythonProvider()
    res = provider.extract(ingestion)

    assert res.document.doc_type == "prescription"
    assert res.patient.name == "Rajesh Sharma"
    assert res.allergies.status == "not_documented"
    
    med_names = [m.name for m in res.medications]
    assert "Metformin" in med_names
    assert "Telmisartan" in med_names
    assert "Atorvastatin" in med_names

    cond_names = [c.name for c in res.conditions]
    assert "Type 2 Diabetes Mellitus" in cond_names
    assert "Essential Hypertension" in cond_names


def test_pure_python_lab_image():
    doc_path = DOCS_DIR / "doc2_lab_image.png"
    ingestion = ingest_file(doc_path.read_bytes(), doc_path.name)
    provider = PurePythonProvider()
    res = provider.extract(ingestion)

    assert res.document.doc_type == "lab_report"
    test_names = [l.test_name for l in res.lab_results]
    assert "Fasting Blood Sugar" in test_names
    assert "HbA1c" in test_names


def test_pure_python_discharge_docx():
    doc_path = DOCS_DIR / "doc4_discharge_summary.docx"
    ingestion = ingest_file(doc_path.read_bytes(), doc_path.name)
    provider = PurePythonProvider()
    res = provider.extract(ingestion)

    assert res.document.doc_type == "discharge_summary"
    assert res.document.extraction_stats.items_verified > 0


def test_pure_python_allergies_present():
    doc_path = DOCS_DIR / "doc6_allergy_record_a.txt"
    ingestion = ingest_file(doc_path.read_bytes(), doc_path.name)
    provider = PurePythonProvider()
    res = provider.extract(ingestion)

    assert res.allergies.status == "present"
    assert len(res.allergies.items) >= 1
    assert res.allergies.items[0].substance.lower() == "penicillin"
