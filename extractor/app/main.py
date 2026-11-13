"""FastAPI application for Gemini-powered medical document ingestion and structured extraction."""

import asyncio
import hashlib
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.config import (
    ALLOWED_EXTENSIONS,
    MAX_UPLOAD_SIZE_BYTES,
    MAX_CONCURRENCY,
    OUTPUT_DIR,
    BASE_DIR,
    get_gemini_api_key,
    get_gemini_model,
)
from app.errors import (
    AppException,
    DocumentUnreadableError,
    ExtractionTimeoutError,
)
from app.ingest.router import ingest_file, ingest_text
from app.storage import (
    find_duplicate,
    save_extraction,
    delete_extraction,
    get_extraction_by_id,
    list_saved_extractions,
    save_batch_result,
    get_batch_result,
)
from app.extract.gemini_provider import GeminiProvider
from app.extract.pure_python_provider import PurePythonProvider
from app.schemas import (
    MedicalDocumentExtraction,
    BatchExtractionResponse,
    BatchItemResult,
    get_json_schema,
)
from app.consultation import router as consultation_router

def get_active_provider():
    """Select the active extractor provider based on environment and key availability."""
    import os
    pref = os.getenv("EXTRACTOR_PROVIDER", "auto").strip().lower()
    if pref == "pure_python":
        return PurePythonProvider()
    if pref == "gemini":
        return GeminiProvider()
    # Auto mode: if a valid Gemini key is present, use Gemini, otherwise Pure Python
    key = get_gemini_api_key()
    if key and len(key) > 5 and not key.startswith("your_"):
        return GeminiProvider()
    return PurePythonProvider()

app = FastAPI(
    title="Verifiable Medical History - Gemini Extractor API",
    description="Transforms medical documents into verifiable, dated, evidence-linked structured JSON using Google Gemini.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handler for typed AppException
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict(),
    )


# Health check caching
_health_cache: Dict[str, Any] = {}
_health_cache_time: float = 0.0


@app.get("/", response_class=HTMLResponse, tags=["UI"])
async def serve_ui():
    """Serve the single-page document upload, batch processing, and preview UI."""
    index_file = BASE_DIR / "static" / "index.html"
    if index_file.exists():
        return HTMLResponse(content=index_file.read_text(encoding="utf-8"))
    return HTMLResponse("<h3>Medical Document Extractor</h3><p>Use /docs for Swagger UI.</p>")


@app.get("/health", tags=["System"])
async def health_check():
    """Verify Gemini API key, model availability, and reachability (cached for 30s)."""
    global _health_cache, _health_cache_time
    now = time.time()
    if _health_cache and (now - _health_cache_time < 30.0):
        return _health_cache

    provider = get_active_provider()
    result = provider.check_health()
    _health_cache = result
    _health_cache_time = now
    return result


@app.get("/schema", tags=["Schema"])
async def get_contract_schema():
    """Return JSON Schema for the structured extraction contract."""
    return get_json_schema()


@app.get("/documents", tags=["Documents"])
async def list_documents() -> List[Dict[str, Any]]:
    """List summary metadata for all saved extractions."""
    return list_saved_extractions(OUTPUT_DIR)


@app.get("/documents/{document_id}", tags=["Documents"])
async def get_document(document_id: str) -> MedicalDocumentExtraction:
    """Retrieve full structured JSON for an extraction by document_id."""
    doc = get_extraction_by_id(document_id, OUTPUT_DIR)
    if not doc:
        raise HTTPException(
            status_code=404,
            detail={
                "error_code": "document_not_found",
                "message": f"Extraction with document_id '{document_id}' not found.",
                "hint": "Check the document_id or list available extractions via GET /documents.",
            },
        )
    return doc


@app.get("/batches/{batch_id}", response_model=BatchExtractionResponse, tags=["Batch"])
async def get_batch(batch_id: str):
    """Retrieve multi-document batch extraction summary by batch_id."""
    result = get_batch_result(batch_id)
    if not result:
        raise HTTPException(
            status_code=404,
            detail={
                "error_code": "batch_not_found",
                "message": f"Batch '{batch_id}' was not found.",
                "hint": "Verify batch_id.",
            },
        )
    return result


