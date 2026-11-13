"""Pydantic v2 schemas defining the JSON contract for medical document extraction."""

from datetime import datetime, timezone
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class Evidence(BaseModel):
    """Verbatim quote tracing an extracted fact back to the original document."""
    quote: str = Field(description="Verbatim text from the source")
    page: int = Field(default=1, description="Page number where the quote appears")
    char_start: int = Field(default=0, description="Character offset start in raw_text")
    char_end: int = Field(default=0, description="Character offset end in raw_text")

    model_config = ConfigDict(extra="ignore")


class DateObject(BaseModel):
    """Structured date representation preserving raw text and uncertainty."""
    value: Optional[str] = Field(default=None, description="ISO format date YYYY-MM-DD, YYYY-MM, or YYYY")
    raw: str = Field(description="Date text exactly as written in source")
    precision: Literal["day", "month", "year", "unknown"] = Field(
        default="unknown", description="Temporal precision"
    )
    ambiguous: bool = Field(
        default=False, description="True if day/month could be swapped (e.g. 03/04/2022)"
    )

    model_config = ConfigDict(extra="ignore")


class ProviderInfo(BaseModel):
    """Healthcare provider / physician / facility information."""
    name: Optional[str] = Field(default=None, description="Provider/Doctor name")
    facility: Optional[str] = Field(default=None, description="Hospital or clinic name")
    country: Optional[str] = Field(default=None, description="Country")

    model_config = ConfigDict(extra="ignore")


class ExtractorInfo(BaseModel):
    """Metadata regarding the extraction engine."""
    provider: Literal["gemini", "pure_python", "local"] = Field(default="pure_python", description="Extractor provider")
    model: str = Field(description="Model or engine identifier")
    version: str = Field(default="1.0", description="Extractor version")

    model_config = ConfigDict(extra="ignore")


class ExtractionStats(BaseModel):
    """Statistics tracking verification integrity, page chunking, and stage latencies."""
    items_extracted: int = Field(default=0, description="Total entity items extracted")
    items_verified: int = Field(default=0, description="Count of items verified verbatim")
    items_unverified: int = Field(default=0, description="Count of unverifiable items")
    pages_processed: int = Field(default=1, description="Number of pages processed")
    timings_ms: Dict[str, float] = Field(
        default_factory=dict,
        description="Stage execution latencies in milliseconds (ingest_ms, llm_ms, verify_ms, total_ms)"
    )

    model_config = ConfigDict(extra="ignore")


class DocumentMetadata(BaseModel):
    """Metadata describing the input file and extraction context."""
    document_id: str = Field(description="Unique UUID identifier for this extraction")
    source_file: str = Field(description="Original filename or 'raw_text'")
    source_type: Literal["pdf_text", "pdf_scanned", "image", "docx", "raw_text"] = Field(
        description="Format of input file"
    )
    sha256: str = Field(description="SHA-256 hash of original input bytes or text")
    page_count: int = Field(default=1, description="Number of pages in input document")
    language: str = Field(default="en", description="Primary document language (e.g. en, hi, kn)")
    doc_type: Literal[
        "prescription",
        "lab_report",
        "discharge_summary",
        "scan_report",
        "consultation_note",
        "other",
    ] = Field(description="Classification of medical document")
    doc_type_confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    document_date: Optional[DateObject] = Field(default=None, description="Document creation/issue date")
    provider: ProviderInfo = Field(default_factory=ProviderInfo)
    extracted_at: str = Field(description="ISO timestamp of extraction")
    extractor: ExtractorInfo
    extraction_stats: ExtractionStats = Field(default_factory=ExtractionStats)

    model_config = ConfigDict(extra="ignore")


class PatientIdentifier(BaseModel):
    """Patient medical identification number."""
    type: str = Field(description="Identifier type (e.g., MRN, IP, UHID)")
    value: str = Field(description="Identifier value")

    model_config = ConfigDict(extra="ignore")


