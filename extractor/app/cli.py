"""Command-line interface for medical document extraction using Google Gemini."""

import argparse
import sys
from pathlib import Path
from typing import Optional
from app.config import OUTPUT_DIR, get_gemini_model
from app.ingest.router import ingest_file, ingest_text
from app.storage import find_duplicate, save_extraction, delete_extraction
from app.extract.gemini_provider import GeminiProvider
from app.errors import AppException
from app.schemas import MedicalDocumentExtraction


def process_file(
    file_path: Path,
    out_dir: Path = OUTPUT_DIR,
) -> MedicalDocumentExtraction:
    """Ingest, extract, validate, and persist a single file with Gemini."""
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    file_bytes = file_path.read_bytes()
    ingestion = ingest_file(file_bytes, file_path.name)
    model_name = get_gemini_model()

    # Check for duplicate by SHA-256 + Model (successful extractions only)
    existing = find_duplicate(ingestion.sha256, model_name, out_dir)
    if existing:
        print(f"[DUPLICATE] Document matches existing SHA-256 + model. Reusing {existing.document.document_id}")
        return existing

    provider = GeminiProvider()
    validated = provider.extract(ingestion)

    saved_path = save_extraction(validated, out_dir)
    print(f"[EXTRACTED] Saved structured JSON to: {saved_path}")
    return validated


def process_raw_text(
    text: str,
    out_dir: Optional[Path] = None,
) -> MedicalDocumentExtraction:
    """Ingest, extract, and validate raw text string with Gemini."""
    ingestion = ingest_text(text)
    model_name = get_gemini_model()

    if out_dir:
        existing = find_duplicate(ingestion.sha256, model_name, out_dir)
        if existing:
            print(f"[DUPLICATE] Text matches existing SHA-256 + model. Reusing {existing.document.document_id}")
            return existing

    provider = GeminiProvider()
    validated = provider.extract(ingestion)

    if out_dir:
        saved_path = save_extraction(validated, out_dir)
        print(f"[EXTRACTED] Saved structured JSON to: {saved_path}")

    return validated


def main():
    parser = argparse.ArgumentParser(
        description="Verifiable Medical History - Gemini Document Extractor CLI"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Subcommand: extract
    p_extract = subparsers.add_parser("extract", help="Extract from a single document file")
    p_extract.add_argument("file", type=Path, help="Path to PDF, DOCX, image, or TXT file")
    p_extract.add_argument("--out", type=Path, default=OUTPUT_DIR, help="Directory to save JSON output")

    # Subcommand: extract-text
    p_text = subparsers.add_parser("extract-text", help="Extract from raw text string")
    p_text.add_argument("text", type=str, help="Clinical note or text string")
    p_text.add_argument("--out", type=Path, default=OUTPUT_DIR, help="Directory to save JSON output")

    # Subcommand: batch
    p_batch = subparsers.add_parser("batch", help="Batch extract all documents in a directory")
    p_batch.add_argument("dir", type=Path, help="Directory containing documents")
    p_batch.add_argument("--out", type=Path, default=OUTPUT_DIR, help="Directory to save JSON output")

    # Subcommand: delete
    p_delete = subparsers.add_parser("delete", help="Delete a saved extraction document by UUID")
    p_delete.add_argument("document_id", type=str, help="UUID document ID to delete")
    p_delete.add_argument("--out", type=Path, default=OUTPUT_DIR, help="Directory containing JSON outputs")

    args = parser.parse_args()

    try:
        if args.command == "extract":
            result = process_file(args.file, out_dir=args.out)
            stats = result.document.extraction_stats
            print(f"Document ID: {result.document.document_id}")
            print(f"Doc Type: {result.document.doc_type}")
            print(f"Patient: {result.patient.name} ({result.patient.age} / {result.patient.sex})")
            print(f"Verified: {stats.items_verified}, Unverified: {stats.items_unverified}, Pages: {stats.pages_processed}")

        elif args.command == "extract-text":
            result = process_raw_text(args.text, out_dir=args.out)
            stats = result.document.extraction_stats
            print(f"Document ID: {result.document.document_id}")
            print(f"Doc Type: {result.document.doc_type}")
            print(f"Allergies Status: {result.allergies.status}")
            print(f"Verified: {stats.items_verified}, Unverified: {stats.items_unverified}")

        elif args.command == "batch":
            if not args.dir.exists() or not args.dir.is_dir():
                print(f"Error: Directory '{args.dir}' does not exist or is not a directory.", file=sys.stderr)
                sys.exit(1)

            files = [f for f in args.dir.iterdir() if f.is_file() and not f.name.startswith(".")]
            print(f"Processing {len(files)} documents in batch mode from '{args.dir}'...")
            processed_count = 0
            for f in sorted(files):
                print(f"--- Processing: {f.name} ---")
                try:
                    process_file(f, out_dir=args.out)
                    processed_count += 1
                except AppException as ae:
                    print(f"[{ae.error_code}] {f.name}: {ae.message} (Hint: {ae.hint})", file=sys.stderr)
                except Exception as e:
                    print(f"Error processing {f.name}: {e}", file=sys.stderr)

            print(f"\nBatch processing complete: {processed_count}/{len(files)} documents processed.")

        elif args.command == "delete":
            deleted = delete_extraction(args.document_id, out_dir=args.out)
            if deleted:
                print(f"[DELETED] Saved document '{args.document_id}' deleted successfully.")
            else:
                print(f"[NOT FOUND] No saved document found with ID '{args.document_id}'.", file=sys.stderr)
                sys.exit(1)

    except AppException as ae:
        print(f"[{ae.error_code}] {ae.message}\nHint: {ae.hint}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