@app.post("/extract", response_model=MedicalDocumentExtraction, tags=["Extraction"])
async def extract_single(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
):
    """Ingest single medical document (PDF, Image, DOCX) or raw text and return structured JSON."""
    has_file = file is not None and bool(file.filename)
    has_text = text is not None and bool(text.strip())

    if not has_file and not has_text:
        raise HTTPException(
            status_code=422,
            detail={
                "error_code": "document_unreadable",
                "message": "Neither 'file' nor 'text' was provided.",
                "hint": "Upload a medical document or paste clinical text.",
            },
        )

    provider = get_active_provider()
    model_name = provider.model_name

    # Ingest File
    if has_file and file is not None:
        filename = file.filename or "uploaded_file"
        ext = Path(filename).suffix.lower()

        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=415,
                detail={
                    "error_code": "document_unreadable",
                    "message": f"Unsupported file type '{ext}'.",
                    "hint": f"Allowed extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
                },
            )

        content = await file.read()
        if len(content) > MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail={
                    "error_code": "document_unreadable",
                    "message": f"File exceeds {MAX_UPLOAD_SIZE_BYTES // (1024*1024)} MB limit.",
                    "hint": "Upload a smaller document file.",
                },
            )

        if len(content) == 0:
            raise HTTPException(
                status_code=422,
                detail={
                    "error_code": "document_unreadable",
                    "message": "Uploaded file is empty (0 bytes).",
                    "hint": "Ensure the uploaded file contains document data.",
                },
            )

        try:
            ingestion = ingest_file(content, filename)
        except Exception as ve:
            raise HTTPException(
                status_code=422,
                detail={
                    "error_code": "document_unreadable",
                    "message": f"Failed to parse document: {ve}",
                    "hint": "Check that the file is not corrupted or password-protected.",
                },
            )

    # Ingest Raw Text
    else:
        if not text or not text.strip():
            raise HTTPException(
                status_code=422,
                detail={
                    "error_code": "document_unreadable",
                    "message": "Text field is empty.",
                    "hint": "Provide non-empty clinical text.",
                },
            )
        ingestion = ingest_text(text)

    # Duplicate check by SHA-256 + Model (successful extractions only)
    existing = find_duplicate(ingestion.sha256, model_name, OUTPUT_DIR)
    if existing:
        dup_warning = f"duplicate_of:{existing.document.document_id}"
        if dup_warning not in existing.warnings:
            existing.warnings.append(dup_warning)
        return existing

    # Perform Gemini extraction
    validated = provider.extract(ingestion)
    save_extraction(validated, OUTPUT_DIR)
    return validated


class BatchJobState:
    def __init__(self, batch_id: str, results: List[BatchItemResult]):
        self.batch_id = batch_id
        self.status: Literal["queued", "processing", "completed", "cancelled"] = "processing"
        self.results = results
        self.is_cancelled = False
        self.created_at = datetime.now(timezone.utc).isoformat()

    def to_response(self) -> BatchExtractionResponse:
        succeeded = sum(1 for r in self.results if r.status in {"ok", "duplicate"})
        failed = sum(1 for r in self.results if r.status == "error")
        for r in self.results:
            if r.status == "processing" and hasattr(r, "_start_time"):
                r.elapsed_sec = round(time.perf_counter() - r._start_time, 1)
        return BatchExtractionResponse(
            batch_id=self.batch_id,
            status=self.status,
            total=len(self.results),
            succeeded=succeeded,
            failed=failed,
            results=self.results,
            created_at=self.created_at,
        )


BATCH_JOBS: Dict[str, BatchJobState] = {}


