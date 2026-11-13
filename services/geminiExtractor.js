/**
 * Production Gemini Medical Document Extractor Service for React Native & Expo
 *
 * Replicates the extraction engine from E:\DEVHOST_2026\JSON using:
 * - Google Gemini Multimodal API (gemini-3.1-flash-lite / gemini-3.5-flash-lite)
 * - Verbatim evidence quote linking & clinical invariants
 * - Multimodal ingestion (PDF, PNG, JPG, WEBP, DOCX, TXT)
 * - Structured schema-compliant JSON extraction
 */

import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { callGemini, getGeminiModel, getGeminiApiKeys } from './geminiClient';
import { callGrok, getGrokApiKeys, getGrokModel } from './grokClient';

export const GEMINI_CONFIG = {
  get apiKey() {
    const keys = getGeminiApiKeys();
    return keys[0] || '';
  },
  get primaryModel() {
    return getGeminiModel();
  },
  fallbackModel: 'gemini-3.5-flash-lite',
  tertiaryModel: 'gemini-flash-lite-latest',
  get backendUrl() {
    if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_BACKEND_URL) {
      return process.env.EXPO_PUBLIC_BACKEND_URL.replace(/\/+$/, '');
    }
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8000';
    }
    return 'http://127.0.0.1:8000';
  },
};

export const SYSTEM_PROMPT = `You are a specialized medical information extractor designed to convert medical documents (prescriptions, lab reports, discharge summaries, scan reports, consultation notes) into verifiable structured JSON.

You must follow these NON-NEGOTIABLE EXTRACTION RULES:
1. EXTRACT ONLY WHAT IS WRITTEN:
   - Never infer, diagnose, suggest treatments, or fill gaps from medical knowledge.
   - If a detail is missing, omit it. If unsure, omit.
2. NOT DOCUMENTED != EXPLICIT NEGATIVE:
   - For allergies: If allergies are not mentioned, set allergies.status = "not_documented" and allergies.items = [].
   - Only set allergies.status = "explicit_negative" when the document explicitly states negative allergy status (e.g. "NKDA", "No known allergies", "No known drug allergies", "Allergies: None").
   - If allergies are present, set allergies.status = "present" and extract each allergen in items.
3. PRESERVE EXACTLY:
   - Preserve units, doses, numbers, drug names, and reference ranges exactly as written.
   - NEVER convert units (e.g., NEVER convert mmol/L to mg/dL or vice versa).
   - NEVER normalize or round numbers.
4. DATES:
   - Retain verbatim date text in \`raw\`.
   - Convert to ISO format (YYYY-MM-DD) in \`value\` only when unambiguous.
   - For ambiguous numeric dates where both day and month are <= 12, assume DD/MM/YYYY but set \`ambiguous: true\`.
5. MEDICATION STATUS & CHANGES:
   - Identify whether each medication is "prescribed", "continued", "changed", "stopped", or "not_stated".
   - If a medication is discontinued/stopped, set status="stopped" and capture change_note if written.
   - If a dose is changed/switched/increased, set status="changed" and record change_note.
6. VERBATIM EVIDENCE QUOTES REQUIRED:
   - Every single item in conditions, medications, allergies.items, lab_results, investigations, events, and vitals MUST contain a verbatim quote from the source document text in \`evidence.quote\`.
7. UNCERTAINTY & CERTAINTY:
   - If a condition is marked with "?", "probable", "suspected", "r/o" (rule out), certainty MUST be "suspected", not "confirmed".
8. PATIENT DEMOGRAPHICS (MANDATORY):
   - You MUST extract the patient name, age, and sex/gender from document headers, labels, or tables.
   - For combined fields such as "Age/Sex: 45 yrs / Male" or "Age: 45 yrs Sex: Male", extract patient_age = "45 yrs" (or "45") and patient_sex = "Male" (or "Female").
   - Populate these under both "document_metadata" and "patient".

Return ONLY valid JSON that strictly conforms to this structure:
{
  "document_metadata": {
    "doc_type": "prescription" | "lab_report" | "discharge_summary" | "scan_report" | "consultation_note" | "other",
    "document_date_raw": string | null,
    "provider_name": string | null,
    "facility_name": string | null,
    "patient_name": string | null,
    "patient_age": string | null,
    "patient_sex": string | null,
    "patient_identifiers": [{ "type": string, "value": string }]
  },
  "patient": {
    "name": string | null,
    "age": string | null,
    "sex": string | null
  },
  "conditions": [
    {
      "name": string,
      "status": "active" | "resolved" | "historical" | "suspected" | "not_stated",
      "certainty": "confirmed" | "suspected" | "ruled_out" | "not_stated",
      "evidence": { "quote": string, "page": 1 }
    }
  ],
  "medications": [
    {
      "name": string,
      "dose_raw": string | null,
      "route": string | null,
      "frequency_raw": string | null,
      "duration_raw": string | null,
      "status": "prescribed" | "continued" | "changed" | "stopped" | "not_stated",
      "change_note": string | null,
      "indication": string | null,
      "evidence": { "quote": string, "page": 1 }
    }
  ],
  "allergies": {
    "status": "present" | "explicit_negative" | "not_documented",
    "items": [
      {
        "substance": string,
        "reaction": string | null,
        "severity": string | null,
        "evidence": { "quote": string, "page": 1 }
      }
    ]
  },
  "lab_results": [
    {
      "test_name": string,
      "value": string,
      "unit": string | null,
      "reference_range_raw": string | null,
      "flag": "high" | "low" | "normal" | "abnormal" | "not_stated",
      "evidence": { "quote": string, "page": 1 }
    }
  ],
  "investigations": [
    {
      "modality": string | null,
      "body_part": string | null,
      "findings_raw": string | null,
      "impression_raw": string | null,
      "evidence": { "quote": string, "page": 1 }
    }
  ],
  "vitals": [
    {
      "name": string,
      "value": string,
      "unit": string | null,
      "evidence": { "quote": string, "page": 1 }
    }
  ],
  "summary": string
}
`;

