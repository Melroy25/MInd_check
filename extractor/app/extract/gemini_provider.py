"""Production Google Gemini extraction provider using the official google-genai SDK."""

import json
import logging
import random
import re
import time
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, ValidationError

from google import genai
from google.genai import types, errors

from app.config import get_gemini_api_key, get_gemini_model
from app.errors import (
    AppException,
    GeminiKeyMissingError,
    GeminiKeyInvalidError,
    GeminiModelUnavailableError,
    GeminiRateLimitedError,
    GeminiUnreachableError,
    ExtractionInvalidOutputError,
    DocumentUnreadableError,
    GeminiBlockedError,
    ExtractionTimeoutError,
)
from app.extract.base import LLMProvider
from app.extract.prompts import (
    SYSTEM_PROMPT,
    IMAGE_TRANSCRIPTION_PROMPT,
    build_user_prompt,
)
from app.ingest.router import IngestionResult
from app.validate import validate_extraction
from app.schemas import (
    MedicalDocumentExtraction,
    DocumentMetadata,
    ExtractorInfo,
    ExtractionStats,
    ProviderInfo,
    PatientInfo,
    PatientIdentifier,
    DateObject,
    MedicationItem,
    LabResultItem,
    ConditionItem,
    AllergiesSection,
    AllergyItem,
    InvestigationItem,
    EventItem,
    VitalItem,
    Evidence,
)


# --- Simplified Response Schemas for Gemini Structured Generation ---

class RawEvidence(BaseModel):
    quote: str
    page: int = 1


class RawMedication(BaseModel):
    name: str
    dose_value: Optional[str] = None
    dose_unit: Optional[str] = None
    dose_raw: Optional[str] = None
    route: Optional[str] = None
    frequency_raw: Optional[str] = None
    duration_raw: Optional[str] = None
    status: Literal["prescribed", "continued", "changed", "stopped", "not_stated"] = "prescribed"
    change_note: Optional[str] = None
    indication: Optional[str] = None
    evidence: RawEvidence


class RawLabResult(BaseModel):
    test_name: str
    value: str
    value_numeric: Optional[float] = None
    unit: Optional[str] = None
    reference_range_raw: Optional[str] = None
    flag: Literal["high", "low", "normal", "abnormal", "not_stated"] = "not_stated"
    evidence: RawEvidence


class RawCondition(BaseModel):
    name: str
    status: Literal["active", "resolved", "historical", "suspected", "not_stated"] = "not_stated"
    certainty: Literal["confirmed", "suspected", "ruled_out", "not_stated"] = "not_stated"
    evidence: RawEvidence


class RawAllergyItem(BaseModel):
    substance: str
    reaction: Optional[str] = None
    severity: Optional[str] = None
    evidence: RawEvidence


class RawAllergiesSection(BaseModel):
    status: Literal["present", "explicit_negative", "not_documented"] = "not_documented"
    items: List[RawAllergyItem] = Field(default_factory=list)


class RawInvestigation(BaseModel):
    modality: Optional[str] = None
    body_part: Optional[str] = None
    findings_raw: Optional[str] = None
    impression_raw: Optional[str] = None
    evidence: RawEvidence


class RawEvent(BaseModel):
    type: Literal["admission", "discharge", "surgery", "procedure", "visit", "follow_up", "other"] = "other"
    description: str
    evidence: RawEvidence


class RawVital(BaseModel):
    name: str
    value: str
    value_numeric: Optional[float] = None
    unit: Optional[str] = None
    evidence: RawEvidence


class RawPatientIdentifier(BaseModel):
    type: str = Field(default="MRN", description="Identifier type (e.g. MRN, IP, UHID)")
    value: str = Field(default="", description="Identifier number")


class RawExtractionPayload(BaseModel):
    transcribed_raw_text: Optional[str] = None
    doc_type: Literal[
        "prescription",
        "lab_report",
        "discharge_summary",
        "scan_report",
        "consultation_note",
        "other",
    ] = "other"
    doc_type_confidence: float = 1.0
    document_date_raw: Optional[str] = None
    provider_name: Optional[str] = None
    facility_name: Optional[str] = None
    country: Optional[str] = None
    patient_name: Optional[str] = None
    patient_age: Optional[str] = None
    patient_sex: Optional[str] = None
    patient_identifiers: List[RawPatientIdentifier] = Field(default_factory=list)
    conditions: List[RawCondition] = Field(default_factory=list)
    medications: List[RawMedication] = Field(default_factory=list)
    allergies: RawAllergiesSection = Field(default_factory=RawAllergiesSection)
    lab_results: List[RawLabResult] = Field(default_factory=list)
    investigations: List[RawInvestigation] = Field(default_factory=list)
    events: List[RawEvent] = Field(default_factory=list)
    vitals: List[RawVital] = Field(default_factory=list)
    free_text_notes: List[str] = Field(default_factory=list)