async def _run_batch_worker(job: BatchJobState, work_queue: List[Tuple[int, IngestionResult]]):
    provider = get_active_provider()
    sem = asyncio.Semaphore(MAX_CONCURRENCY)

    for item_idx, ingestion in work_queue:
        if job.is_cancelled:
            for rem_idx, _ in work_queue:
                if job.results[rem_idx].status in {"queued", "processing"}:
                    job.results[rem_idx].status = "error"
                    job.results[rem_idx].error = {
                        "error_code": "cancelled",
                        "message": "Batch processing was cancelled.",
                        "hint": "The batch was stopped by user request.",
                    }
            break

        item = job.results[item_idx]
        item.status = "processing"
        item._start_time = time.perf_counter()
        t0 = time.perf_counter()

        async with sem:
            await asyncio.sleep(1.0)
            try:
                loop = asyncio.get_running_loop()
                validated = await loop.run_in_executor(None, provider.extract, ingestion)
                save_extraction(validated, OUTPUT_DIR)
                item.status = "ok"
                item.document = validated
                item.elapsed_sec = round(time.perf_counter() - t0, 2)
            except AppException as ae:
                item.status = "error"
                item.error = ae.to_dict()
                item.elapsed_sec = round(time.perf_counter() - t0, 2)
            except Exception as e:
                item.status = "error"
                item.error = {
                    "error_code": "extraction_failed",
                    "message": str(e),
                    "hint": "Check server logs or document content.",
                }
                item.elapsed_sec = round(time.perf_counter() - t0, 2)

    job.status = "cancelled" if job.is_cancelled else "completed"
    save_batch_result(job.to_response())


@app.post("/extract/batch", response_model=BatchExtractionResponse, tags=["Batch"])
async def extract_batch(
    files: List[UploadFile] = File([]),
    text: Optional[str] = Form(None),
):
    """Start asynchronous batch extraction for up to 20 documents in background queue."""
    valid_files = [f for f in files if f.filename]
    has_text = bool(text and text.strip())

    total_items = len(valid_files) + (1 if has_text else 0)
    if total_items == 0:
        raise HTTPException(
            status_code=422,
            detail={
                "error_code": "document_unreadable",
                "message": "No files or text provided in batch request.",
                "hint": "Select one or more documents to extract.",
            },
        )

    if len(valid_files) > 20:
        raise HTTPException(
            status_code=400,
            detail={
                "error_code": "batch_limit_exceeded",
                "message": "Batch exceeds maximum limit of 20 files.",
                "hint": "Upload up to 20 files per batch request.",
            },
        )

    batch_id = str(uuid.uuid4())
    provider = get_active_provider()
    model_name = provider.model_name

    results: List[BatchItemResult] = []
    work_queue: List[Tuple[int, IngestionResult]] = []
    seen_in_batch: Dict[str, str] = {}

    for file in valid_files:
        filename = file.filename or "unknown_file"
        ext = Path(filename).suffix.lower()

        if ext not in ALLOWED_EXTENSIONS:
            results.append(
                BatchItemResult(
                    filename=filename,
                    status="error",
                    document=None,
                    error={
                        "error_code": "document_unreadable",
                        "message": f"Unsupported file type '{ext}'.",
                        "hint": f"Allowed extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
                    },
                )
            )
            continue

        content = await file.read()
        if len(content) > MAX_UPLOAD_SIZE_BYTES:
            results.append(
                BatchItemResult(
                    filename=filename,
                    status="error",
                    document=None,
                    error={
                        "error_code": "document_unreadable",
                        "message": "File exceeds 20 MB size limit.",
                        "hint": "Upload a smaller document.",
                    },
                )
            )
            continue

        if len(content) == 0:
            results.append(
                BatchItemResult(
                    filename=filename,
                    status="error",
                    document=None,
                    error={
                        "error_code": "document_unreadable",
                        "message": "File is empty (0 bytes).",
                        "hint": "Upload a file with content.",
                    },
                )
            )
            continue

        try:
            ingestion = ingest_file(content, filename)
        except Exception as ve:
            results.append(
                BatchItemResult(
                    filename=filename,
                    status="error",
                    document=None,
                    error={
                        "error_code": "document_unreadable",
                        "message": f"Failed to parse document: {ve}",
                        "hint": "Ensure document is unencrypted and not corrupt.",
                    },
                )
            )
            continue

        # Intra-batch duplicate check
        if ingestion.sha256 in seen_in_batch:
            orig_name = seen_in_batch[ingestion.sha256]
            results.append(
                BatchItemResult(
                    filename=filename,
                    status="duplicate",
                    original_filename=orig_name,
                    document=None,
                    error=None,
                )
            )
            continue
        seen_in_batch[ingestion.sha256] = filename

        # Duplicate check against saved successful results
        existing = find_duplicate(ingestion.sha256, model_name, OUTPUT_DIR)
        if existing:
            results.append(
                BatchItemResult(
                    filename=filename,
                    status="duplicate",
                    original_document_id=existing.document.document_id,
                    original_filename=existing.document.source_file,
                    original_extracted_at=existing.document.extracted_at,
                    document=existing,
                    error=None,
                )
            )
            continue

        curr_idx = len(results)
        results.append(
            BatchItemResult(
                filename=filename,
                status="queued",
                document=None,
                error=None,
            )
        )
        work_queue.append((curr_idx, ingestion))

    if has_text and text:
        ingestion = ingest_text(text, filename="raw_text_entry.txt")
        if ingestion.sha256 in seen_in_batch:
            results.append(
                BatchItemResult(
                    filename="raw_text_entry.txt",
                    status="duplicate",
                    original_filename=seen_in_batch[ingestion.sha256],
                    document=None,
                    error=None,
                )
            )
        else:
            seen_in_batch[ingestion.sha256] = "raw_text_entry.txt"
            existing = find_duplicate(ingestion.sha256, model_name, OUTPUT_DIR)
            if existing:
                results.append(
                    BatchItemResult(
                        filename="raw_text_entry.txt",
                        status="duplicate",
                        original_document_id=existing.document.document_id,
                        original_filename=existing.document.source_file,
                        original_extracted_at=existing.document.extracted_at,
                        document=existing,
                        error=None,
                    )
                )
            else:
                curr_idx = len(results)
                results.append(
                    BatchItemResult(
                        filename="raw_text_entry.txt",
                        status="queued",
                        document=None,
                        error=None,
                    )
                )
                work_queue.append((curr_idx, ingestion))

    job = BatchJobState(batch_id, results)
    BATCH_JOBS[batch_id] = job

    if work_queue:
        asyncio.create_task(_run_batch_worker(job, work_queue))
    else:
        job.status = "completed"
        save_batch_result(job.to_response())

    return job.to_response()