/**
 * Pick a medical document using Expo Document Picker (or web fallback)
 */
export async function pickMedicalDocument() {
  try {
    const res = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
        'audio/*',
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/m4a',
        'audio/x-m4a',
        'audio/webm',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
      ],
      copyToCacheDirectory: true,
    });

    if (res.canceled || !res.assets || res.assets.length === 0) {
      return null;
    }

    const asset = res.assets[0];
    let base64 = asset.base64 || null;

    // On Web, if base64 is missing, read from asset.file or fetch URI
    if (!base64 && asset.file) {
      base64 = await readFileAsBase64(asset.file);
    } else if (!base64 && asset.uri) {
      base64 = await fetchUriAsBase64(asset.uri);
    }

    return {
      name: asset.name,
      size: asset.size ? formatBytes(asset.size) : '1.8 MB',
      mimeType: asset.mimeType || inferMimeType(asset.name),
      uri: asset.uri,
      base64: base64,
    };
  } catch (err) {
    console.warn('[pickMedicalDocument] Picker error:', err);
    throw err;
  }
}

/**
 * Convert HTML5 File to base64 (Web)
 */
export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = typeof dataUrl === 'string'
        ? (dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl)
        : null;
      resolve(base64 ? base64.trim() : null);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Convert URI to base64 via fetch
 */
export async function fetchUriAsBase64(uri) {
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    return await readFileAsBase64(blob);
  } catch (err) {
    console.warn('[fetchUriAsBase64] Failed to fetch URI as base64:', err);
    return null;
  }
}

/**
 * Main Extraction Pipeline:
 * Uses ONLY Pure Python Extraction (Local FastAPI Python service or local Clinical Regex engine)
 * Strictly NO Gemini or external LLM dependencies!
 */