class GeminiProvider(LLMProvider):
    """Production Gemini extraction engine using official google-genai SDK."""

    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or get_gemini_api_key()
        self.model_name = model_name or get_gemini_model()
        self.active_model = self.model_name
        self._client: Optional[genai.Client] = None

    @property
    def client(self) -> genai.Client:
        if not self.api_key:
            raise GeminiKeyMissingError()
        if self._client is None:
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    def check_health(self) -> Dict[str, Any]:
        """Verify API key validity, model availability, and reachability."""
        if not self.api_key:
            return {
                "status": "error",
                "key_present": False,
                "model_available": False,
                "reachable": False,
                "model_name": self.model_name,
                "error": GeminiKeyMissingError().to_dict(),
            }
        try:
            m = self.client.models.get(model=self.model_name)
            return {
                "status": "ok",
                "key_present": True,
                "model_available": True,
                "reachable": True,
                "model_name": self.model_name,
                "error": None,
            }
        except Exception as e:
            err = self._map_gemini_exception(e)
            return {
                "status": "error",
                "key_present": True,
                "model_available": False,
                "reachable": False,
                "model_name": self.model_name,
                "error": err.to_dict(),
            }

    def _map_gemini_exception(self, exc: Exception) -> AppException:
        """Map SDK errors to typed structured application exceptions."""
        if isinstance(exc, AppException):
            return exc

        msg = str(exc)
        msg_lower = msg.lower()

        # Check for API key errors
        if "api_key_invalid" in msg_lower or "api key not valid" in msg_lower or "401" in msg or "403" in msg:
            return GeminiKeyInvalidError(message=f"Gemini API key rejected: {msg}")

        # Check for Model not found
        if "not_found" in msg_lower or "404" in msg or "is not found for api version" in msg_lower:
            return GeminiModelUnavailableError(model_name=self.model_name, message=f"Model unavailable: {msg}")

        # Check for Rate limiting / Quota
        if "resource_exhausted" in msg_lower or "429" in msg or "rate limit" in msg_lower or "quota" in msg_lower:
            return GeminiRateLimitedError(message=f"Gemini quota exceeded: {msg}")

        # Check for Unreachable / Service Unavailable
        if "unavailable" in msg_lower or "503" in msg or "500" in msg or "502" in msg or "timeout" in msg_lower or "connection" in msg_lower:
            return GeminiUnreachableError(message=f"Gemini service unavailable: {msg}")

        # Generic / network
        return GeminiUnreachableError(message=f"Gemini API call failed: {msg}")

    def _call_gemini_with_retry(
        self,
        contents: List[Any],
        config: types.GenerateContentConfig,
        max_rate_retries: int = 4,
    ) -> types.GenerateContentResponse:
        """Call Gemini API with exponential backoff for rate limits and transient 5xx errors."""
        models_to_try = [self.model_name]
        alt_model = "gemini-3.5-flash-lite" if self.model_name == "gemini-3.1-flash-lite" else "gemini-3.1-flash-lite"
        if alt_model not in models_to_try:
            models_to_try.append(alt_model)

        last_error = None
        for current_model in models_to_try:
            for attempt in range(max_rate_retries + 1):
                try:
                    response = self.client.models.generate_content(
                        model=current_model,
                        contents=contents,
                        config=config,
                    )

                    # Check safety block
                    if hasattr(response, "candidates") and response.candidates:
                        candidate = response.candidates[0]
                        if getattr(candidate, "finish_reason", None) == "SAFETY":
                            raise GeminiBlockedError(reason="Candidate output blocked by safety filter")

                    self.active_model = current_model
                    return response

                except Exception as e:
                    mapped = self._map_gemini_exception(e)
                    last_error = mapped
                    raw_str = str(e)
                    # If 503 high demand or 429 quota exhausted on this specific model, try alternate model
                    if ("503" in raw_str or "UNAVAILABLE" in raw_str or "RESOURCE_EXHAUSTED" in raw_str) and current_model != models_to_try[-1] and attempt >= 1:
                        break

                    # Check if retryable (rate limit or transient reachability / 503 high demand)
                    if isinstance(mapped, (GeminiRateLimitedError, GeminiUnreachableError)) and attempt < max_rate_retries:
                        delay_match = re.search(r"retryDelay['\"]:\s*['\"](\d+(?:\.\d+)?)s?['\"]", raw_str)
                        if delay_match:
                            try:
                                sec = float(delay_match.group(1))
                                if sec > 60:
                                    break
                                time.sleep(sec)
                                continue
                            except ValueError:
                                pass
                        backoff = (1.5 * (2 ** attempt)) + random.uniform(0.1, 0.4)
                        time.sleep(backoff)
                        continue
                    break

        if last_error:
            raise last_error
        raise GeminiUnreachableError()

    def _transcribe_page_image(self, img_bytes: bytes, page_num: int) -> str:
        """Transcribe a page image verbatim using Gemini vision."""
        image_part = types.Part.from_bytes(data=img_bytes, mime_type="image/png")
        prompt = f"Transcribe page {page_num} of this medical document verbatim. Capture all headers, tables, numbers, and dates exactly as written."
        config = types.GenerateContentConfig(
            temperature=0.0,
            system_instruction=IMAGE_TRANSCRIPTION_PROMPT,
        )
        response = self._call_gemini_with_retry([image_part, prompt], config)
        return response.text or ""

    def _ensure_raw_text(self, ingestion: IngestionResult) -> None:
        """Ensure raw_text is populated. For scanned PDFs/images, transcribe verbatim page by page."""
        needs_transcription = (
            ingestion.source_type in {"image", "pdf_scanned"}
            or not ingestion.raw_text
            or ingestion.raw_text.strip().startswith("[Scanned Image:")
        )

        if needs_transcription:
            if not ingestion.image_bytes_list:
                raise DocumentUnreadableError("Scanned document contains no renderable page images.")

            transcribed_pages = []
            for idx, img_bytes in enumerate(ingestion.image_bytes_list):
                page_num = idx + 1
                page_text = self._transcribe_page_image(img_bytes, page_num)
                if not page_text or not page_text.strip():
                    raise DocumentUnreadableError(f"Page {page_num} could not be transcribed or is blank.")
                transcribed_pages.append(f"--- Page {page_num} ---\n{page_text.strip()}")

            ingestion.raw_text = "\n\n".join(transcribed_pages)

        # Validate that text is not empty
        if not ingestion.raw_text or len(ingestion.raw_text.strip()) < 5:
            raise DocumentUnreadableError("Document contains no readable text or is blank.")

    def _extract_chunk(
        self,
        chunk_text: str,
        source_file: str,
        source_type: str,
        image_parts: Optional[List[Any]] = None,
    ) -> RawExtractionPayload:
        """Extract structured payload from a chunk or image with up to 2 validation retries."""
        has_image = bool(image_parts)
        user_prompt = build_user_prompt(
            raw_text=chunk_text,
            source_type=source_type,
            source_file=source_file,
            has_image=has_image,
        )

        config = types.GenerateContentConfig(
            temperature=0.0,
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            response_schema=RawExtractionPayload,
        )

        max_validation_retries = 2
        last_val_err = ""
        contents: List[Any] = list(image_parts) if image_parts else []
        contents.append(user_prompt)

        for attempt in range(max_validation_retries + 1):
            if attempt > 0 and last_val_err:
                retry_contents = list(contents)
                retry_contents.append(
                    f"\n\nCRITICAL FIX REQUIRED: Your previous output failed schema validation:\n{last_val_err}\n"
                    "Correct the JSON so it strictly passes the schema without these errors."
                )
                response = self._call_gemini_with_retry(retry_contents, config)
            else:
                response = self._call_gemini_with_retry(contents, config)

            resp_text = response.text or "{}"
            try:
                data = json.loads(resp_text)
                return RawExtractionPayload.model_validate(data)
            except (json.JSONDecodeError, ValidationError) as e:
                last_val_err = str(e)
                if attempt == max_validation_retries:
                    raise ExtractionInvalidOutputError(
                        f"Gemini output failed schema validation after retries: {last_val_err}"
                    )

        raise ExtractionInvalidOutputError(f"Validation failed: {last_val_err}")

    def extract(self, ingestion: IngestionResult) -> MedicalDocumentExtraction:
        """Full extraction pipeline: transcription -> chunking -> structured extraction -> verification."""
        t_start = time.perf_counter()

        # Step 1: Check if one-call image extraction should be used
        has_images = bool(
            ingestion.image_bytes_list
            and (
                ingestion.source_type in {"image", "pdf_scanned"}
                or not ingestion.raw_text
                or ingestion.raw_text.strip().startswith("[Scanned Image:")
            )
        )

        image_parts = []
        if has_images and ingestion.image_bytes_list:
            for img_bytes in ingestion.image_bytes_list:
                mime = "image/png" if img_bytes.startswith(b"\x89PNG") else "image/jpeg"
                image_parts.append(types.Part.from_bytes(data=img_bytes, mime_type=mime))
        elif not ingestion.raw_text or ingestion.raw_text.strip().startswith("[Scanned Image:"):
            self._ensure_raw_text(ingestion)

        t_llm_start = time.perf_counter()

        # Step 2: Handle chunking for text documents over 6 pages
        pages = re.split(r"(?=---\s*Page\s*\d+\s*---)", ingestion.raw_text or "")
        page_chunks = [p for p in pages if p.strip()]

        if len(page_chunks) > 6 and not has_images:
            chunk_size = 6
            merged_payload = RawExtractionPayload()
            seen_meds = set()
            seen_conds = set()
            seen_labs = set()

            for i in range(0, len(page_chunks), chunk_size):
                if time.perf_counter() - t_start > 90.0:
                    raise ExtractionTimeoutError()
                chunk_slice = page_chunks[i : i + chunk_size]
                chunk_text = "\n\n".join(chunk_slice)
                chunk_payload = self._extract_chunk(chunk_text, ingestion.source_file, ingestion.source_type)

                # Merge chunk results, deduplicating exact matches only
                if i == 0:
                    merged_payload.doc_type = chunk_payload.doc_type
                    merged_payload.document_date_raw = chunk_payload.document_date_raw
                    merged_payload.provider_name = chunk_payload.provider_name
                    merged_payload.facility_name = chunk_payload.facility_name
                    merged_payload.patient_name = chunk_payload.patient_name
                    merged_payload.patient_age = chunk_payload.patient_age
                    merged_payload.patient_sex = chunk_payload.patient_sex
                    merged_payload.allergies = chunk_payload.allergies

                for m in chunk_payload.medications:
                    key = (m.name.lower(), m.dose_raw, m.evidence.quote)
                    if key not in seen_meds:
                        seen_meds.add(key)
                        merged_payload.medications.append(m)

                for c in chunk_payload.conditions:
                    key = (c.name.lower(), c.certainty, c.evidence.quote)
                    if key not in seen_conds:
                        seen_conds.add(key)
                        merged_payload.conditions.append(c)

                for l in chunk_payload.lab_results:
                    key = (l.test_name.lower(), l.value, l.unit, l.evidence.quote)
                    if key not in seen_labs:
                        seen_labs.add(key)
                        merged_payload.lab_results.append(l)

                merged_payload.investigations.extend(chunk_payload.investigations)
                merged_payload.events.extend(chunk_payload.events)
                merged_payload.vitals.extend(chunk_payload.vitals)

            raw_payload = merged_payload
        else:
            raw_payload = self._extract_chunk(
                chunk_text=ingestion.raw_text or "",
                source_file=ingestion.source_file,
                source_type=ingestion.source_type,
                image_parts=image_parts if has_images else None,
            )

        # Update verbatim raw_text if provided by one-call transcription
        if raw_payload.transcribed_raw_text and raw_payload.transcribed_raw_text.strip():
            ingestion.raw_text = raw_payload.transcribed_raw_text.strip()

        # Validate that text is not empty
        if not ingestion.raw_text or len(ingestion.raw_text.strip()) < 5:
            raise DocumentUnreadableError("Document contains no readable text or is blank.")

        llm_ms = (time.perf_counter() - t_llm_start) * 1000

        # Step 3: Enrich into MedicalDocumentExtraction
        doc_id = str(uuid.uuid4())
        extracted_at = datetime.now(timezone.utc).isoformat()

        # Date parsing
        date_obj = None
        if raw_payload.document_date_raw:
            raw_d = raw_payload.document_date_raw.strip()
            date_obj = DateObject(raw=raw_d, precision="unknown", ambiguous=False)
            m_num = re.search(r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b", raw_d)
            if m_num:
                d_p, m_p, y_p = int(m_num.group(1)), int(m_num.group(2)), int(m_num.group(3))
                if y_p < 100:
                    y_p += 2000
                amb = (d_p <= 12 and m_p <= 12 and d_p != m_p)
                date_obj.value = f"{y_p:04d}-{m_p:02d}-{d_p:02d}"
                date_obj.precision = "day"
                date_obj.ambiguous = amb

        doc_meta = DocumentMetadata(
            document_id=doc_id,
            source_file=ingestion.source_file,
            source_type=ingestion.source_type,  # type: ignore
            sha256=ingestion.sha256,
            page_count=ingestion.page_count,
            language="en",
            doc_type=raw_payload.doc_type,
            doc_type_confidence=raw_payload.doc_type_confidence,
            document_date=date_obj,
            provider=ProviderInfo(
                name=raw_payload.provider_name,
                facility=raw_payload.facility_name,
                country=raw_payload.country,
            ),
            extracted_at=extracted_at,
            extractor=ExtractorInfo(provider="gemini", model=self.active_model, version="1.0"),
            extraction_stats=ExtractionStats(pages_processed=ingestion.page_count),
        )

        patient = PatientInfo(
            name=raw_payload.patient_name,
            age=raw_payload.patient_age,
            sex=raw_payload.patient_sex,
            identifiers=[
                PatientIdentifier(type=pid.type, value=pid.value)
                for pid in raw_payload.patient_identifiers
            ],
        )

        medications = [
            MedicationItem(
                name=m.name,
                dose_value=m.dose_value,
                dose_unit=m.dose_unit,
                dose_raw=m.dose_raw,
                route=m.route,
                frequency_raw=m.frequency_raw,
                duration_raw=m.duration_raw,
                status=m.status,
                change_note=m.change_note,
                indication=m.indication,
                evidence=Evidence(quote=m.evidence.quote, page=m.evidence.page),
            )
            for m in raw_payload.medications
        ]

        conditions = [
            ConditionItem(
                name=c.name,
                status=c.status,
                certainty=c.certainty,
                evidence=Evidence(quote=c.evidence.quote, page=c.evidence.page),
            )
            for c in raw_payload.conditions
        ]

        allergies = AllergiesSection(
            status=raw_payload.allergies.status,
            items=[
                AllergyItem(
                    substance=a.substance,
                    reaction=a.reaction,
                    severity=a.severity,
                    evidence=Evidence(quote=a.evidence.quote, page=a.evidence.page),
                )
                for a in raw_payload.allergies.items
            ],
        )

        lab_results = [
            LabResultItem(
                test_name=l.test_name,
                value=l.value,
                value_numeric=l.value_numeric,
                unit=l.unit,
                reference_range_raw=l.reference_range_raw,
                flag=l.flag,
                evidence=Evidence(quote=l.evidence.quote, page=l.evidence.page),
            )
            for l in raw_payload.lab_results
        ]

        investigations = [
            InvestigationItem(
                modality=i.modality,
                body_part=i.body_part,
                findings_raw=i.findings_raw,
                impression_raw=i.impression_raw,
                evidence=Evidence(quote=i.evidence.quote, page=i.evidence.page),
            )
            for i in raw_payload.investigations
        ]

        events = [
            EventItem(
                type=e.type,
                description=e.description,
                evidence=Evidence(quote=e.evidence.quote, page=e.evidence.page),
            )
            for e in raw_payload.events
        ]

        vitals = [
            VitalItem(
                name=v.name,
                value=v.value,
                value_numeric=v.value_numeric,
                unit=v.unit,
                evidence=Evidence(quote=v.evidence.quote, page=v.evidence.page),
            )
            for v in raw_payload.vitals
        ]

        extraction = MedicalDocumentExtraction(
            schema_version="1.0",
            document=doc_meta,
            patient=patient,
            conditions=conditions,
            medications=medications,
            allergies=allergies,
            lab_results=lab_results,
            investigations=investigations,
            events=events,
            vitals=vitals,
            free_text_notes=raw_payload.free_text_notes,
            warnings=[],
            raw_text=ingestion.raw_text,
        )

        # Step 4: Strict evidence verification
        t_verify_start = time.perf_counter()
        validated = validate_extraction(extraction)
        verify_ms = (time.perf_counter() - t_verify_start) * 1000

        total_ms = (time.perf_counter() - t_start) * 1000
        if total_ms > 90000.0:
            raise ExtractionTimeoutError()

        validated.document.extraction_stats.timings_ms = {
            "ingest_ms": round(getattr(ingestion, "ingest_ms", 0.0), 2),
            "llm_ms": round(llm_ms, 2),
            "verify_ms": round(verify_ms, 2),
            "total_ms": round(total_ms, 2),
        }

        if total_ms > 20000.0 and ingestion.source_type == "raw_text":
            logging.getLogger(__name__).warning(
                "Raw text extraction took %.2fs (>20s). Timings: llm=%.1fms, verify=%.1fms, total=%.1fms",
                total_ms / 1000,
                llm_ms,
                verify_ms,
                total_ms,
            )

        return validated
