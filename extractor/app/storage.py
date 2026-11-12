"""Persistence, document indexing, batch tracking, and SHA-256 + Model duplicate cache."""

import json
from pathlib import Path
from typing import Optional, List, Dict, Any
from app.config import OUTPUT_DIR, BATCHES_DIR
from app.schemas import MedicalDocumentExtraction, BatchExtractionResponse


def find_duplicate(
    sha256: str,
    model: str,
    output_dir: Path = OUTPUT_DIR,
) -> Optional[MedicalDocumentExtraction]:
    """Search outputs directory for an extraction with matching sha256 AND model."""
    if not output_dir.exists():
        return None

    for json_file in output_dir.glob("*.json"):
        if json_file.name in {"eval_report.json", "index.json", "schema.json"}:
            continue
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                if not isinstance(data, dict):
                    continue
                doc = data.get("document", {})
                file_sha = doc.get("sha256")
                file_model = doc.get("extractor", {}).get("model")
                if file_sha == sha256 and file_model == model:
                    return MedicalDocumentExtraction.model_validate(data)
        except Exception:
            continue

    return None


def save_extraction(
    extraction: MedicalDocumentExtraction,
    output_dir: Path = OUTPUT_DIR,
) -> Path:
    """Save the validated MedicalDocumentExtraction JSON to disk."""
    output_dir.mkdir(parents=True, exist_ok=True)
    file_path = output_dir / f"{extraction.document.document_id}.json"
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(extraction.model_dump_json(indent=2))
    return file_path


def get_extraction_by_id(
    document_id: str,
    output_dir: Path = OUTPUT_DIR,
) -> Optional[MedicalDocumentExtraction]:
    """Retrieve saved extraction by UUID document_id."""
    target_file = output_dir / f"{document_id}.json"
    if not target_file.exists():
        for json_file in output_dir.glob("*.json"):
            if json_file.stem == document_id:
                target_file = json_file
                break

    if target_file.exists():
        try:
            with open(target_file, "r", encoding="utf-8") as f:
                return MedicalDocumentExtraction.model_validate_json(f.read())
        except Exception:
            return None
    return None


def delete_extraction(
    document_id: str,
    output_dir: Path = OUTPUT_DIR,
) -> bool:
    """Delete a saved extraction document by document_id. Returns True if deleted."""
    target_file = output_dir / f"{document_id}.json"
    if not target_file.exists():
        for json_file in output_dir.glob("*.json"):
            if json_file.stem == document_id:
                target_file = json_file
                break

    if target_file.exists():
        try:
            target_file.unlink()
            return True
        except Exception:
            return False
    return False


def list_saved_extractions(output_dir: Path = OUTPUT_DIR) -> List[Dict[str, Any]]:
    """List summary metadata for all saved extractions."""
    if not output_dir.exists():
        return []

    summaries = []
    for json_file in sorted(output_dir.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True):
        if json_file.name in {"eval_report.json", "index.json", "schema.json"}:
            continue
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                doc = data.get("document", {})
                patient = data.get("patient", {})
                stats = doc.get("extraction_stats", {})
                summaries.append({
                    "document_id": doc.get("document_id", json_file.stem),
                    "source_file": doc.get("source_file"),
                    "source_type": doc.get("source_type"),
                    "doc_type": doc.get("doc_type"),
                    "document_date": doc.get("document_date"),
                    "patient_name": patient.get("name"),
                    "model": doc.get("extractor", {}).get("model"),
                    "items_verified": stats.get("items_verified", 0),
                    "items_unverified": stats.get("items_unverified", 0),
                    "extracted_at": doc.get("extracted_at"),
                    "file_path": str(json_file),
                })
        except Exception:
            continue

    return summaries


def save_batch_result(
    batch_response: BatchExtractionResponse,
    batches_dir: Path = BATCHES_DIR,
) -> Path:
    """Save multi-file batch result to outputs/batches/<batch_id>.json."""
    batches_dir.mkdir(parents=True, exist_ok=True)
    file_path = batches_dir / f"{batch_response.batch_id}.json"
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(batch_response.model_dump_json(indent=2))
    return file_path


def get_batch_result(
    batch_id: str,
    batches_dir: Path = BATCHES_DIR,
) -> Optional[BatchExtractionResponse]:
    """Retrieve saved batch extraction by batch_id."""
    target_file = batches_dir / f"{batch_id}.json"
    if target_file.exists():
        try:
            with open(target_file, "r", encoding="utf-8") as f:
                return BatchExtractionResponse.model_validate_json(f.read())
        except Exception:
            return None
    return None