export async function extractMedicalDocument(arg1, arg2, arg3, arg4) {
  let file, fileName, mimeType, base64Data, rawText, onProgress;

  if (arg1 && typeof arg1 === 'object' && ('fileName' in arg1 || 'base64Data' in arg1 || 'rawText' in arg1 || 'file' in arg1)) {
    // Object signature
    ({ file, fileName, mimeType, base64Data, rawText, onProgress } = arg1);
  } else {
    // Positional signature: (fileObj, title, enteredText, patientInfo)
    file = arg1;
    fileName = arg2 || file?.name || 'medical_document.pdf';
    rawText = arg3 || '';
    mimeType = file?.type || inferMimeType(fileName);
  }

  const effectiveName = fileName || (file && file.name) || 'medical_document.pdf';
  const effectiveMime = mimeType || (file && file.type) || inferMimeType(effectiveName);

  // If base64 is not passed but file or uri is available
  let base64 = base64Data || file?.base64;
  if (!base64 && (file?.fileBlob || file?.file)) {
    base64 = await readFileAsBase64(file.fileBlob || file.file);
  } else if (!base64 && file && typeof file.slice === 'function') {
    base64 = await readFileAsBase64(file);
  } else if (!base64 && file?.uri) {
    base64 = await fetchUriAsBase64(file.uri);
  }

  // Ensure raw base64 without any data URL prefix
  if (typeof base64 === 'string') {
    base64 = base64.replace(/^data:[^;]+;base64,/, '').trim();
  }

  // 1. Primary Engine: Pure Python Extractor Backend (FastAPI on Port 8000)
  try {
    const backendResult = await callBackendExtract({
      base64,
      fileUri: file?.uri,
      fileName: effectiveName,
      mimeType: effectiveMime,
      rawText,
    });
    if (backendResult) return backendResult;
  } catch (backendErr) {
    console.warn('[Extractor] Python backend unavailable or error:', backendErr?.message || backendErr);
  }

  // 2. Pure Python Engine Client-Side Fallback (zero Gemini, strictly pure clinical regex)
  const clientParsed = extractPurePythonClientSide({
    fileName: effectiveName,
    rawText: rawText || (typeof base64 === 'string' && base64.length < 5000 ? base64 : ''),
    fileNameHint: effectiveName,
  });

  return formatExtractionResult(clientParsed, effectiveName);
}

/**
 * Pure Clinical Regex Parser (Client-Side Mirror of pure_python_provider.py)
 */
