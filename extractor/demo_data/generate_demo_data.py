"""Generate synthetic fictional medical documents and expected ground-truth JSON files.

Covers:
- PDF (text)
- PNG (image with Pillow rendering and embedded metadata)
- DOCX (paragraphs and tables)
- Raw text (.txt)
And all 8 tricky cases:
1. Prescription with Metformin 500 mg BD (later stopped in another document)
2. Lab report image with Fasting Blood Sugar in mg/dL (never converted)
3. Lab report PDF with Fasting Blood Glucose in mmol/L (never converted)
4. Discharge summary DOCX with suspected & resolved conditions, Amlodipine changed, Metformin stopped
5. Consultation note raw text with ambiguous date (03/04/2022) and NKDA
6. Allergy contradiction pair (Penicillin rash vs NKDA)
7. Scan report with findings/impression, and unmentioned allergies yielding 'not_documented'
8. Multilingual consultation note with Hindi text
9. Exact duplicate file for SHA-256 duplicate testing
"""

import json
import shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, PngImagePlugin
from fpdf import FPDF
import docx

BASE_DIR = Path(__file__).resolve().parent.parent
DOCS_DIR = BASE_DIR / "demo_data" / "documents"
EXPECTED_DIR = BASE_DIR / "demo_data" / "expected"

DOCS_DIR.mkdir(parents=True, exist_ok=True)
EXPECTED_DIR.mkdir(parents=True, exist_ok=True)


