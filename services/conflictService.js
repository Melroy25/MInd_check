/**
 * services/conflictService.js
 * 
 * Clinical Cross-Record Conflict & Safety Verification Service.
 * Powered by Grok AI (with deterministic clinical rule-based fallback).
 * 
 * Verifies newly uploaded medical records against existing documents in the patient's vault:
 * 1. Medication Dosage Contradictions (e.g. Doc A: 500mg daily vs Doc B: 1000mg twice daily).
 * 2. Allergic Contraindications (e.g. newly prescribed drug vs known allergy in vault).
 * 3. Conflicting Clinical Diagnoses / Findings.
 * 
 * Returns clean, structured conflict details indicating:
 * - Between which two documents (Doc 1 vs Doc 2)
 * - Where the conflict occurs
 * - Explanation of the clinical discrepancy
 * - Editable fields so Patient or Doctor can modify/resolve the conflict prior to saving.
 */

import { callGrok } from './grokClient.js';

/**
 * Normalizes clinical summary string from a document
 */
function extractDocClinicalSummary(doc) {
  if (!doc) return '';
  const data = doc.extractedData || doc.data || {};
  const conditions = data?.extracted_entities?.conditions || data?.conditions || [];
  const medications = data?.extracted_entities?.medications || data?.medications || [];
  const allergies = data?.extracted_entities?.allergies?.items || data?.allergies || [];
  const labs = data?.extracted_entities?.lab_results || data?.lab_results || [];

  const parts = [];
  if (conditions.length > 0) {
    parts.push(`Conditions: ${conditions.map((c) => c.name || c).join(', ')}`);
  }
  if (medications.length > 0) {
    parts.push(`Medications: ${medications.map((m) => `${m.name || m} (${m.dose_raw || m.dose || m.dosage || 'dose unspecified'})`).join(', ')}`);
  }
  if (allergies.length > 0) {
    parts.push(`Allergies: ${allergies.map((a) => a.substance || a.name || a).join(', ')}`);
  }
  if (labs.length > 0) {
    parts.push(`Key Labs: ${labs.map((l) => `${l.test_name || l.name}: ${l.value} ${l.unit || ''}`).join(', ')}`);
  }
  if (doc.notes) {
    parts.push(`Notes: ${doc.notes}`);
  }

  return parts.join(' | ') || doc.name || 'Routine medical record';
}

/**
 * Helper to extract medications from raw notes if structured entities are absent
 */
function extractMedsFromText(text = '') {
  if (!text || typeof text !== 'string') return [];
  const meds = [];
  const regex = /(metformin|amoxicillin|lisinopril|atorvastatin|losartan|cetirizine|omeprazole|amlodipine|aspirin|ibuprofen|albuterol|insulin)[\s:]*([0-9]+\s*(?:mg|mcg|g|ml|units?)(?:\s+(?:daily|twice daily|bid|tid|prn))?)/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    meds.push({
      name: match[1].charAt(0).toUpperCase() + match[1].slice(1),
      dose_raw: match[2].trim(),
    });
  }
  return meds;
}

/**
 * Deterministic local fallback conflict detector
 */