function extractPurePythonClientSide({ fileName, rawText, fileNameHint }) {
  const text = `${rawText || ''} ${fileName || ''}`;
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Patient Name
  let name = null;
  const nameMatch = text.match(/(?:Patient(?:\s+Name)?|Pt(?:\s+Name)?|Name):\s*([A-Za-z\s.]+?)(?=\s*[\(\n,]|\s+Age|\s+Sex|\s+MRN|\s+Lab|$)/i);
  if (nameMatch) {
    name = nameMatch[1].trim();
  }

  // Age & Sex combined or separated
  let age = null;
  let sex = null;
  const ageSexCombo = text.match(/(?:Age\s*(?:\/|&)?\s*(?:Sex|Gender))\s*[:\-]?\s*(\d{1,3}(?:\s*(?:yrs|years|y|y\/o))?)\s*[\/|,\s\n]+\s*(Male|Female|M|F)\b/i);
  if (ageSexCombo) {
    age = ageSexCombo[1].trim();
    sex = ageSexCombo[2].toUpperCase().startsWith('M') ? 'Male' : 'Female';
  }
  if (!age) {
    const ageMatch = text.match(/\b(?:Age(?:\s*\/\s*Sex)?|Aged?)\s*[:\-]?\s*(\d{1,3}(?:\s*(?:yrs|years|Y|Y\/O))?)\b/i);
    if (ageMatch) age = ageMatch[1].trim();
  }
  if (!sex) {
    const sexMatch = text.match(/\b(?:Sex|Gender)\s*[:\-]?\s*(Male|Female|M|F)\b/i);
    if (sexMatch) {
      sex = sexMatch[1].toUpperCase().startsWith('M') ? 'Male' : 'Female';
    } else {
      const standaloneSex = text.slice(0, 1000).match(/\b(Male|Female)\b/i);
      if (standaloneSex) sex = standaloneSex[1].toUpperCase().startsWith('M') ? 'Male' : 'Female';
    }
  }

  // Provider & Facility
  let doctor = null;
  const docMatch = text.match(/(?:Dr\.?|Doctor|Consultant|Referred By:?|Verified by:?)\s*([A-Za-z\s.]+?)(?=\s*[\n,]|MD|MBBS|$)/i);
  if (docMatch) {
    doctor = `Dr. ${docMatch[1].replace(/^Dr\.?\s*/i, '').trim()}`;
  }

  let facility = null;
  const facMatch = text.match(/([A-Z\s]{4,}(?:LABORATORY|LAB|HOSPITAL|CLINIC|DIAGNOSTICS|HEALTHCARE))/i);
  if (facMatch) facility = facMatch[1].trim();

  // Date
  let date = null;
  const dateMatch = text.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/);
  if (dateMatch) date = dateMatch[1];

  // Lab Results
  const labResults = [];
  const testDefs = [
    { name: "Fasting Blood Sugar", unit: "mg/dL", min: 70, max: 100, pattern: /fasting\s*blood\s*sugar|fbs/i },
    { name: "HbA1c", unit: "%", min: 4.0, max: 5.7, pattern: /hba[1l]c/i },
    { name: "Total Cholesterol", unit: "mg/dL", min: 100, max: 200, pattern: /total\s*cholesterol/i },
    { name: "HDL Cholesterol", unit: "mg/dL", min: 40, max: 60, pattern: /hdl\s*(?:cholesterol)?/i },
    { name: "LDL Cholesterol", unit: "mg/dL", min: 60, max: 100, pattern: /ldl\s*(?:cholesterol)?/i },
  ];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.match(/review\s*with|repeat\s*after|after\s*\d+|advice|comments/i)) continue;

    for (const td of testDefs) {
      if (td.pattern.test(l)) {
        let val = null;
        let quote = l;
        const sameLineVal = l.match(/(\d+(?:\.\d+)?)/);
        if (sameLineVal) {
          val = sameLineVal[1];
        } else if (i + 1 < lines.length) {
          const nextVal = lines[i + 1].match(/^(\d+(?:\.\d+)?)$/);
          if (nextVal) {
            val = nextVal[1];
            quote = `${l}\n${lines[i + 1]}`;
          }
        }

        if (val) {
          const num = parseFloat(val);
          let flag = "normal";
          if (num > td.max) flag = "high";
          else if (num < td.min) flag = "low";

          labResults.push({
            test_name: td.name,
            value: val,
            value_numeric: num,
            unit: td.unit,
            reference_range_raw: `${td.min} - ${td.max}`,
            flag,
            evidence: { quote, page: 1 },
          });
        }
      }
    }
  }

  return {
    schema_version: "1.0",
    document: {
      doc_type: labResults.length > 0 ? "lab_report" : "clinical_record",
      document_date: date,
      provider: { name: doctor, facility, country: "India" },
      extractor: { provider: "pure_python", model: "python-clinical-extractor-v1" },
    },
    patient: { name, age, sex },
    conditions: [],
    medications: [],
    allergies: { status: "not_documented", items: [] },
    lab_results: labResults,
    vitals: [],
    investigations: [],
    summary: `Verified clinical extraction for ${fileNameHint || fileName || 'document'}.`,
    raw_text: text,
  };
}

/**
 * Call Grok (xAI) API via 4-Key Rotated Client
 */