@app.get("/batch/{batch_id}", response_model=BatchExtractionResponse, tags=["Batch"])
async def get_batch_status(batch_id: str):
    """Retrieve current live status and item-by-item results for a batch."""
    if batch_id in BATCH_JOBS:
        return BATCH_JOBS[batch_id].to_response()

    saved = get_batch_result(batch_id)
    if saved:
        return saved

    raise HTTPException(
        status_code=404,
        detail={"error_code": "batch_not_found", "message": f"Batch '{batch_id}' not found."},
    )


@app.post("/batch/{batch_id}/cancel", tags=["Batch"])
async def cancel_batch_job(batch_id: str):
    """Cancel a running batch job, stopping pending queued items."""
    if batch_id in BATCH_JOBS:
        job = BATCH_JOBS[batch_id]
        job.is_cancelled = True
        job.status = "cancelled"
        for item in job.results:
            if item.status in {"queued", "processing"}:
                item.status = "error"
                item.error = {
                    "error_code": "cancelled",
                    "message": "Batch processing was cancelled by user.",
                    "hint": "The item was stopped before completion.",
                }
        save_batch_result(job.to_response())
        return {"status": "cancelled", "batch_id": batch_id}

    raise HTTPException(
        status_code=404,
        detail={"error_code": "batch_not_found", "message": f"Active batch '{batch_id}' not found."},
    )


@app.delete("/documents/{document_id}", tags=["Documents"])
async def delete_saved_document(document_id: str):
    """Delete a saved extraction document by UUID, allowing the file to be re-extracted."""
    success = delete_extraction(document_id, OUTPUT_DIR)
    if not success:
        raise HTTPException(
            status_code=404,
            detail={
                "error_code": "document_not_found",
                "message": f"Document with ID '{document_id}' not found.",
                "hint": "Verify the document ID or check if it was already deleted.",
            },
        )
    return {"status": "deleted", "document_id": document_id}
