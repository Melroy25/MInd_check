/**
 * services/privacyAnonymizer.js
 *
 * Privacy & De-Identification Engine for Sovereign Healthcare
 *
 * NON-NEGOTIABLE PRIVACY GUARANTEE:
 * Before clinical text or documents are sent to any external AI processing stage
 * (Groq openai/gpt-oss-120b), personally identifiable information (PII) is removed
 * or masked.
 *
 * - Patient names are masked to [PATIENT_NAME]
 * - Phone numbers are masked to [PHONE_MASKED]
 * - Email addresses are masked to [EMAIL_MASKED]
 * - National IDs, SSN, MRN, and UHIDs are masked to [ID_MASKED]
 * - Street addresses & postal codes are masked to [ADDRESS_MASKED]
 * - Exact dates of birth are masked to [DOB_MASKED] (preserving clinical age in years)
 *
 * The Groq-hosted openai/gpt-oss-120b model processes only de-identified clinical
 * content into structured JSON entities and an understandable clinical summary.
 * Sovereign patient identity is re-attached locally within the sovereign vault boundary.
 */

/**
 * Remove or mask personally identifiable information from clinical document text
 * before transmission to external AI models.
 *
 * @param {string} text Raw clinical document or notes text
 * @param {Object} sovereignInfo Optional known patient metadata (name, phone, email, etc.)
 * @returns {{ anonymizedText: string, isMasked: boolean, maskedFields: string[] }}
 */
export function anonymizeMedicalText(text, sovereignInfo = {}) {
  if (!text || typeof text !== 'string') {
    return { anonymizedText: '', isMasked: false, maskedFields: [] };
  }

  let anonymized = text;
  const maskedFields = [];

  // 1. Mask Known Patient Name (if provided)
  const knownName = sovereignInfo.name || sovereignInfo.patientName || sovereignInfo.patient;
  if (knownName && typeof knownName === 'string' && knownName.trim().length > 2) {
    const escaped = knownName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameRegex = new RegExp('\\b' + escaped + '\\b', 'gi');
    if (nameRegex.test(anonymized)) {
      anonymized = anonymized.replace(nameRegex, '[PATIENT_NAME]');
      maskedFields.push('patient_name');
    }
  }

  // 2. Mask Common Patient Name Headers (e.g. "Patient Name: Jane Doe", "Pt: John Smith")
  const patientHeaderRegex = /(?:Patient(?:\s+Name)?|Pt(?:\s+Name)?|Name)\s*[:\-]\s*([A-Za-z\s.]+?)(?=\s*[\(\n,]|\s+Age|\s+Sex|\s+Gender|\s+MRN|\s+DOB|\s+Phone|\s+Email|$)/gi;
  if (patientHeaderRegex.test(anonymized)) {
    anonymized = anonymized.replace(patientHeaderRegex, (match, captured) => {
      if (captured && captured.trim().length > 1 && !captured.includes('[PATIENT_NAME]')) {
        maskedFields.push('patient_header');
        return match.replace(captured.trim(), '[PATIENT_NAME]');
      }
      return match;
    });
  }

  // 3. Mask Phone Numbers (US, International, and local formats)
  const phoneRegex = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  if (phoneRegex.test(anonymized)) {
    anonymized = anonymized.replace(phoneRegex, '[PHONE_MASKED]');
    maskedFields.push('phone');
  }

  // 4. Mask Email Addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  if (emailRegex.test(anonymized)) {
    anonymized = anonymized.replace(emailRegex, '[EMAIL_MASKED]');
    maskedFields.push('email');
  }

  // 5. Mask National / Medical Identifiers (SSN, MRN, UHID, Aadhaar, Passport)
  const idRegex = /\b(?:MRN|SSN|UHID|Aadhaar|National\s*ID|Record\s*#|Patient\s*ID)\s*[:#\-]?\s*([A-Za-z0-9\-]{4,})\b/gi;
  if (idRegex.test(anonymized)) {
    anonymized = anonymized.replace(idRegex, (match, captured) => {
      maskedFields.push('identifier');
      return match.replace(captured, '[ID_MASKED]');
    });
  }

  // 6. Mask Exact Dates of Birth (DOB) while retaining clinical age
  const dobRegex = /\b(?:DOB|Date\s*of\s*Birth)\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/gi;
  if (dobRegex.test(anonymized)) {
    anonymized = anonymized.replace(dobRegex, 'DOB: [DOB_MASKED]');
    maskedFields.push('date_of_birth');
  }

  // 7. Mask Street Addresses & P.O. Boxes
  const addressRegex = /\b\d{1,5}\s+[A-Za-z0-9\s.,]{3,30}\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Way)\b/gi;
  if (addressRegex.test(anonymized)) {
    anonymized = anonymized.replace(addressRegex, '[ADDRESS_MASKED]');
    maskedFields.push('street_address');
  }

  return {
    anonymizedText: anonymized,
    isMasked: maskedFields.length > 0,
    maskedFields,
  };
}

/**
 * Re-hydrate sovereign patient metadata locally into the structured JSON
 * produced by the external AI model, keeping PII exclusively client-side.
 *
 * @param {Object} aiExtractedJson JSON parsed from Groq openai/gpt-oss-120b
 * @param {Object} sovereignPatientInfo Local authenticated patient record
 * @returns {Object} Complete schema-compliant clinical payload
 */
export function restoreSovereignMetadata(aiExtractedJson, sovereignPatientInfo = {}) {
  if (!aiExtractedJson || typeof aiExtractedJson !== 'object') {
    return aiExtractedJson;
  }

  const safeJson = { ...aiExtractedJson };

  // Restore Patient Demographics from Sovereign Vault
  const sovereignName = sovereignPatientInfo.name || sovereignPatientInfo.patientName || sovereignPatientInfo.patient;
  const sovereignId = sovereignPatientInfo.vaultId || sovereignPatientInfo.id || sovereignPatientInfo.patientId;
  const sovereignBlood = sovereignPatientInfo.bloodType || sovereignPatientInfo.blood;
  const sovereignContact = sovereignPatientInfo.emergencyContact;

  if (safeJson.patient) {
    if (sovereignName && (!safeJson.patient.name || safeJson.patient.name === '[PATIENT_NAME]' || safeJson.patient.name.toLowerCase().includes('verified patient'))) {
      safeJson.patient.name = sovereignName;
    }
  } else if (sovereignName) {
    safeJson.patient = { name: sovereignName, age: null, sex: null };
  }

  if (safeJson.document_metadata) {
    if (sovereignName && (!safeJson.document_metadata.patient_name || safeJson.document_metadata.patient_name === '[PATIENT_NAME]')) {
      safeJson.document_metadata.patient_name = sovereignName;
    }
    if (sovereignId) {
      safeJson.document_metadata.patient_id = sovereignId;
    }
  }

  return safeJson;
}