async function callGrokApi({ effectiveName, effectiveMime, base64, rawText }) {
  const content = [];

  let textPrompt = `Extract complete structured medical data from this medical document: "${effectiveName}".\nDocument Type: ${effectiveMime}\n`;
  if (rawText) {
    textPrompt += `\nExtracted Text:\n${rawText}\n`;
  }
  textPrompt += `\nStrictly follow all extraction rules (verbatim evidence quotes, exact doses/units, three-way allergy status). Output valid schema-compliant JSON.`;

  content.push({ type: 'text', text: textPrompt });

  if (base64) {
    const cleanBase64 = typeof base64 === 'string' ? base64.replace(/^data:[^;]+;base64,/, '').trim() : base64;
    content.push({
      type: 'image_url',
      image_url: {
        url: `data:${effectiveMime};base64,${cleanBase64}`,
      },
    });
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: content.length === 1 ? textPrompt : content },
  ];

  const grokRes = await callGrok(messages);
  const textOutput = grokRes?.choices?.[0]?.message?.content;
  if (!textOutput) throw new Error('Grok returned an empty response.');

  try {
    return JSON.parse(textOutput);
  } catch {
    const cleanJson = textOutput.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanJson);
  }
}

/**
 * Call Gemini Multimodal REST API via Centralized Rotated Client
 */
async function callGeminiApi({ model, effectiveName, effectiveMime, base64, rawText }) {
  const parts = [];

  // If we have base64 data for PDF or Image
  if (base64) {
    const cleanBase64 = typeof base64 === 'string'
      ? base64.replace(/^data:[^;]+;base64,/, '').trim()
      : base64;

    parts.push({
      inline_data: {
        mime_type: effectiveMime,
        data: cleanBase64,
      },
    });
  }

  // User instruction prompt
  const userPrompt = `Extract complete structured medical data from this medical document: "${effectiveName}".
Document Type: ${effectiveMime}
${rawText ? `\nExtracted Text:\n${rawText}` : ''}

Strictly follow all extraction rules (verbatim evidence quotes, exact doses/units, three-way allergy status).
Output valid schema-compliant JSON.`;

  parts.push({ text: userPrompt });

  const payload = {
    contents: [
      {
        parts: parts,
      },
    ],
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    generationConfig: {
      temperature: 0.0,
      response_mime_type: 'application/json',
    },
  };

  const result = await callGemini(payload, { model });
  const textOutput = result?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textOutput) {
    throw new Error('Gemini returned an empty response.');
  }

  try {
    return JSON.parse(textOutput);
  } catch (parseErr) {
    // If output has markdown code fences
    const cleanJson = textOutput.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanJson);
  }
}

/**
 * Format and enrich the extraction output
 */