class PatientInfo(BaseModel):
    """Demographic and identification info for the patient."""
    name: Optional[str] = Field(default=None)
    age: Optional[str] = Field(default=None)
    sex: Optional[str] = Field(default=None)
    dob: Optional[DateObject] = Field(default=None)
    identifiers: List[PatientIdentifier] = Field(default_factory=list)

    model_config = ConfigDict(extra="ignore")


class MedicationItem(BaseModel):
    """Medication prescription, continuation, change, or discontinuation."""
    name: str = Field(description="Brand or generic medication name as written")
    dose_value: Optional[str] = Field(default=None, description="Dose number string (e.g. 500, 10)")
    dose_unit: Optional[str] = Field(default=None, description="Dose unit (e.g. mg, mcg, mL, puff)")
    dose_raw: Optional[str] = Field(default=None, description="Full dose string (e.g. 500 mg)")
    route: Optional[str] = Field(default=None, description="Route (oral, IV, topical, inhalational, etc.)")
    frequency_raw: Optional[str] = Field(default=None, description="Frequency as written (e.g. BD, OD, TDS, HS, 1-0-1)")
    duration_raw: Optional[str] = Field(default=None, description="Duration as written (e.g. 5 days, 1 month)")
    status: Literal["prescribed", "continued", "changed", "stopped", "not_stated"] = Field(
        default="prescribed", description="Medication status relative to this document"
    )
    start_date: Optional[DateObject] = Field(default=None)
    stop_date: Optional[DateObject] = Field(default=None)
    change_note: Optional[str] = Field(default=None, description="Note on dose change or reason if written")
    indication: Optional[str] = Field(default=None, description="Indication if written in source")
    evidence: Evidence
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    flags: List[str] = Field(default_factory=list)

    model_config = ConfigDict(extra="ignore")


class LabResultItem(BaseModel):
    """Individual lab diagnostic measurement."""
    test_name: str = Field(description="Lab test name as written")
    value: str = Field(description="Result value string exactly as written")
    value_numeric: Optional[float] = Field(default=None, description="Parsed numeric value if applicable")
    unit: Optional[str] = Field(default=None, description="Unit exactly as written (never converted)")
    reference_range_raw: Optional[str] = Field(default=None, description="Reference range as written")
    flag: Literal["high", "low", "normal", "abnormal", "not_stated"] = Field(
        default="not_stated", description="Result flag only if explicitly printed or indicated"
    )
    collected_date: Optional[DateObject] = Field(default=None)
    reported_date: Optional[DateObject] = Field(default=None)
    evidence: Evidence
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    flags: List[str] = Field(default_factory=list)

    model_config = ConfigDict(extra="ignore")


class ConditionItem(BaseModel):
    """Diagnosis, symptom, or medical condition."""
    name: str = Field(description="Condition name as written")
    status: Literal["active", "resolved", "historical", "suspected", "not_stated"] = Field(
        default="not_stated", description="Status of condition"
    )
    onset_date: Optional[DateObject] = Field(default=None)
    certainty: Literal["confirmed", "suspected", "ruled_out", "not_stated"] = Field(
        default="not_stated", description="Certainty level. Suspicious terms ('?', 'probable', 'r/o') must be suspected."
    )
    evidence: Evidence
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    flags: List[str] = Field(default_factory=list)

    model_config = ConfigDict(extra="ignore")


class AllergyItem(BaseModel):
    """Individual known allergy or adverse reaction."""
    substance: str = Field(description="Allergen or substance as written")
    reaction: Optional[str] = Field(default=None, description="Reaction manifestations if written")
    severity: Optional[str] = Field(default=None, description="Severity if written")
    evidence: Evidence
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    flags: List[str] = Field(default_factory=list)

    model_config = ConfigDict(extra="ignore")


class AllergiesSection(BaseModel):
    """Allergies evaluation distinguishing explicit negative from unmentioned."""
    status: Literal["present", "explicit_negative", "not_documented"] = Field(
        default="not_documented",
        description="present = allergies found; explicit_negative = explicitly denied (NKDA); not_documented = unmentioned",
    )
    items: List[AllergyItem] = Field(default_factory=list)

    model_config = ConfigDict(extra="ignore")


