# Architecture & Technical Decisions Record (DECISIONS.md)

This document records architectural, algorithmic, and design decisions made for the production **Google Gemini** Ingestion & Structuring Module of the **Verifiable Medical History** system.

---

### Decision 1: Project Root & Module Layout
- **Decision**: The project root is set directly to the repository root (`e:\DEVHOST_2026\JSON`), containing `app/`, `demo_data/`, `tests/`, and `outputs/`.
- **Rationale**: Enables standard command invocations without nested directory confusion:
  - `python -m app.cli ...`
  - `pytest -q`
  - `python evaluate.py`
  - `uvicorn app.main:app`

---

### Decision 2: PyMuPDF for PDF Processing
- **Decision**: PyMuPDF (`fitz`) is used for text extraction, page counting, and page rendering.
- **Rationale**: Fast and accurate digital text extraction per page, and clean rasterization into PNG images for Gemini vision processing of scanned pages.

---

### Decision 3: Multimodal Vision for Scanned Documents
- **Decision**: For scanned PDFs and images, pages are rendered and sent to Gemini vision to transcribe verbatim into `raw_text` first. Structured entities are then extracted and verified against this `raw_text`.
- **Rationale**: Ensures every extracted entity can be linked back to verified character offsets within `raw_text`.

---

### Decision 4: Gemini Model Selection
- **Decision**: `gemini-3.5-flash-lite` is configured as the active extraction model.
- **Rationale**: Supported for current Google AI Studio API keys, high throughput, low latency, and robust structured JSON schema enforcement.

---

### Decision 5: Date Parsing & Ambiguity Handling
- **Decision**: Default date format assumption for ambiguous numeric dates (e.g., `03/04/2022`) is `DD/MM/YYYY` (India standard).
- **Rule**: If both day and month numbers are $\le 12$ and distinct, the date is extracted with `ambiguous: true`, precision: `day`, and ISO value: `YYYY-MM-DD` assuming `DD/MM/YYYY`. When day $> 12$ (e.g., `15/01/2023`), it is unambiguous (`ambiguous: false`).

---

### Decision 6: Three-Way Allergy Status
- **Decision**:
  - `allergies.status = "explicit_negative"` only when explicit denial is written (e.g., "NKDA", "No known drug allergies", "Allergies: None", "No known allergies").
  - `allergies.status = "not_documented"` with `items = []` whenever allergies are absent or unmentioned in the document.
  - `allergies.status = "present"` when specific allergies are identified.

---

### Decision 7: Strict Evidence Check and Numeric Verification
- **Decision**: In `validate.py`, every quote is checked against `raw_text` (normalized whitespace and case only), and declared numeric values (such as doses, lab numbers, and vital values) must appear inside the quote.
- **Handling**: Verified items remain in their primary lists with `char_start` and `char_end`. Unverifiable items are moved to a root `unverified_items` array with reasons.

---

### Decision 8: SHA-256 + Model Deduplication
- **Decision**: Documents are fingerprinted by `sha256 + model`. When a document with matching hash and model already exists, the saved JSON is returned with `status: "duplicate"`. Users can deliberately remove saved results via `DELETE /documents/{id}` or the UI/CLI to re-extract.

---

### Decision 9: Typed Error Codes
- **Decision**: Replaced all generic exceptions with typed errors (`gemini_key_missing`, `gemini_key_invalid`, `gemini_model_unavailable`, `gemini_rate_limited`, `gemini_unreachable`, `extraction_invalid_output`, `document_unreadable`, `gemini_blocked`).
- **Handling**: In batch mode, failing files receive their typed error while other files in the batch proceed without interruption.