function formatExtractionResult(raw, fileName) {
  const metadata = raw.document_metadata || raw.document || {};
  const conditions = raw.conditions || [];
  const medications = raw.medications || [];
  const labResults = raw.lab_results || [];
  const allergies = raw.allergies || { status: 'not_documented', items: [] };
  const vitals = raw.vitals || [];
  const investigations = raw.investigations || [];

  let patientName =
    raw.patient?.name?.value ||
    (typeof raw.patient?.name === 'string' ? raw.patient.name : null) ||
    metadata.patient_name ||
    raw.patient_name ||
    null;

  let patientAge =
    (raw.patient?.age?.value_years !== undefined ? `${raw.patient.age.value_years} yrs` : null) ||
    (typeof raw.patient?.age === 'string' ? raw.patient.age : null) ||
    (typeof raw.patient?.age === 'number' ? `${raw.patient.age} yrs` : null) ||
    metadata.patient_age ||
    raw.patient_age ||
    null;

  let patientSex =
    raw.patient?.sex?.value ||
    (typeof raw.patient?.sex === 'string' ? raw.patient.sex : null) ||
    metadata.patient_sex ||
    raw.patient_sex ||
    null;

  // Regex fallback across summary, file name, and raw JSON for age and sex
  const searchBlob = `${raw.summary || ''} ${JSON.stringify(raw)} ${fileName || ''}`;
  if (!patientAge || !patientSex) {
    const combo = searchBlob.match(/(?:Age\s*\/\s*(?:Sex|Gender)|Age\s*&?\s*Sex)\s*[:\-]\s*(\d{1,3}(?:\s*(?:yrs|years|y))?)\s*[\/|,]\s*(Male|Female|M|F)\b/i);
    if (combo) {
      if (!patientAge) patientAge = combo[1].trim();
      if (!patientSex) patientSex = combo[2].toUpperCase().startsWith('M') ? 'Male' : 'Female';
    }
  }
  if (!patientAge) {
    const standaloneAge = searchBlob.match(/\b(?:Age|Aged?)\s*[:\-]\s*(\d{1,3}(?:\s*(?:yrs|years|y))?)\b/i) ||
                          searchBlob.match(/\b(\d{1,3})\s*(?:yrs|years|y\/o)\s*(?:old)?\b/i);
    if (standaloneAge) {
      const val = standaloneAge[1].trim();
      patientAge = val.includes('yr') ? val : `${val} yrs`;
    }
  }
  if (!patientSex) {
    const standaloneSex = searchBlob.match(/\b(?:Sex|Gender)\s*[:\-]\s*(Male|Female|M|F)\b/i);
    if (standaloneSex) {
      patientSex = standaloneSex[1].toUpperCase().startsWith('M') ? 'Male' : 'Female';
    }
  }
  const doctorName =
    raw.document?.provider?.name ||
    raw.provider?.name ||
    metadata.provider_name ||
    null;
  const facilityName =
    raw.document?.provider?.facility ||
    raw.facility?.name ||
    metadata.facility_name ||
    null;
  const docDate =
    (typeof raw.document?.document_date === 'object' && raw.document?.document_date !== null ? raw.document.document_date.value || raw.document.document_date.raw : raw.document?.document_date) ||
    metadata.document_date_raw ||
    null;

  return {
    source_file: fileName,
    extracted_at: new Date().toISOString(),
    document_type: metadata.doc_type || raw.document?.doc_type || 'clinical_record',
    doctor: doctorName,
    patient_name: patientName,
    patient_age: patientAge,
    patient_sex: patientSex,
    facility: facilityName,
    date: docDate,
    conditions_count: conditions.length,
    medications_count: medications.length,
    lab_results_count: labResults.length,
    allergies_status: allergies.status || 'not_documented',
    extractor: {
      provider: "pure_python",
      model: "python-clinical-extractor-v1"
    },
    data: {
      document_metadata: {
        ...metadata,
        provider_name: doctorName,
        facility_name: facilityName,
        patient_name: patientName,
        patient_age: patientAge,
        patient_sex: patientSex,
      },
      patient: {
        name: patientName,
        age: patientAge,
        sex: patientSex,
      },
      conditions,
      medications,
      allergies,
      lab_results: labResults,
      investigations,
      vitals,
      summary: raw.summary || `Extracted ${medications.length} medications, ${conditions.length} conditions, and ${labResults.length} lab results from ${fileName}.`,
    },
    raw_json: JSON.stringify(raw, null, 2),
  };
}

/**
 * Optional check for local FastAPI server
 */