class InvestigationItem(BaseModel):
    """Diagnostic imaging, scan, endoscopy, or functional test."""
    modality: Optional[str] = Field(default=None, description="X-ray, CT, MRI, USG, ECG, Echo, etc.")
    body_part: Optional[str] = Field(default=None, description="Anatomical region")
    findings_raw: Optional[str] = Field(default=None, description="Detailed findings text")
    impression_raw: Optional[str] = Field(default=None, description="Final impression/conclusion")
    date: Optional[DateObject] = Field(default=None)
    evidence: Evidence
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    flags: List[str] = Field(default_factory=list)

    model_config = ConfigDict(extra="ignore")


class EventItem(BaseModel):
    """Clinical event such as admission, discharge, surgery, or procedure."""
    type: Literal["admission", "discharge", "surgery", "procedure", "visit", "follow_up", "other"] = Field(
        default="other"
    )
    date: Optional[DateObject] = Field(default=None)
    description: str = Field(description="Description of event")
    evidence: Evidence
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    flags: List[str] = Field(default_factory=list)

    model_config = ConfigDict(extra="ignore")


class VitalItem(BaseModel):
    """Physiological vital signs (BP, Pulse, Temperature, SpO2, RR, BMI)."""
    name: str = Field(description="Vital sign name (e.g. BP, Pulse, Temp, SpO2)")
    value: str = Field(description="Value as written (e.g. 120/80, 72, 98.6)")
    value_numeric: Optional[float] = Field(default=None)
    unit: Optional[str] = Field(default=None, description="Unit (e.g. mmHg, bpm, F, %)")
    evidence: Evidence
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    flags: List[str] = Field(default_factory=list)

    model_config = ConfigDict(extra="ignore")


class UnverifiedItem(BaseModel):
    """Extracted item that failed strict verbatim evidence check or numeric consistency."""
    item_type: str = Field(description="Entity type e.g. medication, condition, lab_result, vital")
    reason: str = Field(description="Reason why the item was unverified")
    raw_quote: Optional[str] = Field(default=None, description="Quote submitted by extractor")
    item_data: Dict[str, Any] = Field(default_factory=dict, description="Payload of the item")

    model_config = ConfigDict(extra="ignore")


class MedicalDocumentExtraction(BaseModel):
    """Complete structured JSON representation of an ingested medical document."""
    schema_version: str = Field(default="1.0")
    document: DocumentMetadata
    patient: PatientInfo = Field(default_factory=PatientInfo)
    conditions: List[ConditionItem] = Field(default_factory=list)
    medications: List[MedicationItem] = Field(default_factory=list)
    allergies: AllergiesSection = Field(default_factory=AllergiesSection)
    lab_results: List[LabResultItem] = Field(default_factory=list)
    investigations: List[InvestigationItem] = Field(default_factory=list)
    events: List[EventItem] = Field(default_factory=list)
    vitals: List[VitalItem] = Field(default_factory=list)
    free_text_notes: List[str] = Field(default_factory=list)
    unverified_items: List[UnverifiedItem] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    raw_text: str = Field(default="", description="Full page-tagged extracted text")

    model_config = ConfigDict(extra="ignore")


class BatchItemResult(BaseModel):
    """Result of an individual document extraction within a batch."""
    filename: str
    status: Literal["queued", "processing", "ok", "error", "duplicate"]
    elapsed_sec: float = Field(default=0.0, description="Elapsed seconds for this item")
    document: Optional[MedicalDocumentExtraction] = None
    error: Optional[Dict[str, Any]] = None
    original_document_id: Optional[str] = None
    original_filename: Optional[str] = None
    original_extracted_at: Optional[str] = None

    model_config = ConfigDict(extra="ignore")


class BatchExtractionResponse(BaseModel):
    """Response structure for multi-document batch extraction."""
    batch_id: str
    status: Literal["queued", "processing", "completed", "cancelled"] = "completed"
    total: int
    succeeded: int
    failed: int
    results: List[BatchItemResult]
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    model_config = ConfigDict(extra="ignore")


def get_json_schema() -> Dict[str, Any]:
    """Return the JSON schema dictionary for MedicalDocumentExtraction."""
    return MedicalDocumentExtraction.model_json_schema()