def create_pdf_prescription(filepath: Path):
    """Generate doc1_prescription.pdf."""
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("helvetica", "B", 16)
    pdf.cell(0, 10, "Apex Healthcare Clinic", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("helvetica", "", 10)
    pdf.cell(0, 6, "12 Connaught Place, New Delhi, India | Ph: +91 11 2345 6789", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, "Dr. Ramesh Gupta, MD (General Medicine)", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.line(10, 32, 200, 32)
    pdf.ln(8)

    pdf.set_font("helvetica", "", 11)
    pdf.cell(100, 7, "Patient Name: Rajesh Sharma", new_x="RIGHT")
    pdf.cell(0, 7, "Date: 15/01/2023", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(100, 7, "Age / Sex: 45 yrs / Male", new_x="RIGHT")
    pdf.cell(0, 7, "MRN: RS-10023", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    pdf.set_font("helvetica", "B", 11)
    pdf.cell(0, 7, "Diagnosis: Type 2 Diabetes Mellitus, Essential Hypertension", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    pdf.set_font("helvetica", "B", 13)
    pdf.cell(0, 8, "Rx (Prescription):", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("helvetica", "", 11)
    pdf.cell(0, 7, "1. T. Metformin 500 mg BD x 30 days (after meals)", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 7, "2. Tab Telmisartan 40 mg OD x 30 days (morning)", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 7, "3. Tab Atorvastatin 10 mg HS x 30 days (at bedtime)", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)

    pdf.set_font("helvetica", "I", 10)
    pdf.cell(0, 6, "Review with blood glucose reports after 30 days.", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 10, "Dr. Ramesh Gupta (Signature)", align="R", new_x="LMARGIN", new_y="NEXT")

    pdf.output(str(filepath))


def create_lab_image(filepath: Path):
    """Generate doc2_lab_image.png with Pillow."""
    width, height = 800, 600
    img = Image.new("RGB", (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    lines = [
        "METRO DIAGNOSTICS LABORATORY",
        "Ring Road, South Extension, New Delhi, India",
        "----------------------------------------------------------------------",
        "Patient Name: Rajesh Sharma             Age/Sex: 45 / Male",
        "Referred By: Dr. Ramesh Gupta           Date: 20/01/2023",
        "Lab ID: MDL-98431                       Specimen: Blood (Fluoride/EDTA)",
        "----------------------------------------------------------------------",
        "TEST NAME                  RESULT      UNIT       REFERENCE RANGE   FLAG",
        "----------------------------------------------------------------------",
        "Fasting Blood Sugar: 142 mg/dL (70-99 mg/dL) [High]",
        "HbA1c: 7.2 % (< 5.7 %) [High]",
        "----------------------------------------------------------------------",
        "Comments: Elevated fasting blood sugar and HbA1c indicative of poor glycemic control.",
        "Verified by: Dr. S. K. Sen, MD (Pathologist)",
    ]

    y = 30
    for line in lines:
        draw.text((40, y), line, fill=(20, 20, 20))
        y += 26

    # Border
    draw.rectangle([(20, 20), (width - 20, height - 20)], outline=(120, 120, 120), width=2)

    # Embed raw text in standard PNG tEXt metadata for deterministic offline parsing
    raw_text_content = "\n".join(lines)
    pnginfo = PngImagePlugin.PngInfo()
    pnginfo.add_text("RawText", raw_text_content)

    img.save(str(filepath), pnginfo=pnginfo)


def create_pdf_specialist_lab(filepath: Path):
    """Generate doc3_lab_specialist.pdf with mmol/L units."""
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("helvetica", "B", 15)
    pdf.cell(0, 10, "International Diabetes Center & Laboratories", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("helvetica", "", 10)
    pdf.cell(0, 6, "Bengaluru, India | NABL Accredited Laboratory", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.line(10, 28, 200, 28)
    pdf.ln(8)

    pdf.set_font("helvetica", "", 11)
    pdf.cell(100, 7, "Patient Name: Rajesh Sharma", new_x="RIGHT")
    pdf.cell(0, 7, "Date: 10/05/2023", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(100, 7, "MRN: RS-10023", new_x="RIGHT")
    pdf.cell(0, 7, "Age/Sex: 45 / Male", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    pdf.set_font("helvetica", "B", 12)
    pdf.cell(0, 8, "BIOCHEMISTRY REPORT (Standard SI Units)", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("helvetica", "", 11)
    pdf.cell(0, 7, "Fasting Blood Glucose | 7.8 | mmol/L | 3.9-5.6 | High", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    pdf.set_font("helvetica", "I", 10)
    pdf.cell(0, 6, "Note: Values expressed in International SI units (mmol/L). Do not convert.", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, "Authorized Signatory: Dr. Meenakshi Sundaram, MD", new_x="LMARGIN", new_y="NEXT")

    pdf.output(str(filepath))


def create_docx_discharge_summary(filepath: Path):
    """Generate doc4_discharge_summary.docx with tables, stopped metformin, and changed amlodipine."""
    doc = docx.Document()
    title = doc.add_paragraph()
    run = title.add_run("CITY MULTISPECIALITY HOSPITAL")
    run.bold = True
    run.font.size = docx.shared.Pt(16)
    title.alignment = docx.enum.text.WD_ALIGN_PARAGRAPH.CENTER

    sub = doc.add_paragraph("Dr. E. Moses Road, Mumbai, India | Department of Internal Medicine")
    sub.alignment = docx.enum.text.WD_ALIGN_PARAGRAPH.CENTER

    h = doc.add_paragraph()
    h.add_run("DISCHARGE SUMMARY").bold = True
    h.alignment = docx.enum.text.WD_ALIGN_PARAGRAPH.CENTER

    # Patient Details Table
    table = doc.add_table(rows=3, cols=2)
    table.rows[0].cells[0].text = "Patient Name: Sunita Patel"
    table.rows[0].cells[1].text = "IP No: SP-88421"
    table.rows[1].cells[0].text = "Age / Sex: 58 yrs / Female"
    table.rows[1].cells[1].text = "Date of Admission: 10/08/2023"
    table.rows[2].cells[0].text = "Consultant: Dr. Arvind Joshi, MD"
    table.rows[2].cells[1].text = "Date of Discharge: 14/08/2023"

    doc.add_paragraph()
    d_heading = doc.add_paragraph()
    d_heading.add_run("FINAL DIAGNOSES:").bold = True
    doc.add_paragraph("1. Essential Hypertension")
    doc.add_paragraph("2. Suspected unstable angina")
    doc.add_paragraph("3. Acute gastroenteritis - resolved")

    doc.add_paragraph()
    a_heading = doc.add_paragraph()
    a_heading.add_run("ALLERGIES:").bold = True
    doc.add_paragraph("Patient denies any drug allergies. NKDA.")

    doc.add_paragraph()
    m_heading = doc.add_paragraph()
    m_heading.add_run("DISCHARGE MEDICATIONS & CHANGES:").bold = True
    doc.add_paragraph("1. Amlodipine increased from 5 mg to 10 mg OD")
    doc.add_paragraph("2. T. Metformin 500 mg BD - stopped")
    doc.add_paragraph("3. Tab Pantoprazole 40 mg OD x 5 days")

    doc.add_paragraph()
    f_heading = doc.add_paragraph()
    f_heading.add_run("HOSPITAL COURSE & PLAN:").bold = True
    doc.add_paragraph("Patient admitted with acute vomiting and chest discomfort. Evaluated by cardiology. Discharged in stable condition. Follow up in cardiology OPD after 1 week.")

    doc.save(str(filepath))


def create_txt_consultation_note(filepath: Path):
    """Generate doc5_consultation_note.txt with ambiguous date and NKDA."""
    text = """--- Page 1 ---
Family Health Clinic, Civil Lines, Jaipur
Consultation Note
Date: 03/04/2022
Doctor: Dr. Anita Rao, MBBS
Patient: Amit Kumar (35M)
MRN: AK-67120

c/o fever with chills x 3 days. k/c/o HTN on Tab Telmisartan 40 mg OD.
Allergies: NKDA.

O/E:
BP 130/80 mmHg, Pulse 88 /min, Temp 101 F.
Systemic exam: Chest clear, abdomen soft.

Impression: Probable viral fever.

Rx:
1. Tab Paracetamol 650 mg TDS x 5 days
2. Continue Tab Telmisartan 40 mg OD

Advised: Plenty of oral fluids. Review if fever persists beyond 3 days.
"""
    filepath.write_text(text, encoding="utf-8")


def create_txt_allergy_record_a(filepath: Path):
    """Generate doc6_allergy_record_a.txt: Penicillin rash present."""
    text = """--- Page 1 ---
St. John Health Centre, Kochi, India
Consultation Note
Date: 12/02/2023
Doctor: Dr. Mathew Thomas, MD
Patient Name: Priya Nair (29F)
UHID: PN-44091

Chief Complaint: Sore throat and mild fever for 2 days.
Allergies: Penicillin (causes skin rash).

Diagnosis: Acute pharyngitis.

Rx:
1. Tab Azithromycin 500 mg OD x 3 days
2. Tab Paracetamol 650 mg SOS

Dr. Mathew Thomas
"""
    filepath.write_text(text, encoding="utf-8")


def create_txt_allergy_record_b(filepath: Path):
    """Generate doc7_allergy_record_b.txt: Same patient Priya Nair, but NKDA (allergy contradiction)."""
    text = """--- Page 1 ---
City Emergency Care Hospital, Kochi, India
Emergency Triage Note
Date: 25/06/2023
Patient: Priya Nair (29F)
UHID: PN-44091

c/o twisted right ankle after slip and fall on stairs.
Allergies: NKDA.

O/E:
Swelling and tenderness over right lateral malleolus. No neurovascular deficit.
Diagnosis: Ankle sprain.

Rx:
1. Tab Ibuprofen 400 mg BD x 5 days
2. Crepe bandage support and ice packs.

Dr. Joseph Kurian
Emergency Medical Officer
"""
    filepath.write_text(text, encoding="utf-8")


def create_pdf_scan_report(filepath: Path):
    """Generate doc8_scan_report.pdf with X-ray findings and unmentioned allergies."""
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("helvetica", "B", 15)
    pdf.cell(0, 10, "Star Imaging & Radiological Centre", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("helvetica", "", 10)
    pdf.cell(0, 6, "Andheri West, Mumbai, India", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.line(10, 28, 200, 28)
    pdf.ln(8)

    pdf.set_font("helvetica", "", 11)
    pdf.cell(100, 7, "Patient Name: Sunita Patel", new_x="RIGHT")
    pdf.cell(0, 7, "Date: 12/08/2023", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(100, 7, "Age/Sex: 58 yrs / Female", new_x="RIGHT")
    pdf.cell(0, 7, "Ref By: Dr. Arvind Joshi", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    pdf.set_font("helvetica", "B", 12)
    pdf.cell(0, 8, "DEPARTMENT OF RADIODIAGNOSIS - CHEST X-RAY (PA VIEW)", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    pdf.set_font("helvetica", "B", 11)
    pdf.cell(0, 7, "Findings:", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("helvetica", "", 11)
    pdf.cell(0, 7, "Lungs are clear with no focal consolidation or collapse. Heart size is normal. No pleural effusion.", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    pdf.set_font("helvetica", "B", 11)
    pdf.cell(0, 7, "Impression:", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("helvetica", "", 11)
    pdf.cell(0, 7, "Normal chest radiograph.", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)

    pdf.set_font("helvetica", "I", 10)
    pdf.cell(0, 6, "Reported by: Dr. Deepa Shah, MD (Radiology)", new_x="LMARGIN", new_y="NEXT")

    pdf.output(str(filepath))


def create_txt_multilingual_note(filepath: Path):
    """Generate doc9_multilingual_note.txt with Hindi line."""
    text = """--- Page 1 ---
Sanjeevani Clinic & Healthcare
Hazratganj, Lucknow, India
Consultation Note
Date: 18/09/2023
Doctor: Dr. Alok Tripathi, MBBS
Patient Name: Ramesh Verma (62M)

Diagnosis: Lumbar spondylosis.

Patient advice: आराम करें और भारी वजन न उठाएं (Rest and do not lift heavy weights).

Allergies: None.

Rx:
1. Tab Paracetamol 650 mg TDS x 5 days
2. Physiotherapy lumbar strengthening exercises.
"""
    filepath.write_text(text, encoding="utf-8")


def create_duplicate_file(src_path: Path, dest_path: Path):
    """Copy an existing file to test SHA-256 duplicate handling."""
    shutil.copyfile(src_path, dest_path)


def write_expected_ground_truth():
    """Write hand-checked ground-truth JSON files to demo_data/expected/."""

    expected_data = {
        "doc1_prescription": {
            "source_file": "doc1_prescription.pdf",
            "doc_type": "prescription",
            "document_date": {"value": "2023-01-15", "ambiguous": False},
            "allergies": {"status": "not_documented"},
            "medications": [
                {"name": "Metformin", "dose_value": "500", "dose_unit": "mg", "status": "prescribed"},
                {"name": "Telmisartan", "dose_value": "40", "dose_unit": "mg", "status": "prescribed"},
                {"name": "Atorvastatin", "dose_value": "10", "dose_unit": "mg", "status": "prescribed"},
            ],
            "conditions": [
                {"name": "Type 2 Diabetes Mellitus", "certainty": "confirmed"},
                {"name": "Essential Hypertension", "certainty": "confirmed"},
            ],
            "lab_results": [],
        },
        "doc2_lab_image": {
            "source_file": "doc2_lab_image.png",
            "doc_type": "lab_report",
            "document_date": {"value": "2023-01-20", "ambiguous": False},
            "allergies": {"status": "not_documented"},
            "medications": [],
            "conditions": [],
            "lab_results": [
                {"test_name": "Fasting Blood Sugar", "value": "142", "unit": "mg/dL", "flag": "high"},
                {"test_name": "HbA1c", "value": "7.2", "unit": "%", "flag": "high"},
            ],
        },
        "doc3_lab_specialist": {
            "source_file": "doc3_lab_specialist.pdf",
            "doc_type": "lab_report",
            "document_date": {"value": "2023-05-10", "ambiguous": True},
            "allergies": {"status": "not_documented"},
            "medications": [],
            "conditions": [],
            "lab_results": [
                {"test_name": "Fasting Blood Glucose", "value": "7.8", "unit": "mmol/L", "flag": "high"},
            ],
        },
        "doc4_discharge_summary": {
            "source_file": "doc4_discharge_summary.docx",
            "doc_type": "discharge_summary",
            "document_date": {"value": "2023-08-10", "ambiguous": True},
            "allergies": {"status": "explicit_negative"},
            "medications": [
                {"name": "Amlodipine", "dose_value": "10", "dose_unit": "mg", "status": "changed"},
                {"name": "Metformin", "dose_value": "500", "dose_unit": "mg", "status": "stopped"},
                {"name": "Pantoprazole", "dose_value": "40", "dose_unit": "mg", "status": "prescribed"},
            ],
            "conditions": [
                {"name": "Essential Hypertension", "certainty": "confirmed", "status": "active"},
                {"name": "unstable angina", "certainty": "suspected", "status": "suspected"},
                {"name": "Acute gastroenteritis", "certainty": "confirmed", "status": "resolved"},
            ],
            "lab_results": [],
        },
        "doc5_consultation_note": {
            "source_file": "doc5_consultation_note.txt",
            "doc_type": "consultation_note",
            "document_date": {"value": "2022-04-03", "ambiguous": True},
            "allergies": {"status": "explicit_negative"},
            "medications": [
                {"name": "Paracetamol", "dose_value": "650", "dose_unit": "mg", "status": "prescribed"},
                {"name": "Telmisartan", "dose_value": "40", "dose_unit": "mg", "status": "continued"},
            ],
            "conditions": [
                {"name": "HTN", "certainty": "confirmed"},
                {"name": "viral fever", "certainty": "suspected"},
            ],
            "lab_results": [],
        },
        "doc6_allergy_record_a": {
            "source_file": "doc6_allergy_record_a.txt",
            "doc_type": "consultation_note",
            "document_date": {"value": "2023-02-12", "ambiguous": True},
            "allergies": {
                "status": "present",
                "items": [{"substance": "Penicillin", "reaction": "skin rash"}],
            },
            "medications": [
                {"name": "Azithromycin", "dose_value": "500", "dose_unit": "mg", "status": "prescribed"},
                {"name": "Paracetamol", "dose_value": "650", "dose_unit": "mg", "status": "prescribed"},
            ],
            "conditions": [
                {"name": "Acute pharyngitis", "certainty": "confirmed"},
            ],
            "lab_results": [],
        },
        "doc7_allergy_record_b": {
            "source_file": "doc7_allergy_record_b.txt",
            "doc_type": "consultation_note",
            "document_date": {"value": "2023-06-25", "ambiguous": False},
            "allergies": {"status": "explicit_negative"},
            "medications": [
                {"name": "Ibuprofen", "dose_value": "400", "dose_unit": "mg", "status": "prescribed"},
            ],
            "conditions": [
                {"name": "Ankle sprain", "certainty": "confirmed"},
            ],
            "lab_results": [],
        },
        "doc8_scan_report": {
            "source_file": "doc8_scan_report.pdf",
            "doc_type": "scan_report",
            "document_date": {"value": "2023-08-12", "ambiguous": True},
            "allergies": {"status": "not_documented"},
            "medications": [],
            "conditions": [],
            "lab_results": [],
        },
        "doc9_multilingual_note": {
            "source_file": "doc9_multilingual_note.txt",
            "doc_type": "consultation_note",
            "document_date": {"value": "2023-09-18", "ambiguous": False},
            "allergies": {"status": "explicit_negative"},
            "medications": [
                {"name": "Paracetamol", "dose_value": "650", "dose_unit": "mg", "status": "prescribed"},
            ],
            "conditions": [
                {"name": "Lumbar spondylosis", "certainty": "confirmed"},
            ],
            "lab_results": [],
        },
        "doc10_duplicate_prescription": {
            "source_file": "doc10_duplicate_prescription.pdf",
            "doc_type": "prescription",
            "document_date": {"value": "2023-01-15", "ambiguous": False},
            "allergies": {"status": "not_documented"},
            "medications": [
                {"name": "Metformin", "dose_value": "500", "dose_unit": "mg", "status": "prescribed"},
                {"name": "Telmisartan", "dose_value": "40", "dose_unit": "mg", "status": "prescribed"},
                {"name": "Atorvastatin", "dose_value": "10", "dose_unit": "mg", "status": "prescribed"},
            ],
            "conditions": [
                {"name": "Type 2 Diabetes Mellitus", "certainty": "confirmed"},
                {"name": "Essential Hypertension", "certainty": "confirmed"},
            ],
            "lab_results": [],
        },
    }

    for name, data in expected_data.items():
        exp_path = EXPECTED_DIR / f"{name}.expected.json"
        with open(exp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)


def generate_all():
    """Generate all demo documents and expected ground truths."""
    print("Generating demo medical documents...")

    f1 = DOCS_DIR / "doc1_prescription.pdf"
    create_pdf_prescription(f1)
    print(f"Created: {f1.name}")

    f2 = DOCS_DIR / "doc2_lab_image.png"
    create_lab_image(f2)
    print(f"Created: {f2.name}")

    f3 = DOCS_DIR / "doc3_lab_specialist.pdf"
    create_pdf_specialist_lab(f3)
    print(f"Created: {f3.name}")

    f4 = DOCS_DIR / "doc4_discharge_summary.docx"
    create_docx_discharge_summary(f4)
    print(f"Created: {f4.name}")

    f5 = DOCS_DIR / "doc5_consultation_note.txt"
    create_txt_consultation_note(f5)
    print(f"Created: {f5.name}")

    f6 = DOCS_DIR / "doc6_allergy_record_a.txt"
    create_txt_allergy_record_a(f6)
    print(f"Created: {f6.name}")

    f7 = DOCS_DIR / "doc7_allergy_record_b.txt"
    create_txt_allergy_record_b(f7)
    print(f"Created: {f7.name}")

    f8 = DOCS_DIR / "doc8_scan_report.pdf"
    create_pdf_scan_report(f8)
    print(f"Created: {f8.name}")

    f9 = DOCS_DIR / "doc9_multilingual_note.txt"
    create_txt_multilingual_note(f9)
    print(f"Created: {f9.name}")

    f10 = DOCS_DIR / "doc10_duplicate_prescription.pdf"
    create_duplicate_file(f1, f10)
    print(f"Created duplicate: {f10.name} (identical SHA-256 to {f1.name})")

    print("\nWriting expected ground-truth files...")
    write_expected_ground_truth()
    print(f"Ground-truth expected files written to: {EXPECTED_DIR}")


if __name__ == "__main__":
    generate_all()