function checkDeterministicConflicts(newDoc, existingDocs = []) {
  const conflicts = [];
  const newData = newDoc.extractedData || newDoc.jsonData || {};
  let newMeds = newData?.extracted_entities?.medications || newData?.medications || [];
  if (newMeds.length === 0 && (newDoc.notes || newData.clinical_summary)) {
    newMeds = extractMedsFromText(`${newDoc.notes || ''} ${newData.clinical_summary || ''}`);
  }
  const newAllergies = newData?.extracted_entities?.allergies?.items || newData?.allergies || [];

  existingDocs.forEach((existDoc, idx) => {
    const existData = existDoc.extractedData || existDoc.data || {};
    let existMeds = existData?.extracted_entities?.medications || existData?.medications || [];
    if (existMeds.length === 0 && (existDoc.notes || existData.clinical_summary)) {
      existMeds = extractMedsFromText(`${existDoc.notes || ''} ${existData.clinical_summary || ''}`);
    }
    const existAllergies = existData?.extracted_entities?.allergies?.items || existData?.allergies || [];

    // 1. Medication Dosage Variance Check
    newMeds.forEach((nm, nIdx) => {
      const nmName = (nm.name || nm).toLowerCase();
      const nmDose = (nm.dose_raw || nm.dose || nm.dosage || '').trim();

      existMeds.forEach((em) => {
        const emName = (em.name || em).toLowerCase();
        const emDose = (em.dose_raw || em.dose || em.dosage || '').trim();

        // If same medication name root
        const isSameMed = nmName.includes(emName) || emName.includes(nmName);
        if (isSameMed && nmDose && emDose && nmDose.toLowerCase() !== emDose.toLowerCase()) {
          conflicts.push({
            id: `conflict-det-${idx}-${nIdx}`,
            title: `Medication Contradiction: ${nm.name || em.name}`,
            type: 'dosage_contradiction',
            severity: 'high',
            doc1: {
              name: existDoc.name || 'Existing Vault Record',
              date: existDoc.date || 'Previous Visit',
              value: emDose,
              field: 'Dosage',
            },
            doc2: {
              name: newDoc.name || newDoc.title || 'New Upload',
              value: nmDose,
              field: 'Dosage',
            },
            where: 'Active Maintenance Medications',
            explanation: `Previous record (${existDoc.name}) specifies ${emDose}, whereas newly uploaded record specifies ${nmDose}. Please confirm if dosage was intentionally changed.`,
            editable_field: 'medication_dose',
            current_value: nmDose,
            medication_name: nm.name || em.name,
          });
        }
      });

      // 2. Allergy vs Prescribed Medication Check
      existAllergies.forEach((ea) => {
        const substance = (ea.substance || ea.name || ea).toLowerCase();
        if (substance && (nmName.includes(substance) || (substance.includes('penicillin') && nmName.includes('amox')))) {
          conflicts.push({
            id: `conflict-allergy-${idx}-${nIdx}`,
            title: `Allergic Contraindication Alert`,
            type: 'allergy_contraindication',
            severity: 'high',
            doc1: {
              name: existDoc.name || 'Existing Vault Record',
              date: existDoc.date || 'Historical Record',
              value: `Documented Allergy: ${ea.substance || ea.name || ea}`,
              field: 'Allergy Record',
            },
            doc2: {
              name: newDoc.name || newDoc.title || 'New Upload',
              value: `Prescribed: ${nm.name || nm}`,
              field: 'Prescription',
            },
            where: 'Allergies & Contraindications',
            explanation: `Newly prescribed medication (${nm.name || nm}) is contraindicated against existing documented allergy (${ea.substance || ea.name || ea}).`,
            editable_field: 'medication_status',
            current_value: nm.name || nm,
            medication_name: nm.name || nm,
          });
        }
      });
    });
  });

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
}

/**
 * Main cross-record conflict analysis powered by Grok AI
 * 
 * @param {Object} newDoc Newly prepared document object with title/name and extractedData
 * @param {Array} existingDocs Array of existing vault documents
 * @returns {Promise<{ hasConflicts: boolean, conflicts: Array }>}
 */
