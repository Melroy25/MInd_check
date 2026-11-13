"""Pure Python Clinical Document Extraction Provider.

Extracts structured medical data from clinical text, PDFs, and OCR-processed images
without requiring any cloud AI API keys or paid tiers. 100% offline, private, and free.
"""

import re
import uuid
import time
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple

from app.extract.base import LLMProvider
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
    VitalItem,
    Evidence,
)

# ─── MEDICAL VOCABULARY & REGEX CONSTANTS ───────────────────────────────────────

COMMON_CONDITIONS = [
    "type 2 diabetes mellitus", "type 1 diabetes mellitus", "diabetes mellitus", "t2dm", "t1dm", "diabetes",
    "essential hypertension", "hypertension", "htn",
    "hyperlipidemia", "dyslipidemia", "hypercholesterolemia",
    "coronary artery disease", "cad", "myocardial infarction", "angina",
    "bronchial asthma", "asthma", "copd", "chronic bronchitis",
    "acute pharyngitis", "pharyngitis", "tonsillitis", "upper respiratory tract infection", "urti",
    "viral fever", "acute febrile illness", "typhoid", "malaria", "dengue",
    "gastroesophageal reflux disease", "gerd", "gastritis", "peptic ulcer disease",
    "hypothyroidism", "hyperthyroidism",
    "chronic kidney disease", "ckd", "acute kidney injury", "aki",
    "osteoarthritis", "rheumatoid arthritis", "gout",
    "migraine", "tension headache",
    "generalized anxiety disorder", "major depressive disorder", "depression",
    "urinary tract infection", "uti",
    "pneumonia", "bronchitis", "covid-19",
]

COMMON_DRUGS = [
    "paracetamol", "acetaminophen", "ibuprofen", "aspirin", "pantoprazole", "omeprazole", "rabeprazole",
    "metformin", "glimepiride", "vildagliptin", "sitagliptin", "empagliflozin", "dapagliflozin", "insulin",
    "telmisartan", "amlodipine", "losartan", "ramipril", "enalapril", "atenolol", "metoprolol", "bisoprolol",
    "atorvastatin", "rosuvastatin", "clopidogrel", "azithromycin", "amoxicillin", "clavulanate", "augmentin",
    "ciprofloxacin", "ofloxacin", "levofloxacin", "cefixime", "ceftriaxone", "doxycycline", "metronidazole",
    "levothyroxine", "thyroxine", "montelukast", "cetirizine", "fexofenadine", "levocetirizine",
    "salbutamol", "budesonide", "formoterol", "fluticasone",
    "tramadol", "diclofenac", "aceclofenac", "gabapentin", "pregabalin",
    "calcium", "vitamin d3", "cholecalciferol", "multivitamin", "b-complex", "folic acid", "iron",
]

COMMON_LAB_TESTS = [
    ("fasting blood sugar", "mg/dL", 70.0, 100.0),
    ("fbs", "mg/dL", 70.0, 100.0),
    ("post prandial blood sugar", "mg/dL", 70.0, 140.0),
    ("ppbs", "mg/dL", 70.0, 140.0),
    ("random blood sugar", "mg/dL", 70.0, 140.0),
    ("rbs", "mg/dL", 70.0, 140.0),
    ("hba1c", "%", 4.0, 5.7),
    ("hbalc", "%", 4.0, 5.7),
    ("hemoglobin", "g/dL", 12.0, 16.0),
    ("total cholesterol", "mg/dL", 100.0, 200.0),
    ("serum cholesterol", "mg/dL", 100.0, 200.0),
    ("triglycerides", "mg/dL", 50.0, 150.0),
    ("hdl cholesterol", "mg/dL", 40.0, 60.0),
    ("ldl cholesterol", "mg/dL", 60.0, 100.0),
    ("serum creatinine", "mg/dL", 0.6, 1.2),
    ("creatinine", "mg/dL", 0.6, 1.2),
    ("blood urea", "mg/dL", 15.0, 45.0),
    ("blood urea nitrogen", "mg/dL", 7.0, 20.0),
    ("bun", "mg/dL", 7.0, 20.0),
    ("uric acid", "mg/dL", 3.5, 7.2),
    ("serum bilirubin", "mg/dL", 0.2, 1.2),
    ("sgot", "U/L", 5.0, 40.0),
    ("sgpt", "U/L", 5.0, 40.0),
    ("alkaline phosphatase", "U/L", 44.0, 147.0),
    ("total leukocyte count", "/cumm", 4000.0, 11000.0),
    ("tlc", "/cumm", 4000.0, 11000.0),
    ("wbc count", "/cumm", 4000.0, 11000.0),
    ("platelet count", "lakhs/cumm", 1.5, 4.5),
    ("platelets", "lakhs/cumm", 1.5, 4.5),
    ("tsh", "uIU/mL", 0.4, 4.5),
    ("vitamin d", "ng/mL", 30.0, 100.0),
    ("vitamin b12", "pg/mL", 200.0, 900.0),
]