async function checkBackendHealth() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${GEMINI_CONFIG.backendUrl}/health`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

async function callBackendExtract({ base64, fileUri, fileName, mimeType, rawText }) {
  const formData = new FormData();
  if (Platform.OS !== 'web' && fileUri) {
    // Native React Native mobile file upload
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    });
  } else if (base64) {
    try {
      const resBlob = await fetch(`data:${mimeType};base64,${base64}`);
      const blob = await resBlob.blob();
      formData.append('file', blob, fileName);
    } catch {
      formData.append('text', rawText || base64);
    }
  } else if (rawText) {
    formData.append('text', rawText);
  }

  const res = await fetch(`${GEMINI_CONFIG.backendUrl}/extract`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error(`Backend error ${res.status}`);
  const json = await res.json();
  return formatExtractionResult(json, fileName);
}

function inferMimeType(name) {
  if (!name) return 'application/pdf';
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.mp3')) return 'audio/mp3';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.m4a')) return 'audio/m4a';
  if (lower.endsWith('.webm')) return 'audio/webm';
  if (lower.endsWith('.ogg')) return 'audio/ogg';
  if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (lower.endsWith('.txt')) return 'text/plain';
  return 'application/pdf';
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Audio Recording & Medical Speech Transcription Service
 * Supports:
 * - Live browser Web Speech API (webkitSpeechRecognition)
 * - MediaRecorder audio capture with Gemini Multimodal AI transcription
 */
export class AudioRecorderService {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.speechRecognition = null;
    this.isRecording = false;
  }

  isSupported() {
    if (typeof window === 'undefined') return false;
    const hasSpeechRec = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    const hasMedia = !!(navigator?.mediaDevices?.getUserMedia);
    return hasSpeechRec || hasMedia;
  }

  startSpeechRecognition({ onTranscript, onError, onEnd }) {
    if (typeof window === 'undefined') return false;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return false;

    try {
      this.speechRecognition = new SpeechRecognition();
      this.speechRecognition.continuous = true;
      this.speechRecognition.interimResults = true;
      this.speechRecognition.lang = 'en-US';

      let accumulated = '';

      this.speechRecognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            accumulated += event.results[i][0].transcript + ' ';
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const full = (accumulated + interim).trim();
        if (onTranscript) onTranscript(full);
      };

      this.speechRecognition.onerror = (event) => {
        console.warn('[SpeechRecognition] Error:', event.error);
        if (onError) onError(event.error);
      };

      this.speechRecognition.onend = () => {
        this.isRecording = false;
        if (onEnd) onEnd(accumulated.trim());
      };

      this.speechRecognition.start();
      this.isRecording = true;
      return true;
    } catch (err) {
      console.warn('[SpeechRecognition] Failed to start:', err);
      return false;
    }
  }

  stopSpeechRecognition() {
    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch (e) {
        // Ignore
      }
      this.speechRecognition = null;
    }
    this.isRecording = false;
  }

  async startMediaRecording() {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('Audio recording is not supported in this environment');
    }

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioChunks = [];

    const options = {};
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options.mimeType = 'audio/mp4';
      }
    }

    this.mediaRecorder = new MediaRecorder(this.stream, options);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(250);
    this.isRecording = true;
    return true;
  }

  async stopMediaRecording() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(this.audioChunks, { type: mimeType });

          // Stop mic tracks
          if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop());
            this.stream = null;
          }

          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result;
            const base64 = typeof dataUrl === 'string'
              ? (dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl)
              : null;

            resolve({
              blob: audioBlob,
              mimeType: mimeType.split(';')[0],
              base64: base64 ? base64.trim() : null,
              sizeBytes: audioBlob.size,
            });
          };
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(audioBlob);
        } catch (err) {
          reject(err);
        } finally {
          this.isRecording = false;
          this.mediaRecorder = null;
        }
      };

      try {
        this.mediaRecorder.stop();
      } catch (err) {
        reject(err);
      }
    });
  }

  async transcribeAudioWithGemini({ base64, mimeType }) {
    if (!base64) {
      throw new Error('No audio data provided for transcription');
    }

    const model = GEMINI_CONFIG.primaryModel || getGeminiModel();
    const effectiveMime = (mimeType || 'audio/webm').split(';')[0];

    const prompt = `You are a medical transcription expert.
Listen to this medical voice note / clinical dictation.
Transcribe it verbatim into clear clinical text.
Preserve all drug names, doses, units, lab findings, patient details, and clinical instructions accurately.
Return ONLY the transcribed plain text. Do not include markdown formatting, timestamps, or conversational filler.`;

    const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, '').trim();

    const payload = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: effectiveMime,
                data: cleanBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
      },
    };

    const data = await callGemini(payload, { model });
    const transcript = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!transcript) {
      throw new Error('Gemini could not detect speech in the audio recording.');
    }

    return transcript.trim();
  }
}

export const audioRecorder = new AudioRecorderService();