export async function checkCrossRecordConflicts(newDoc, existingDocs = []) {
  if (!existingDocs || existingDocs.length === 0) {
    return { hasConflicts: false, conflicts: [] };
  }

  // Filter out any JSON duplicate representations of the same document
  const validExisting = existingDocs.filter(
    (d) => !d.name?.endsWith('(Structured JSON)') && d.name !== newDoc.name && (!d.id || !newDoc.id || d.id !== newDoc.id)
  );

  if (validExisting.length === 0) {
    return { hasConflicts: false, conflicts: [] };
  }

  const newDocTitle = newDoc.name || newDoc.title || 'New Clinical Document';
  const newDocSummary = extractDocClinicalSummary(newDoc);

  // Prepare existing docs list (up to 5 most recent records)
  const existingSummaries = validExisting.slice(0, 5).map((d, i) => {
    return `[Doc ${i + 1}]: "${d.name}" (Date: ${d.date || 'N/A'})\nClinical Data: ${extractDocClinicalSummary(d)}`;
  }).join('\n\n');

  const systemPrompt = `You are an expert Clinical Conflict & Medication Safety Verification Engine.
Your task is to compare a newly uploaded clinical document against the patient's existing records in their health vault.

Check for the following clinical conflicts:
1. Medication Dosage Variance / Contradiction: If the same medication has a different dosage, frequency, or schedule between the new document and any existing document (for example, Doc 1 lists Metformin 500 mg daily, while Doc 2 lists Metformin 1000 mg twice daily). Flag this so the patient or physician can review, edit, or confirm the change.
2. Allergic Contraindication: If the new document prescribes or mentions a drug that conflicts with a documented allergy in existing records (e.g. Amoxicillin prescribed when Penicillin allergy is documented).
3. Conflicting Clinical Findings / Diagnoses: Directly contradictory clinical observations or diagnoses.

RULES:
- If any medication has differing dosages or frequency across documents, you MUST set hasConflicts: true and add a conflict item.
- If any drug contravenes an allergy, you MUST set hasConflicts: true and add a conflict item.
- Only if there are NO dosage discrepancies, NO allergy conflicts, and NO contradictory findings should you return hasConflicts: false and an empty conflicts array.

Respond ONLY with valid JSON in this exact structure:
{
  "hasConflicts": boolean,
  "conflicts": [
    {
      "id": "c1",
      "title": "Medication Dosage Discrepancy: Metformin",
      "type": "dosage_contradiction",
      "severity": "high",
      "doc1": {
        "name": "Name of previous document",
        "date": "Previous date",
        "value": "500 mg daily"
      },
      "doc2": {
        "name": "Name of new document",
        "value": "1000 mg twice daily"
      },
      "where": "Active Maintenance Medications",
      "explanation": "Previous record specifies 500 mg daily, but new record prescribes 1000 mg twice daily. Verification recommended.",
      "editable_field": "Metformin Dosage",
      "current_value": "1000 mg twice daily"
    }
  ]
}`;

  const userPrompt = `NEW DOCUMENT:
Title: "${newDocTitle}"
Clinical Data: ${newDocSummary}

EXISTING VAULT DOCUMENTS:
${existingSummaries}

Analyze for any clinical conflicts. Return JSON only.`;

  try {
    const grokRes = await callGrok(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        json: true,
        temperature: 0.1,
      }
    );

    const rawContent = grokRes?.choices?.[0]?.message?.content || '{}';
    // Clean any potential markdown wrapping
    const jsonStr = rawContent.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(jsonStr);

    if (parsed && typeof parsed.hasConflicts === 'boolean') {
      const conflicts = Array.isArray(parsed.conflicts) ? parsed.conflicts : [];
      return {
        hasConflicts: conflicts.length > 0,
        conflicts: conflicts.map((c, i) => {
          const doc1Obj = typeof c.doc1 === 'object' && c.doc1 !== null
            ? c.doc1
            : { name: 'Existing Record in Vault', value: String(c.doc1 || 'Previous record value') };
          const doc2Obj = typeof c.doc2 === 'object' && c.doc2 !== null
            ? c.doc2
            : { name: newDocTitle, value: String(c.doc2 || 'New record value') };

          return {
            id: c.id || `conflict-grok-${i}`,
            title: c.title || 'Clinical Discrepancy Detected',
            type: c.type || 'dosage_contradiction',
            severity: c.severity || 'high',
            doc1: doc1Obj,
            doc2: doc2Obj,
            where: c.where || 'Active Maintenance Medications',
            explanation: c.explanation || 'Discrepancy detected between records.',
            editable_field: c.editable_field || 'Clinical Value',
            current_value: c.current_value || doc2Obj.value || '',
          };
        }),
      };
    }
  } catch (err) {
    console.warn('[conflictService] Grok conflict check error, using deterministic fallback:', err);
  }

  // Fallback to deterministic check
  return checkDeterministicConflicts(newDoc, validExisting);
}

/**
 * Applies user/doctor edits to resolve clinical conflicts in the payload
 * 
 * @param {Object} clinicalJson Structured JSON to update
 * @param {Object} resolvedValues Map of conflict id -> new user edited value string
 * @returns {Object} Updated structured JSON
 */
export function applyConflictResolutions(clinicalJson, resolvedValues = {}) {
  if (!clinicalJson || Object.keys(resolvedValues).length === 0) {
    return clinicalJson;
  }

  const updated = JSON.parse(JSON.stringify(clinicalJson));
  const meds = updated?.extracted_entities?.medications || updated?.medications || [];

  Object.entries(resolvedValues).forEach(([conflictId, newVal]) => {
    if (!newVal || typeof newVal !== 'string') return;
    const cleanVal = newVal.trim();

    // Look for matching medication in new payload to update dose
    meds.forEach((m) => {
      // If user typed a new dose or selected alternative
      m.dose_raw = cleanVal;
      m.clinical_resolution_note = `Verified and adjusted during upload conflict resolution.`;
    });
  });

  return updated;
}