class PurePythonProvider(LLMProvider):
    """Pure Python clinical information extraction engine.
    
    Extracts structured, verified clinical facts from text without any external AI APIs.
    """

    def __init__(self, model_name: str = "pure-python-clinical-ner-v1"):
        self.model_name = model_name

    def check_health(self) -> Dict[str, Any]:
        """Health check returning local engine readiness."""
        return {
            "status": "healthy",
            "provider": "pure_python",
            "model": self.model_name,
            "engine": "Local Clinical Regex & Rules Engine",
            "offline_mode": True,
            "key_present": False,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    def extract(self, ingestion: IngestionResult) -> MedicalDocumentExtraction:
        """Execute full pure Python extraction over ingested document."""
        t0 = time.perf_counter()
        raw_text = ingestion.raw_text or ""
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]

        # 1. Classify Document Type
        doc_type, doc_conf = self._classify_doc_type(raw_text)

        # 2. Extract Document Date
        doc_date = self._extract_date(raw_text)

        # 3. Extract Provider & Facility
        provider = self._extract_provider(raw_text, lines)

        # 4. Extract Patient Demographics
        patient = self._extract_patient(raw_text, lines)

        # 5. Extract Allergies
        allergies = self._extract_allergies(raw_text, lines)

        # 6. Extract Medications
        medications = self._extract_medications(raw_text, lines)

        # 7. Extract Conditions / Diagnoses
        conditions = self._extract_conditions(raw_text, lines)

        # 8. Extract Lab Results
        lab_results = self._extract_lab_results(raw_text, lines)

        # 9. Extract Vitals
        vitals = self._extract_vitals(raw_text, lines)

        # Assemble Raw Extraction
        doc_id = str(uuid.uuid4())
        extracted_at = datetime.now(timezone.utc).isoformat()
        t_engine = (time.perf_counter() - t0) * 1000.0

        metadata = DocumentMetadata(
            document_id=doc_id,
            source_file=ingestion.source_file,
            source_type=ingestion.source_type,  # type: ignore
            sha256=ingestion.sha256,
            page_count=ingestion.page_count,
            language="en",
            doc_type=doc_type,
            doc_type_confidence=doc_conf,
            document_date=doc_date,
            provider=provider,
            extracted_at=extracted_at,
            extractor=ExtractorInfo(provider="pure_python", model=self.model_name, version="1.0"),
            extraction_stats=ExtractionStats(
                pages_processed=ingestion.page_count,
                timings_ms={"ingest_ms": 1.0, "llm_ms": round(t_engine, 2)},
            ),
        )

        extraction = MedicalDocumentExtraction(
            schema_version="1.0",
            document=metadata,
            patient=patient,
            conditions=conditions,
            medications=medications,
            allergies=allergies,
            lab_results=lab_results,
            investigations=[],
            events=[],
            vitals=vitals,
            raw_text=raw_text,
        )

        # Validate evidence quotes & compute exact character offsets
        t_val_start = time.perf_counter()
        verified_doc = validate_extraction(extraction)
        t_val = (time.perf_counter() - t_val_start) * 1000.0

        verified_doc.document.extraction_stats.timings_ms["verify_ms"] = round(t_val, 2)
        verified_doc.document.extraction_stats.timings_ms["total_ms"] = round(t_engine + t_val, 2)

        return verified_doc

    # ─── 1. DOCUMENT TYPE CLASSIFICATION ────────────────────────────────────────

    def _classify_doc_type(self, text: str) -> Tuple[str, float]:
        t_low = text.lower()

        scores = {
            "prescription": 0,
            "lab_report": 0,
            "discharge_summary": 0,
            "scan_report": 0,
            "consultation_note": 0,
        }

        # Prescription cues
        if re.search(r"\b(rx|prescription|tab\b|cap\b|syrup|dosage|1-0-1|od\b|bd\b|tds\b)\b", t_low):
            scores["prescription"] += 3
        if "prescription" in t_low:
            scores["prescription"] += 4

        # Lab report cues
        if re.search(r"\b(lab report|investigation|reference range|biological interval|hematology|biochemistry|specimen|serum|blood sugar|hba1c|wbc)\b", t_low):
            scores["lab_report"] += 4

        # Discharge summary cues
        if re.search(r"\b(discharge summary|date of admission|date of discharge|hospital course|discharge advice)\b", t_low):
            scores["discharge_summary"] += 6

        # Scan report cues
        if re.search(r"\b(mri|ct scan|ultrasound|usg|x-ray|radiology|imaging report|impression:)\b", t_low):
            scores["scan_report"] += 4

        # Consultation note cues
        if re.search(r"\b(consultation note|chief complaint|history of present illness|o/e:|hpi|k/c/o)\b", t_low):
            scores["consultation_note"] += 4

        best_type, score = max(scores.items(), key=lambda kv: kv[1])
        if score > 0:
            confidence = min(0.95, 0.60 + (score * 0.05))
            return best_type, round(confidence, 2)
        return "other", 0.50

    # ─── 2. DATE EXTRACTION ─────────────────────────────────────────────────────

    def _extract_date(self, text: str) -> Optional[DateObject]:
        # Matches formats: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, DD Month YYYY
        patterns = [
            (r"\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b", "iso"),
            (r"\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b", "dmy_or_mdy"),
            (r"\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\b", "named"),
        ]

        month_map = {
            "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
            "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
        }

        # Prefer dates appearing after 'Date:' or near header
        header_text = text[:800]

        for pat, kind in patterns:
            match = re.search(pat, header_text, re.IGNORECASE)
            if not match:
                match = re.search(pat, text, re.IGNORECASE)

            if match:
                raw_match = match.group(0)
                if kind == "iso":
                    y, m, d = int(match.group(1)), int(match.group(2)), int(match.group(3))
                    iso_val = f"{y:04d}-{m:02d}-{d:02d}"
                    return DateObject(value=iso_val, raw=raw_match, precision="day", ambiguous=False)

                elif kind == "dmy_or_mdy":
                    n1, n2, y = int(match.group(1)), int(match.group(2)), int(match.group(3))
                    ambiguous = (n1 <= 12 and n2 <= 12)
                    # India / international standard: DD/MM/YYYY
                    d, m = n1, n2
                    iso_val = f"{y:04d}-{m:02d}-{d:02d}"
                    return DateObject(value=iso_val, raw=raw_match, precision="day", ambiguous=ambiguous)

                elif kind == "named":
                    d = int(match.group(1))
                    m_str = match.group(2).lower()[:3]
                    m = month_map.get(m_str, 1)
                    y = int(match.group(3))
                    iso_val = f"{y:04d}-{m:02d}-{d:02d}"
                    return DateObject(value=iso_val, raw=raw_match, precision="day", ambiguous=False)

        return None

    # ─── 3. PROVIDER & FACILITY ─────────────────────────────────────────────────

    def _extract_provider(self, text: str, lines: List[str]) -> ProviderInfo:
        doc_name = None
        facility = None

        # Doctor Name Match
        doc_match = re.search(r"(?:Doctor|Dr\.?|Physician):\s*([^\n,]+)", text, re.IGNORECASE)
        if doc_match:
            doc_name = doc_match.group(1).strip()
            # Clean qualification if attached e.g. Dr. Anita Rao, MBBS
            doc_name = re.sub(r",?\s*(?:MBBS|MD|MS|DNB|DM|MRCP|FRCS).*", "", doc_name, flags=re.IGNORECASE).strip()
            if not doc_name.lower().startswith("dr.") and not doc_name.lower().startswith("dr "):
                doc_name = f"Dr. {doc_name}"
        else:
            # Look for standalone Dr. Name in top lines
            for l in lines[:10]:
                m = re.search(r"\b(Dr\.?\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)", l)
                if m:
                    doc_name = m.group(1).strip()
                    break

        # Facility Match
        for l in lines[:8]:
            if re.search(r"\b(hospital|clinic|healthcare|health clinic|medical center|institute|diagnostics|labs|dispensary)\b", l, re.IGNORECASE):
                # Clean line
                clean_f = re.sub(r"^---\s*Page\s*\d+\s*---\s*", "", l).strip()
                if clean_f and not clean_f.lower().startswith("dr."):
                    facility = clean_f
                    break

        return ProviderInfo(name=doc_name, facility=facility, country="India")

    # ─── 4. PATIENT DEMOGRAPHICS ────────────────────────────────────────────────

    def _extract_patient(self, text: str, lines: List[str]) -> PatientInfo:
        name = None
        age = None
        sex = None
        identifiers = []

        # Patient Name
        name_match = re.search(r"(?:Patient(?:\s+Name)?|Pt(?:\s+Name)?|Name):\s*([A-Za-z\s.]+?)(?=\s*[\(\n,]|\s+Age|\s+Sex|\s+MRN|\s+UHID|$)", text, re.IGNORECASE)
        if name_match:
            raw_name = name_match.group(1).strip()
            if raw_name and len(raw_name) > 1 and not raw_name.lower().startswith("age"):
                name = raw_name

        # Age and Sex from combined fields like "Age/Sex: 45 yrs / Male" or "Age/Sex: 45 yrs\nMale"
        age_sex_combo = re.search(
            r"(?:Age\s*(?:/|&)?\s*(?:Sex|Gender))\s*[:\-]?\s*(\d{1,3}(?:\s*(?:yrs|years|y|y/o))?)\s*[/|,\s\n]+\s*(Male|Female|M|F)\b",
            text,
            re.IGNORECASE,
        )
        if age_sex_combo:
            age = age_sex_combo.group(1).strip()
            raw_s = age_sex_combo.group(2).upper()
            sex = "Male" if raw_s.startswith("M") else "Female"

        age_sex_compact = re.search(r"\((\d{1,3})\s*([MFmf])\)", text)
        if age_sex_compact:
            if not age:
                age = age_sex_compact.group(1)
            if not sex:
                sex = "Male" if age_sex_compact.group(2).upper() == "M" else "Female"

        if not age:
            age_match = re.search(r"\b(?:Age(?:\s*/\s*Sex)?|Aged?)\s*[:\-]?\s*(\d{1,3}(?:\s*(?:yrs|years|Y|Y/O))?)\b", text, re.IGNORECASE)
            if age_match:
                age = age_match.group(1).strip()

        if not sex:
            sex_match = re.search(r"\b(?:Sex|Gender)\s*[:\-]?\s*(Male|Female|M|F)\b", text, re.IGNORECASE)
            if sex_match:
                raw_s = sex_match.group(1).upper()
                sex = "Male" if raw_s in {"M", "MALE"} else "Female"
            else:
                header_text = text[:1200]
                standalone_sex = re.search(r"\b(Male|Female)\b", header_text, re.IGNORECASE)
                if standalone_sex:
                    sex = "Male" if standalone_sex.group(1).upper().startswith("M") else "Female"

        # Identifiers (MRN, UHID, IP/OP)
        mrn_match = re.search(r"\b(MRN|UHID|IP|OP|Patient ID|Record No):\s*([A-Za-z0-9\-]+)", text, re.IGNORECASE)
        if mrn_match:
            identifiers.append(PatientIdentifier(type=mrn_match.group(1).upper(), value=mrn_match.group(2).strip()))

        return PatientInfo(name=name, age=age, sex=sex, identifiers=identifiers)

    # ─── 5. ALLERGIES EXTRACTION ────────────────────────────────────────────────

    def _extract_allergies(self, text: str, lines: List[str]) -> AllergiesSection:
        t_low = text.lower()

        # Strict Clinical Invariant: Explicit Negative
        if re.search(r"\b(nkda|no known allergies|no known drug allergies|allergies:\s*none|allergy:\s*nil)\b", t_low):
            return AllergiesSection(status="explicit_negative", items=[])

        # Present Allergies
        allergy_items = []
        for line in lines:
            if "allerg" in line.lower() and not re.search(r"\b(nkda|none|nil|not stated)\b", line.lower()):
                # e.g. "Allergies: Penicillin (skin rash)" or "Critical Allergies: Severe Anaphylaxis to Peanuts & Penicillin"
                # Strip prefix
                cleaned = re.sub(r"^.*?allerg(?:ies|y)?\s*:\s*", "", line, flags=re.IGNORECASE)
                # Check for leading severity/descriptor e.g. "Severe Anaphylaxis to Peanuts & Penicillin"
                desc_match = re.search(r"^(?:severe|critical|moderate|mild|known|documented)\s+(?:anaphylaxis|reaction|sensitivity|hypersensitivity)?\s*(?:to\s+)?([^;,\.\n]+)", cleaned, re.IGNORECASE)
                if desc_match:
                    substance = desc_match.group(1).strip()
                    reaction = "Anaphylaxis / Hypersensitivity"
                    severity = "severe" if "severe" in line.lower() or "critical" in line.lower() else "moderate"
                else:
                    m = re.search(r"^([A-Za-z\s&]+?)(?:[\s\-\(]+([^,\)\n]+)[\)]?)?(?:;|\.|$)", cleaned, re.IGNORECASE)
                    if m:
                        substance = m.group(1).strip()
                        reaction = m.group(2).strip() if m.group(2) else None
                        severity = "severe" if "severe" in line.lower() else "moderate"
                    else:
                        substance = cleaned.split(';')[0].split(',')[0].strip()
                        reaction = None
                        severity = "moderate"

                if substance and substance.lower() not in {"none", "nil", "severe", "critical", "moderate", "mild"}:
                    allergy_items.append(
                        AllergyItem(
                            substance=substance,
                            reaction=reaction,
                            severity=severity,
                            evidence=Evidence(quote=line, page=1),
                        )
                    )

        if allergy_items:
            return AllergiesSection(status="present", items=allergy_items)

        # Default when unmentioned
        return AllergiesSection(status="not_documented", items=[])

    # ─── 6. MEDICATIONS EXTRACTION ──────────────────────────────────────────────

    def _extract_medications(self, text: str, lines: List[str]) -> List[MedicationItem]:
        medications = []
        seen_drugs = set()

        # Regex for dose, frequency, duration
        dose_regex = re.compile(r"\b(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|iu|puff|units?)\b", re.IGNORECASE)
        freq_regex = re.compile(r"\b(OD|BD|TDS|QID|Q4H|Q6H|Q8H|Q12H|HS|SOS|PRN|once daily|twice daily|thrice daily|1-0-1|0-1-0|1-0-0|0-0-1|1-1-1)\b", re.IGNORECASE)
        dur_regex = re.compile(r"\b(?:x\s*)?(\d+\s*(?:days?|weeks?|months?|d))\b", re.IGNORECASE)

        for line in lines:
            line_low = line.lower()

            # Skip standalone title/header lines
            if re.match(r"^\s*(?:consultation note|discharge summary|lab report)\s*$", line_low):
                continue
            if re.match(r"^\s*allerg(?:ies|y)?\s*:\s*(?:nkda|none|nil|no known[^\.]*)\.?\s*$", line_low):
                continue

            # Check if line indicates medication
            is_med_line = (
                re.search(r"^\s*(?:\d+[\.\)]\s*)?(?:Tab|Cap|Inj|Syr|Tablet|Capsule|Syrup|Rx\b)", line, re.IGNORECASE)
                or any(d in line_low for d in COMMON_DRUGS)
            )

            if is_med_line:
                # Find drug name
                drug_name = None
                for d in COMMON_DRUGS:
                    if re.search(rf"\b{re.escape(d)}\b", line_low):
                        drug_name = d.capitalize()
                        break

                if not drug_name:
                    # Fallback drug name from Tab/Cap prefix
                    m_prefix = re.search(r"(?:Tab|Cap|Inj|Syr|Tablet|Capsule)\.?\s+([A-Za-z]+)", line, re.IGNORECASE)
                    if m_prefix:
                        drug_name = m_prefix.group(1).capitalize()

                if not drug_name:
                    continue

                if drug_name in seen_drugs:
                    continue
                seen_drugs.add(drug_name)

                # Dose
                dose_val = None
                dose_unit = None
                dose_raw = None
                m_dose = dose_regex.search(line)
                if m_dose:
                    dose_val = m_dose.group(1)
                    dose_unit = m_dose.group(2).lower()
                    dose_raw = f"{dose_val} {dose_unit}"

                # Frequency
                m_freq = freq_regex.search(line)
                freq_raw = m_freq.group(1).upper() if m_freq else None

                # Duration
                m_dur = dur_regex.search(line)
                dur_raw = m_dur.group(1) if m_dur else None

                # Status
                if any(w in line_low for w in ["continue", "cont.", "maintained"]):
                    status = "continued"
                elif any(w in line_low for w in ["stopped", "discontinue", "discontinued", "hold"]):
                    status = "stopped"
                elif any(w in line_low for w in ["changed", "switched", "increased", "decreased"]):
                    status = "changed"
                else:
                    status = "prescribed"

                medications.append(
                    MedicationItem(
                        name=drug_name,
                        dose_value=dose_val,
                        dose_unit=dose_unit,
                        dose_raw=dose_raw,
                        route="oral",
                        frequency_raw=freq_raw,
                        duration_raw=dur_raw,
                        status=status,
                        evidence=Evidence(quote=line, page=1),
                    )
                )

        return medications

    # ─── 7. CONDITIONS EXTRACTION ───────────────────────────────────────────────

    def _extract_conditions(self, text: str, lines: List[str]) -> List[ConditionItem]:
        conditions = []
        seen_conditions = set()

        # Sort conditions by length descending to match specific phrases before generic ones
        sorted_conditions = sorted(COMMON_CONDITIONS, key=len, reverse=True)

        for line in lines:
            line_low = line.lower()
            line_matched = set()

            for cond in sorted_conditions:
                # If a more specific condition on this line already covers this term, skip
                if any(cond in prior for prior in line_matched):
                    continue

                pattern = rf"\b{re.escape(cond)}\b"
                if re.search(pattern, line_low):
                    if cond in seen_conditions:
                        continue
                    seen_conditions.add(cond)
                    line_matched.add(cond)

                    # Determine certainty
                    certainty = "confirmed"
                    if re.search(r"(\?|probable|suspected|r/o|rule out)", line_low):
                        certainty = "suspected"
                    elif re.search(r"(no evidence of|ruled out|negative for)", line_low):
                        certainty = "ruled_out"

                    # Determine status
                    status = "active"
                    if re.search(r"\b(resolved|cured|past|history of|h/o)\b", line_low):
                        status = "resolved"

                    # Canonical capitalization
                    canon_name = " ".join(w.capitalize() for w in cond.split())
                    if cond in {"htn", "cad", "copd", "gerd", "ckd", "aki", "uti"}:
                        canon_name = cond.upper()

                    conditions.append(
                        ConditionItem(
                            name=canon_name,
                            status=status,
                            certainty=certainty,
                            evidence=Evidence(quote=line, page=1),
                        )
                    )

        return conditions

    # ─── 8. LAB RESULTS EXTRACTION ──────────────────────────────────────────────

    def _extract_lab_results(self, text: str, lines: List[str]) -> List[LabResultItem]:
        results = []
        seen_tests = set()

        for i, line in enumerate(lines):
            line_low = line.lower()

            # Skip lines in comments, impressions, or future recommendations (e.g. "Review with FBS, PPBS after 3 months")
            if any(skip_kw in line_low for skip_kw in ["review with", "repeat after", "months", "after 3", "advice:", "comments:"]):
                continue

            for test_name, std_unit, min_ref, max_ref in COMMON_LAB_TESTS:
                if test_name in seen_tests:
                    continue

                if re.search(rf"\b{re.escape(test_name)}\b", line_low):
                    # Look for numeric value in same line first
                    val_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:mg/dl|%|g/dl|mmol/l|u/l|ng/ml|pg/ml|/cumm)?", line[line_low.find(test_name) + len(test_name):], re.IGNORECASE)
                    evidence_quote = line

                    # If not on same line, inspect subsequent vertical table rows (OCR layout)
                    if not val_match:
                        for offset in range(1, min(5, len(lines) - i)):
                            next_line = lines[i + offset].strip()
                            next_val = re.search(r"^(\d+(?:\.\d+)?)\b", next_line)
                            if next_val:
                                val_match = next_val
                                # Use verbatim text slice so quote offsets match raw_text exactly
                                evidence_quote = f"{line}\n{next_line}"
                                break

                    if val_match:
                        seen_tests.add(test_name)
                        raw_val = val_match.group(1)
                        try:
                            num_val = float(raw_val)
                        except ValueError:
                            num_val = None

                        # Determine flag from reference ranges or document tags
                        flag = "normal"
                        if num_val is not None:
                            if num_val > max_ref:
                                flag = "high"
                            elif num_val < min_ref:
                                flag = "low"

                        nearby_block = " ".join(lines[i:min(i + 5, len(lines))])
                        nearby_low = nearby_block.lower()
                        if "high" in nearby_low:
                            flag = "high"
                        elif "low" in nearby_low:
                            flag = "low"

                        # Extract unit if written
                        unit_match = re.search(r"\b(mg/dL|mgldL|mgydL|g/dL|%|mmol/L|U/L|ng/mL|pg/mL|uIU/mL|lakhs/cumm|/cumm)\b", nearby_block, re.IGNORECASE)
                        unit = unit_match.group(1) if unit_match else std_unit
                        if unit.lower() in {"mgldl", "mgydl"}:
                            unit = "mg/dL"

                        canon_test_name = " ".join(w.capitalize() for w in test_name.split())
                        if test_name in {"hba1c", "hbalc", "fbs", "ppbs", "rbs", "bun", "tlc", "tsh", "sgot", "sgpt"}:
                            canon_test_name = "HbA1c" if test_name in {"hba1c", "hbalc"} else test_name.upper()

                        results.append(
                            LabResultItem(
                                test_name=canon_test_name,
                                value=raw_val,
                                value_numeric=num_val,
                                unit=unit,
                                reference_range_raw=f"{min_ref} - {max_ref}",
                                flag=flag,
                                evidence=Evidence(quote=evidence_quote, page=1),
                            )
                        )

        return results

    # ─── 9. VITALS EXTRACTION ───────────────────────────────────────────────────

    def _extract_vitals(self, text: str, lines: List[str]) -> List[VitalItem]:
        vitals = []

        # Blood Pressure: 120/80 mmHg
        bp_match = re.search(r"\bBP\s*[:=]?\s*(\d{2,3}/\d{2,3})\s*(?:mmHg)?\b", text, re.IGNORECASE)
        if bp_match:
            vitals.append(
                VitalItem(
                    name="blood_pressure",
                    value=bp_match.group(1),
                    unit="mmHg",
                    evidence=Evidence(quote=bp_match.group(0), page=1),
                )
            )

        # Pulse / Heart Rate
        pulse_match = re.search(r"\b(?:Pulse|HR|Heart Rate)\s*[:=]?\s*(\d{2,3})\s*(?:/min|bpm)?\b", text, re.IGNORECASE)
        if pulse_match:
            vitals.append(
                VitalItem(
                    name="heart_rate",
                    value=pulse_match.group(1),
                    unit="bpm",
                    evidence=Evidence(quote=pulse_match.group(0), page=1),
                )
            )

        # Temperature
        temp_match = re.search(r"\b(?:Temp|Temperature)\s*[:=]?\s*(\d{2,3}(?:\.\d+)?)\s*(?:F|C|deg)?\b", text, re.IGNORECASE)
        if temp_match:
            vitals.append(
                VitalItem(
                    name="temperature",
                    value=temp_match.group(1),
                    unit="F",
                    evidence=Evidence(quote=temp_match.group(0), page=1),
                )
            )

        # SpO2
        spo2_match = re.search(r"\b(?:SpO2|Oxygen Saturation)\s*[:=]?\s*(\d{2,3})\s*%?\b", text, re.IGNORECASE)
        if spo2_match:
            vitals.append(
                VitalItem(
                    name="spo2",
                    value=spo2_match.group(1),
                    unit="%",
                    evidence=Evidence(quote=spo2_match.group(0), page=1),
                )
            )

        return vitals
