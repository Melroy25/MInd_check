# Verifiable Medical History — Gemini Document Structure Extractor

The **Ingestion & Structuring Module** converts messy, heterogeneous medical documents (prescriptions, laboratory reports, discharge summaries, imaging scan reports, consultation notes) across PDF, image, DOCX, and raw text formats into clean, validated, schema-compliant structured JSON using **Google Gemini**.

---

## Key Guarantees & Clinical Invariants
1. **Verbatim Evidence Linking**: Every single extracted fact links back to an exact passage in the source document (`evidence.quote`, `evidence.page`, `evidence.char_start`, `evidence.char_end`). Unverifiable items are segregated into a top-level `unverified_items` array with reasons.
2. **Zero Hallucination / Inference**: Never invents diagnoses, medications, or treatment advice. Only extracts what is physically written.
3. **Three-Way Allergy Status**: Explicitly distinguishes between `explicit_negative` (e.g., "NKDA", "No known allergies"), `present` (e.g., "Penicillin rash"), and `not_documented` (when allergies are unmentioned).
4. **Exact Preservation of Doses, Units & Reference Ranges**: Never normalizes, converts, or translates units (e.g., `mg/dL` stays `mg/dL`, `mmol/L` stays `mmol/L`).
5. **Conservative Date Ambiguity**: Retains verbatim raw date text. For numeric dates where both day and month are $\le 12$ (e.g., `03/04/2022`), defaults to `DD/MM/YYYY` (India standard) but explicitly sets `ambiguous: true`.
6. **Medication Lifecycle Tracking**: Accurately tracks statuses (`prescribed`, `continued`, `changed`, `stopped`).
7. **Certainty Calibration**: Words like `?`, `probable`, `suspected`, `r/o` produce `certainty: "suspected"`, not `confirmed`.
8. **SHA-256 + Model Deduplication**: Identical files or text produce cached results with `status: "duplicate"` and original `document_id` without redundant re-extraction. Delete saved results via `DELETE /documents/{id}` or the UI/CLI to re-extract.

---

## Architecture & Directory Layout

```
medical-json-extractor/
├── app/
│   ├── config.py             # Environment configuration & limits
│   ├── errors.py             # Typed structured errors with error codes & hints
│   ├── schemas.py            # Pydantic v2 data models & JSON contract
│   ├── ingest/
│   │   ├── router.py         # File format dispatcher & SHA-256 hashing
│   │   ├── pdf_reader.py     # PyMuPDF digital text & rasterizer
│   │   ├── docx_reader.py    # python-docx paragraphs and table parser
│   │   ├── image_reader.py   # Pillow image handler
│   │   └── text_reader.py    # Raw text tagger
│   ├── extract/
│   │   ├── base.py           # LLMProvider abstract base class
│   │   ├── gemini_provider.py# Google GenAI multimodal structured output provider
│   │   └── prompts.py        # Strict system prompt and rules
│   ├── validate.py           # Verbatim evidence quote and numeric verification
│   ├── storage.py            # Persistence, index, batch tracking, and duplicate cache
│   ├── cli.py                # Command line interface
│   └── main.py               # FastAPI application
├── static/
│   └── index.html            # Web UI served at /
├── demo_data/
│   ├── generate_demo_data.py # Generates synthetic input documents & ground truth
│   ├── documents/            # Demo documents (PDF, PNG, DOCX, TXT)
│   └── expected/             # Hand-checked ground-truth JSON files
├── tests/
│   ├── test_schemas.py       # Pydantic model contract tests
│   ├── test_ingest.py        # Document parsers tests
│   ├── test_evidence_verification.py # Evidence quote & numeric verification tests
│   ├── test_errors_and_duplicates.py # Error mapping & duplicate cache tests
│   ├── test_api_offline.py   # Offline API endpoints and batch resilience tests
│   ├── test_cli.py           # CLI commands tests
│   └── test_gemini.py        # Live Gemini provider test (@pytest.mark.live)
├── outputs/                  # Extracted JSON results and eval reports
├── evaluate.py               # Precision, Recall, F1 evaluation script
├── schema.json               # Exported JSON Schema
├── DECISIONS.md              # Technical and design decisions record
├── requirements.txt          # Python dependencies
└── .env.example              # Environment template
```

---

## Installation & Setup

### 1. Requirements
- Python 3.11+
- Virtual environment recommended

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration
Create `.env` in the project root:
```env
# Gemini API Key (Required)
GEMINI_API_KEY=your_gemini_api_key_here

# Gemini Model Name (e.g. gemini-3.5-flash-lite)
GEMINI_MODEL=gemini-3.5-flash-lite

# Maximum upload size in bytes (20 MB default)
MAX_UPLOAD_SIZE_BYTES=20971520
```

---

## Usage Guide

### 1. Generate Synthetic Input Data
Generate 10 synthetic test documents covering PDF, image, DOCX, and raw text:
```bash
python demo_data/generate_demo_data.py
```

### 2. Command Line Interface (CLI)
Extract from a single file:
```bash
python -m app.cli extract demo_data/documents/doc1_prescription.pdf --out outputs/
```

Delete a saved result to allow re-extraction:
```bash
python -m app.cli delete <document_id> --out outputs/
```

Extract from raw text string:
```bash
python -m app.cli extract-text "Patient: Amit Kumar (35M). Date: 03/04/2022. Diagnosis: viral fever. NKDA. Rx: Tab Paracetamol 650 mg TDS x 5 days."
```

Batch process an entire directory:
```bash
python -m app.cli batch demo_data/documents/ --out outputs/
```

### 3. REST API (FastAPI)
Start the API server with Uvicorn:
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Endpoints:
- `POST /extract`: Ingest multipart `file` OR form field `text`. Returns structured JSON.
- `POST /extract/batch`: Ingest up to 20 files asynchronously in background queue with real-time polling.
- `GET /batch/{batch_id}`: Poll live status and item-by-item results for a batch.
- `POST /batch/{batch_id}/cancel`: Cancel a running batch job, stopping pending queued items.
- `GET /documents`: Lists summary metadata for all saved extractions.
- `GET /documents/{document_id}`: Retrieves full structured JSON extraction by ID.
- `DELETE /documents/{document_id}`: Deletes a saved extraction document, allowing re-extraction.
- `GET /schema`: Returns the complete JSON schema.
- `GET /health`: Returns service health and Gemini model readiness.
- `GET /`: Interactive web upload UI, live polling progress, and JSON previewer.
- `GET /docs`: Swagger API documentation and interactive test harness.

---

## Running Tests & Evaluation

### Run Test Suite
Run the offline test suite:
```bash
python -m pytest -q -m "not live"
```

To run all tests including live Gemini tests:
```bash
python -m pytest -q
```

### Run Evaluation Script
Run the evaluation suite comparing Gemini extraction output against ground truth:
```bash
python evaluate.py
```
This generates and saves:
- `outputs/eval_report.md`
- `outputs/eval_report.json`

---

## Typed Error Codes
When an extraction fails, the API returns a structured error object:
```json
{
  "error_code": "gemini_key_missing | gemini_key_invalid | gemini_model_unavailable | gemini_rate_limited | gemini_unreachable | extraction_invalid_output | document_unreadable | gemini_blocked",
  "message": "Description of error",
  "hint": "Guidance to resolve the error"
}
```
In batch mode, failing files receive `status: "error"` with their specific error object while other files continue uninterrupted.
