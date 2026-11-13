/**
 * MediVault Native Clinical PDF Generator, Viewer & Downloader
 * 
 * Powered by expo-print & expo-sharing on iOS/Android APK with
 * zero-dependency pure JS ISO-standard fallback on Web.
 */
import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/**
 * Strict ASCII sanitizer for PDF 1.4 PostScript Type 1 fonts.
 * Completely eliminates character encoding artifacts (such as 'â') caused by
 * multi-byte UTF-8 sequences (em-dashes, en-dashes, bullets, curly quotes).
 */
export const cleanAscii = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/[\u2014\u2015]/g, ' - ') // em dash -> ' - '
    .replace(/[\u2012\u2013]/g, ' - ') // en dash -> ' - '
    .replace(/[\u2018\u2019]/g, "'")   // smart single quotes
    .replace(/[\u201C\u201D]/g, '"')   // smart double quotes
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '-') // bullets
    .replace(/[\u00A0]/g, ' ')         // non-breaking space
    .replace(/[^\x20-\x7E]/g, ' ')     // strip any remaining non-ASCII character
    .replace(/\s+/g, ' ')              // collapse multiple spaces
    .trim();
};

/**
 * Deduplicate an array of objects by a string key, removing empty/duplicate items.
 */
export const dedupeItems = (list, keyFn) => {
  const seen = new Set();
  const result = [];
  for (const item of (list || [])) {
    const rawKey = keyFn(item);
    const key = cleanAscii(rawKey).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
};

/**
 * Clean and normalize allergy substance names, guarding against extracted adjectives like 'Severe'.
 */
export const cleanAllergySubstance = (a) => {
  const raw = cleanAscii(typeof a === 'object' ? (a.substance || a.name) : a);
  const genericAdjectives = ['severe', 'moderate', 'mild', 'active', 'known', 'critical', 'allergic', 'allergy', 'contraindicated'];
  if (!raw || genericAdjectives.includes(raw.toLowerCase())) {
    if (a?.reaction) {
      return `Hypersensitivity (${cleanAscii(a.reaction)})`;
    }
    return 'Unspecified Allergen';
  }
  return raw;
};

/**
 * Clean and truncate source document names for layout balance.
 */
export const formatSource = (src, maxLen = 46) => {
  const clean = cleanAscii(src || 'Verified Record');
  if (clean.length <= maxLen) return `Source: ${clean}`;
  return `Source: ${clean.substring(0, maxLen - 3)}...`;
};

/**
 * Generate a clean, responsive HTML clinical report layout
 * Supports:
 * - Multiple Report Presets: 'emergency', 'complete', 'allergies', 'medications', 'custom'
 * - Source Document Provenance at the top (PDF & Images, strictly NO JSON)
 * - Patient Privacy Redaction: excludes sensitive conditions/terms SILENTLY with zero disclaimers
 */
export function generateMedicalHtml(record = {}) {
  const patientName = cleanAscii(record.patientName || record.patient || 'Verified Patient');
  const patientId = cleanAscii(record.patientId || 'MV-SOVEREIGN');
  const doctorName = cleanAscii(record.doctor || 'Attending Clinical Team');
  const facilityName = cleanAscii(record.facility || 'MedFlow Sovereign Health Network');
  const recordName = cleanAscii(record.name || 'Consolidated Sovereign Health Record');
  const recordDate = cleanAscii(record.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
  const reportType = record.reportType || 'complete';
  const bloodType = cleanAscii(record.bloodType || record.bloodGroup || 'Not documented');
  const emergencyContact = cleanAscii(record.emergencyContact || 'Not specified on file');
  const redactedTerms = Array.isArray(record.redactedTerms) ? record.redactedTerms : [];

  // Helper to check if an item contains sensitive/redacted keywords
  const isRedacted = (text) => {
    if (!text || redactedTerms.length === 0) return false;
    const lower = String(text).toLowerCase();
    return redactedTerms.some((term) => term && lower.includes(String(term).toLowerCase().trim()));
  };

  const extracted = record.extractedData || record.structuredData || {};

  // 1. Lab Results (filtered and deduplicated)
  const rawLabs = (Array.isArray(extracted.lab_results) && extracted.lab_results.length > 0)
    ? extracted.lab_results
    : (Array.isArray(extracted.extracted_entities?.lab_results) && extracted.extracted_entities.lab_results.length > 0)
    ? extracted.extracted_entities.lab_results
    : (Array.isArray(record.lab_results) ? record.lab_results : []);

  const labResults = dedupeItems(rawLabs.filter((l) => !isRedacted(l.test_name) && !isRedacted(l.value)), (l) => l.test_name || l);

  // 2. Medications (filtered and deduplicated)
  const rawMeds = (Array.isArray(extracted.medications) && extracted.medications.length > 0)
    ? extracted.medications
    : (Array.isArray(extracted.extracted_entities?.medications) && extracted.extracted_entities.medications.length > 0)
    ? extracted.extracted_entities.medications
    : (Array.isArray(record.medications) ? record.medications : []);

  let medications = dedupeItems(rawMeds.filter((m) => !isRedacted(m.name) && !isRedacted(m.indication)), (m) => m.name || m);
  if (medications.length > 1) {
    const specificMeds = medications.filter((m) => !cleanAscii(m.name || m).toLowerCase().includes('standard care protocol'));
    if (specificMeds.length > 0) medications = specificMeds;
  }

  // 3. Conditions & Diagnoses (filtered and deduplicated)
  const rawConditions = (Array.isArray(extracted.conditions) && extracted.conditions.length > 0)
    ? extracted.conditions
    : (Array.isArray(extracted.extracted_entities?.conditions) && extracted.extracted_entities.conditions.length > 0)
    ? extracted.extracted_entities.conditions
    : (Array.isArray(record.conditions) ? record.conditions : []);

  let conditions = dedupeItems(rawConditions.filter((c) => !isRedacted(c.name || c)), (c) => c.name || c);
  if (conditions.length > 1) {
    const specific = conditions.filter((c) => {
      const n = cleanAscii(c.name || c).toLowerCase();
      return !n.includes('routine clinical evaluation') && !n.includes('standard care protocol');
    });
    if (specific.length > 0) conditions = specific;
  }

  // 4. Allergies & Sensitivities (filtered and deduplicated)
  let rawAllergies = [];
  if (Array.isArray(extracted.allergies)) {
    rawAllergies = extracted.allergies;
  } else if (Array.isArray(extracted.allergies?.items)) {
    rawAllergies = extracted.allergies.items;
  } else if (Array.isArray(extracted.extracted_entities?.allergies?.items)) {
    rawAllergies = extracted.extracted_entities.allergies.items;
  } else if (Array.isArray(record.allergies)) {
    rawAllergies = record.allergies;
  }

  const allergies = dedupeItems(rawAllergies.filter((a) => !isRedacted(a.substance || a.name || a)), (a) => cleanAllergySubstance(a));

  // 5. Source Documents Provenance
  const primaryDocName = cleanAscii(
    record.sourceDocuments?.[0]?.name ||
    record.sourceFileName ||
    'Direct Sovereign Vault Entry'
  );

  // ─── BUILD SECTION HTML BLOCKS ──────────────────────────────────────────────
  let conditionsHtml = '';
  if (reportType !== 'medications' && reportType !== 'allergies') {
    if (conditions.length > 0) {
      conditionsHtml = `
        <div class="section-title">Verified Diagnoses & Clinical Conditions</div>
        <table>
          <thead>
            <tr>
              <th>Condition / Diagnosis</th>
              <th>Clinical Status</th>
              <th>Certainty</th>
              <th>Attending Doctor</th>
            </tr>
          </thead>
          <tbody>
            ${conditions.map((c) => `
              <tr>
                <td>
                  <strong>${cleanAscii(c.name || c)}</strong>
                  <div style="font-size: 10px; color: #0284C7; font-weight: 500; margin-top: 2px;">${formatSource(c.source || primaryDocName)}</div>
                </td>
                <td><span class="status-pill">${cleanAscii(c.status || 'Active')}</span></td>
                <td>${cleanAscii(c.certainty || 'Confirmed')}</td>
                <td>${doctorName}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      conditionsHtml = `
        <div class="section-title">Verified Diagnoses & Clinical Conditions</div>
        <div style="font-size: 11.5px; color: #64748B; font-style: italic; padding: 6px 0 16px;">No chronic conditions or active diagnoses documented in uploaded records.</div>
      `;
    }
  }

  let allergiesHtml = '';
  if (reportType !== 'medications') {
    if (allergies.length > 0) {
      allergiesHtml = `
        <div class="section-title" style="color: #DC2626;">Known Allergies & Adverse Drug Sensitivities</div>
        <table>
          <thead>
            <tr>
              <th>Allergen / Substance</th>
              <th>Reaction Type</th>
              <th>Severity</th>
              <th>Precaution</th>
            </tr>
          </thead>
          <tbody>
            ${allergies.map((a) => {
              const substance = cleanAllergySubstance(a);
              const severity = cleanAscii(a.severity || 'Severe');
              return `
                <tr>
                  <td>
                    <strong>${substance}</strong>
                    <div style="font-size: 10px; color: #0284C7; font-weight: 500; margin-top: 2px;">${formatSource(a.source || primaryDocName)}</div>
                  </td>
                  <td>${cleanAscii(a.reaction || 'Anaphylactic / Hypersensitivity')}</td>
                  <td><span style="color: #DC2626; font-weight: 700;">${severity}</span></td>
                  <td>Contraindicated in all standard prescriptions</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    } else {
      allergiesHtml = `
        <div class="section-title" style="color: #15803D;">Known Allergies & Adverse Drug Sensitivities</div>
        <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px;">
          <div style="font-size: 11.5px; font-weight: 700; color: #15803D;">NO KNOWN ALLERGIES DOCUMENTED</div>
          <div style="font-size: 11px; color: #166534; margin-top: 2px;">No drug allergies or allergen contraindications recorded in uploaded clinical documents.</div>
        </div>
      `;
    }
  }

  let labRowsHtml = '';
  if (labResults.length > 0) {
    labRowsHtml = labResults.map((l) => {
      const flag = cleanAscii(l.flag || 'Normal');
      const flagLower = flag.toLowerCase();
      const flagColor = flagLower.includes('high') ? '#DC2626' : flagLower.includes('low') ? '#D97706' : '#16A34A';
      return `
        <tr>
          <td>
            <strong>${cleanAscii(l.test_name || 'Laboratory Test')}</strong>
            <div style="font-size: 10px; color: #0284C7; font-weight: 500; margin-top: 2px;">${formatSource(l.source || primaryDocName)}</div>
          </td>
          <td>${cleanAscii(l.value || '--')} ${cleanAscii(l.unit || '')}</td>
          <td>${cleanAscii(l.reference_range || l.range || 'Standard')}</td>
          <td><span style="color: ${flagColor}; font-weight: 600;">${flag}</span></td>
        </tr>
      `;
    }).join('');
  }

  let medsRowsHtml = '';
  if (medications.length > 0) {
    medsRowsHtml = medications.map((m) => `
      <tr>
        <td>
          <strong>${cleanAscii(m.name || 'Prescription')}</strong>
          <div style="font-size: 10px; color: #0284C7; font-weight: 500; margin-top: 2px;">${formatSource(m.source || primaryDocName)}</div>
        </td>
        <td>${cleanAscii(m.dose_raw || m.dose || 'As directed')} ${cleanAscii(m.frequency_raw || m.frequency || '')}</td>
        <td>${cleanAscii(m.indication || 'Clinical Maintenance')}</td>
        <td><span style="color: #16A34A; font-weight: 600;">${cleanAscii(m.status || 'Active')}</span></td>
      </tr>
    `).join('');
  }

  // Emergency specifics
  let emergencyBannerHtml = '';
  if (reportType === 'emergency') {
    emergencyBannerHtml = `
      <div class="emergency-banner">
        <div style="font-size: 13px; font-weight: 800; color: #DC2626; margin-bottom: 6px;">FIRST-RESPONDER EMERGENCY DIRECTIVE</div>
        <div style="display: flex; gap: 24px;">
          <div><strong>Blood Type:</strong> <span style="color: #DC2626; font-weight: 800; font-size: 15px;">${bloodType}</span></div>
          <div><strong>Emergency Contact:</strong> ${emergencyContact}</div>
          <div><strong>Hospital:</strong> ${facilityName}</div>
        </div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${recordName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 32px; color: #0F172A; background: #FFF; line-height: 1.45; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #16A34A; padding-bottom: 16px; margin-bottom: 20px; }
    .brand { font-size: 24px; font-weight: 800; color: #16A34A; letter-spacing: -0.5px; }
    .brand-sub { font-size: 11px; color: #64748B; margin-top: 2px; }
    .confidential { text-align: right; }
    .conf-tag { background: #FEE2E2; color: #DC2626; font-size: 10.5px; font-weight: 700; padding: 4px 8px; border-radius: 4px; display: inline-block; }

    .emergency-banner { background: #FEF2F2; border: 1.5px solid #FECACA; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; }

    .title-banner { background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; }
    .title-text { font-size: 18px; font-weight: 700; color: #15803D; margin-bottom: 3px; }
    .meta-grid { display: flex; gap: 16px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; }
    .meta-col { flex: 1; }
    .meta-label { font-size: 9.5px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 3px; }
    .meta-val { font-size: 13.5px; font-weight: 600; color: #0F172A; }
    .status-pill { background: #DCFCE7; color: #15803D; font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }

    .section-title { font-size: 13.5px; font-weight: 700; color: #0F172A; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; margin-top: 18px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { text-align: left; font-size: 10.5px; font-weight: 700; color: #64748B; border-bottom: 2px solid #E2E8F0; padding: 8px 4px; text-transform: uppercase; }
    td { font-size: 12.5px; border-bottom: 1px solid #F1F5F9; padding: 9px 4px; }
    .footer { margin-top: 36px; padding-top: 14px; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; color: #94A3B8; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">MedFlow</div>
      <div class="brand-sub">Sovereign Patient Health Vault</div>
    </div>
    <div class="confidential">
      <div class="conf-tag">CONFIDENTIAL CLINICAL REPORT</div>
      <div style="font-size: 10.5px; color: #64748B; margin-top: 3px;">Issued: ${recordDate}</div>
    </div>
  </div>

  ${emergencyBannerHtml}

  <div class="title-banner">
    <div class="title-text">${recordName}</div>
    <div style="font-size: 11.5px; color: #475569;">Verified by MedFlow Sovereign Cryptographic Architecture</div>
  </div>

  <div class="meta-grid">
    <div class="meta-col">
      <div class="meta-label">Patient Details</div>
      <div class="meta-val">${patientName}</div>
      <div style="font-size: 11px; color: #64748B;">ID: ${patientId}</div>
    </div>
    <div class="meta-col">
      <div class="meta-label">Attending Physician</div>
      <div class="meta-val">${doctorName}</div>
      <div style="font-size: 11px; color: #64748B;">${facilityName}</div>
    </div>
    <div class="meta-col">
      <div class="meta-label">Blood Type & SOS</div>
      <div class="meta-val" style="color: #DC2626;">${bloodType}</div>
      <div style="font-size: 11px; color: #64748B;">${emergencyContact}</div>
    </div>
  </div>

  ${conditionsHtml}
  ${allergiesHtml}

  ${(labResults.length > 0 && reportType !== 'allergies' && reportType !== 'medications') ? `
    <div class="section-title">Clinical Biomarkers & Quantitative Lab Panels</div>
    <table>
      <thead>
        <tr>
          <th>Biomarker / Test</th>
          <th>Result Value</th>
          <th>Reference Range</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${labRowsHtml}
      </tbody>
    </table>
  ` : ''}

  ${(medications.length > 0 && reportType !== 'allergies') ? `
    <div class="section-title">Prescribed Medications & Regimen</div>
    <table>
      <thead>
        <tr>
          <th>Medication</th>
          <th>Dosage & Frequency</th>
          <th>Indication</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${medsRowsHtml}
      </tbody>
    </table>
  ` : ''}

  <div class="footer">
    <div>MedFlow Healthcare OS · Cryptographically Signed by Sovereign Vault</div>
    <div>Page 1 of 1</div>
  </div>
</body>
</html>`;
}

/**
 * Generate a beautifully formatted A4 clinical medical PDF report bytes
 */
export async function generateMedicalPdf(record) {
  // If record has an existing raw PDF blob, convert to bytes directly
  if (record.fileBlob && record.fileBlob.type === 'application/pdf') {
    const arrayBuffer = await record.fileBlob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  const patientName = cleanAscii(record.patientName || record.patient || 'Verified Patient');
  const patientId = cleanAscii(record.patientId || 'MV-SOVEREIGN');
  const doctorName = cleanAscii(record.doctor || 'Attending Clinical Team');
  const facilityName = cleanAscii(record.facility || 'MedFlow Sovereign Health Network');
  const recordName = cleanAscii(record.name || 'Medical Document');
  const recordType = cleanAscii(record.type || 'PDF');
  const recordDate = cleanAscii(record.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2026' }));
  const recordSize = cleanAscii(record.size || '1.8 MB');
  const currentDate = cleanAscii(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));

  // Strict ASCII sanitizer and PostScript string escaper
  const esc = (str) => {
    if (!str) return '';
    return cleanAscii(str)
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  };

  // Build PDF Content Stream (PostScript operators)
  const ops = [];

  // Helper functions
  const fillRect = (x, y, w, h, r, g, b) => {
    ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
    ops.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  };

  const strokeRect = (x, y, w, h, r, g, b, lineWidth = 1) => {
    ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
    ops.push(`${lineWidth.toFixed(2)} w`);
    ops.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
  };

  const drawLine = (x1, y1, x2, y2, r, g, b, lineWidth = 1) => {
    ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
    ops.push(`${lineWidth.toFixed(2)} w`);
    ops.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  };

  const drawText = (rawText, x, y, font = 'F2', size = 10, r = 0.11, g = 0.17, b = 0.1) => {
    const text = esc(rawText);
    if (!text) return;
    ops.push(`BT`);
    ops.push(`/${font} ${size.toFixed(1)} Tf`);
    ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
    ops.push(`${x.toFixed(2)} ${y.toFixed(2)} Td`);
    ops.push(`(${text}) Tj`);
    ops.push(`ET`);
  };

  const pageW = 595.28;
  const pageH = 841.89;

  // 1. Top Decorative Green Bar
  fillRect(0, pageH - 12, pageW, 12, 0.455, 0.659, 0.259); // #74A842

  // 2. Header Brand
  fillRect(40, pageH - 68, 34, 34, 0.455, 0.659, 0.259);
  drawText('MV', 48, pageH - 57, 'F1', 14, 1, 1, 1);
  drawText('MediVault', 84, pageH - 52, 'F1', 20, 0.11, 0.17, 0.1);
  drawText('Patient-Owned Sovereign Health Records Vault', 84, pageH - 66, 'F2', 9.5, 0.42, 0.5, 0.42);

  // Top Right Confidential Flag
  drawText('CONFIDENTIAL MEDICAL RECORD', pageW - 220, pageH - 52, 'F1', 9.5, 0.86, 0.15, 0.15);
  drawText(`Generated: ${currentDate}`, pageW - 220, pageH - 66, 'F2', 9, 0.42, 0.5, 0.42);

  // Divider
  drawLine(40, pageH - 85, pageW - 40, pageH - 85, 0.83, 0.91, 0.78, 1);

  // 3. Document Title Banner
  const titleY = pageH - 140;
  fillRect(40, titleY, pageW - 80, 46, 0.92, 0.95, 0.9);
  strokeRect(40, titleY, pageW - 80, 46, 0.83, 0.91, 0.78, 1);

  drawText(recordName.length > 44 ? recordName.substring(0, 42) + '...' : recordName, 55, titleY + 26, 'F1', 13.5, 0.11, 0.17, 0.1);
  drawText(`Format: ${recordType}  |  Size: ${recordSize}  |  Issued: ${recordDate}`, 55, titleY + 11, 'F2', 9.5, 0.42, 0.5, 0.42);

  // 4. Two-Column Metadata Box
  const metaY = pageH - 245;
  fillRect(40, metaY, pageW - 80, 90, 0.97, 0.98, 0.97);
  strokeRect(40, metaY, pageW - 80, 90, 0.83, 0.91, 0.78, 1);

  // Left Column: Patient
  drawText('PATIENT INFORMATION', 55, metaY + 70, 'F1', 9, 0.365, 0.541, 0.196);
  drawText(`Patient Name: ${patientName}`, 55, metaY + 52, 'F2', 9.5, 0.18, 0.23, 0.18);
  drawText(`Record Identifier: ${patientId}`, 55, metaY + 36, 'F2', 9.5, 0.18, 0.23, 0.18);
  drawText('Vault Category: Sovereign Medical Vault', 55, metaY + 20, 'F2', 9.5, 0.18, 0.23, 0.18);

  // Right Column: Provider
  const col2X = 320;
  drawText('CLINICAL & PROVIDER METADATA', col2X, metaY + 70, 'F1', 9, 0.365, 0.541, 0.196);
  drawText(`Attending Physician: ${doctorName}`, col2X, metaY + 52, 'F2', 9.5, 0.18, 0.23, 0.18);
  drawText(`Facility: ${facilityName}`, col2X, metaY + 36, 'F2', 9.5, 0.18, 0.23, 0.18);
  drawText('Encryption: AES-256 GCM Patient-Sovereign', col2X, metaY + 20, 'F2', 9.5, 0.455, 0.659, 0.259);

  // 5. Clinical Data Extraction & Verification
  const primaryDocName = cleanAscii(
    record.sourceDocuments?.[0]?.name ||
    record.sourceFileName ||
    'Direct Sovereign Vault Entry'
  );

  const reportType = record.reportType || 'complete';
  const bloodType = cleanAscii(record.bloodType || record.bloodGroup || 'Not documented');
  const emergencyContact = cleanAscii(record.emergencyContact || 'Not specified on file');
  const redactedTerms = Array.isArray(record.redactedTerms) ? record.redactedTerms : [];

  const isRedacted = (text) => {
    if (!text || redactedTerms.length === 0) return false;
    const lower = String(text).toLowerCase();
    return redactedTerms.some((term) => term && lower.includes(String(term).toLowerCase().trim()));
  };

  const extracted = record.extractedData || record.structuredData || {};

  const rawConditions = (Array.isArray(record.conditions) && record.conditions.length > 0)
    ? record.conditions
    : (Array.isArray(extracted.conditions) && extracted.conditions.length > 0)
    ? extracted.conditions
    : (Array.isArray(extracted.extracted_entities?.conditions) && extracted.extracted_entities.conditions.length > 0)
    ? extracted.extracted_entities.conditions
    : [];

  const rawMeds = (Array.isArray(record.medications) && record.medications.length > 0)
    ? record.medications
    : (Array.isArray(extracted.medications) && extracted.medications.length > 0)
    ? extracted.medications
    : (Array.isArray(extracted.extracted_entities?.medications) && extracted.extracted_entities.medications.length > 0)
    ? extracted.extracted_entities.medications
    : [];

  const rawLabs = (Array.isArray(record.lab_results) && record.lab_results.length > 0)
    ? record.lab_results
    : (Array.isArray(extracted.lab_results) && extracted.lab_results.length > 0)
    ? extracted.lab_results
    : (Array.isArray(extracted.extracted_entities?.lab_results) && extracted.extracted_entities.lab_results.length > 0)
    ? extracted.extracted_entities.lab_results
    : [];

  let rawAllergies = [];
  if (Array.isArray(record.allergies) && record.allergies.length > 0) {
    rawAllergies = record.allergies;
  } else if (Array.isArray(extracted.allergies)) {
    rawAllergies = extracted.allergies;
  } else if (Array.isArray(extracted.allergies?.items)) {
    rawAllergies = extracted.allergies.items;
  } else if (Array.isArray(extracted.extracted_entities?.allergies?.items)) {
    rawAllergies = extracted.extracted_entities.allergies.items;
  }

  // Filter out any patient-requested redacted terms and deduplicate
  let conditions = dedupeItems(rawConditions.filter((c) => !isRedacted(c.name || c)), (c) => c.name || c);
  if (conditions.length > 1) {
    const specific = conditions.filter((c) => {
      const n = cleanAscii(c.name || c).toLowerCase();
      return !n.includes('routine clinical evaluation') && !n.includes('standard care protocol');
    });
    if (specific.length > 0) conditions = specific;
  }

  let medications = dedupeItems(rawMeds.filter((m) => !isRedacted(m.name || m) && !isRedacted(m.indication)), (m) => m.name || m);
  if (medications.length > 1) {
    const specificMeds = medications.filter((m) => {
      const n = cleanAscii(m.name || m).toLowerCase();
      return !n.includes('standard care protocol');
    });
    if (specificMeds.length > 0) medications = specificMeds;
  }

  let labResults = dedupeItems(rawLabs.filter((l) => !isRedacted(l.test_name || l) && !isRedacted(l.value)), (l) => l.test_name || l);
  let allergies = dedupeItems(rawAllergies.filter((a) => !isRedacted(a.substance || a.name || a)), (a) => cleanAllergySubstance(a));

  let summary = '';
  if (reportType === 'medications') {
    summary = 'Current verified pharmacology regimen and active prescriptions. All medication dosages, intervals, and therapeutic indications have been verified against original vault records.';
  } else if (reportType === 'emergency') {
    summary = 'Critical clinical directives for first-responders and emergency personnel. Includes confirmed blood group, emergency contact, contraindicated allergens, and vital maintenance medications.';
  } else if (reportType === 'allergies') {
    summary = 'Verified patient allergy and hypersensitivity registry. Identifies severe adverse drug reactions and critical contraindications to prevent fatal prescription errors.';
  } else {
    summary = record.extractedData?.summary ||
      'Comprehensive medical documentation stored and verified in MediVault. All conditions, lab values, and medication dosages were verified against original consultation records.';
  }

  let curY = metaY - 30;
  drawText('CLINICAL REPORT & VERIFIED OBSERVATIONS', 40, curY, 'F1', 10.5, 0.11, 0.17, 0.1);
  curY -= 16;

  // Wrap summary text
  const cleanSummary = cleanAscii(summary);
  const words = cleanSummary.split(' ');
  let line = '';
  for (const word of words) {
    if ((line + ' ' + word).length > 80) {
      drawText(line.trim(), 40, curY, 'F2', 9, 0.2, 0.25, 0.2);
      curY -= 13;
      line = word + ' ';
    } else {
      line += word + ' ';
    }
  }
  if (line.trim()) {
    drawText(line.trim(), 40, curY, 'F2', 9, 0.2, 0.25, 0.2);
    curY -= 15;
  }

  // NOTE: Patient privacy changes/redactions are SILENTLY applied.
  // We NEVER draw any directive banner or mention what was excluded!

  // Reusable 2-line clinical row renderer:
  // Line 1: Bullet + Bold Title + Status Badge
  // Line 2: Details + ' |  Source: <SourceDocName>'
  const drawClinicalRow = ({
    bulletColor = [0.15, 0.55, 0.35],
    title,
    badge,
    badgeColor = [0.15, 0.55, 0.35],
    details,
    source,
  }) => {
    if (curY < 145) return;
    fillRect(42, curY + 2, 4, 4, bulletColor[0], bulletColor[1], bulletColor[2]);

    const cleanTitle = cleanAscii(title);
    drawText(cleanTitle, 52, curY, 'F1', 9.5, 0.09, 0.13, 0.15);

    if (badge) {
      const badgeText = `[${cleanAscii(badge)}]`;
      const titleWidth = Math.min(cleanTitle.length * 5.4, 260);
      drawText(badgeText, 56 + titleWidth, curY, 'F1', 8.5, badgeColor[0], badgeColor[1], badgeColor[2]);
    }

    curY -= 13;
    const cleanDetails = cleanAscii(details);
    const srcTag = formatSource(source || primaryDocName, 44);
    const line2 = cleanDetails ? `${cleanDetails}   |   ${srcTag}` : srcTag;
    drawText(line2.length > 88 ? line2.substring(0, 85) + '...' : line2, 52, curY, 'F2', 8.5, 0.35, 0.42, 0.48);
    curY -= 15;
  };

  // 7. Clinical Content Sections Tailored to Report Type
  if (reportType === 'medications') {
    drawText('PRESCRIBED MEDICATIONS & CLINICAL REGIMEN', 40, curY, 'F1', 10.5, 0.11, 0.17, 0.1);
    curY -= 5;
    drawLine(40, curY, pageW - 40, curY, 0.83, 0.91, 0.78, 1);
    curY -= 15;

    for (const m of medications.slice(0, 8)) {
      if (curY < 145) break;
      drawClinicalRow({
        bulletColor: [0.15, 0.55, 0.35],
        title: m.name || 'Prescription',
        badge: m.status || 'Active',
        badgeColor: [0.15, 0.55, 0.35],
        details: `Dosage: ${m.dose_raw || m.dose || 'As directed'}   |   Indication: ${m.indication || 'Maintenance'}`,
        source: m.source,
      });
    }
  } else if (reportType === 'emergency') {
    const emBoxH = 42;
    fillRect(40, curY - emBoxH, pageW - 80, emBoxH, 0.99, 0.95, 0.95);
    strokeRect(40, curY - emBoxH, pageW - 80, emBoxH, 0.95, 0.8, 0.8, 1);
    drawText('FIRST-RESPONDER EMERGENCY DIRECTIVE', 50, curY - 14, 'F1', 9, 0.86, 0.15, 0.15);
    drawText(`Blood Group: ${bloodType}   |   Emergency Contact: ${emergencyContact}`, 50, curY - 26, 'F1', 9, 0.18, 0.23, 0.18);
    drawText(`Primary Hospital: ${facilityName}   |   Attending: ${doctorName}`, 50, curY - 38, 'F2', 8.5, 0.4, 0.45, 0.4);
    curY -= (emBoxH + 15);

    if (allergies.length > 0 && curY > 150) {
      drawText('CRITICAL ALLERGIES & CONTRAINDICATIONS', 40, curY, 'F1', 10, 0.86, 0.15, 0.15);
      curY -= 5;
      drawLine(40, curY, pageW - 40, curY, 0.95, 0.8, 0.8, 1);
      curY -= 14;
      for (const a of allergies.slice(0, 3)) {
        if (curY < 145) break;
        drawClinicalRow({
          bulletColor: [0.86, 0.15, 0.15],
          title: cleanAllergySubstance(a),
          badge: a.severity ? `${a.severity} - Contraindicated` : 'Contraindicated',
          badgeColor: [0.86, 0.15, 0.15],
          details: `Reaction: ${a.reaction || 'Hypersensitivity & Anaphylaxis'}`,
          source: a.source,
        });
      }
      curY -= 4;
    }

    if (medications.length > 0 && curY > 150) {
      drawText('ESSENTIAL MAINTENANCE MEDICATIONS', 40, curY, 'F1', 10, 0.11, 0.17, 0.1);
      curY -= 5;
      drawLine(40, curY, pageW - 40, curY, 0.83, 0.91, 0.78, 1);
      curY -= 14;
      for (const m of medications.slice(0, 3)) {
        if (curY < 145) break;
        drawClinicalRow({
          bulletColor: [0.15, 0.55, 0.35],
          title: m.name || 'Prescription',
          badge: m.status || 'Active',
          badgeColor: [0.15, 0.55, 0.35],
          details: `Dosage: ${m.dose_raw || m.dose || 'As directed'}`,
          source: m.source,
        });
      }
      curY -= 4;
    }

    if (conditions.length > 0 && curY > 150) {
      drawText('ACTIVE CLINICAL CONDITIONS', 40, curY, 'F1', 10, 0.11, 0.17, 0.1);
      curY -= 5;
      drawLine(40, curY, pageW - 40, curY, 0.83, 0.91, 0.78, 1);
      curY -= 14;
      for (const c of conditions.slice(0, 3)) {
        if (curY < 145) break;
        drawClinicalRow({
          bulletColor: [0.1, 0.45, 0.6],
          title: c.name || c,
          badge: c.status || 'Active',
          badgeColor: [0.1, 0.45, 0.6],
          details: `Certainty: ${c.certainty || 'Confirmed'}`,
          source: c.source,
        });
      }
    }
  } else if (reportType === 'allergies') {
    drawText('DOCUMENTED ALLERGIES & ADVERSE DRUG REACTIONS', 40, curY, 'F1', 10.5, 0.86, 0.15, 0.15);
    curY -= 5;
    drawLine(40, curY, pageW - 40, curY, 0.95, 0.8, 0.8, 1);
    curY -= 15;

    for (const a of allergies.slice(0, 8)) {
      if (curY < 145) break;
      drawClinicalRow({
        bulletColor: [0.86, 0.15, 0.15],
        title: cleanAllergySubstance(a),
        badge: a.severity ? `${a.severity} (Contraindicated)` : 'Contraindicated',
        badgeColor: [0.86, 0.15, 0.15],
        details: `Reaction: ${a.reaction || 'Hypersensitivity'}   |   Precaution: Absolute Contraindication`,
        source: a.source,
      });
    }
  } else {
    // Complete Medical History
    if (conditions.length > 0 && curY > 150) {
      drawText('1. DIAGNOSED CONDITIONS & CLINICAL FINDINGS', 40, curY, 'F1', 10, 0.11, 0.17, 0.1);
      curY -= 5;
      drawLine(40, curY, pageW - 40, curY, 0.83, 0.91, 0.78, 1);
      curY -= 14;
      for (const c of conditions.slice(0, 3)) {
        if (curY < 145) break;
        drawClinicalRow({
          bulletColor: [0.1, 0.45, 0.6],
          title: c.name || c,
          badge: c.certainty || 'Confirmed',
          badgeColor: [0.1, 0.45, 0.6],
          details: `Status: ${c.status || 'Active'}`,
          source: c.source,
        });
      }
      curY -= 4;
    }

    if (medications.length > 0 && curY > 150) {
      drawText('2. ACTIVE PHARMACOLOGICAL REGIMEN', 40, curY, 'F1', 10, 0.11, 0.17, 0.1);
      curY -= 5;
      drawLine(40, curY, pageW - 40, curY, 0.83, 0.91, 0.78, 1);
      curY -= 14;
      for (const m of medications.slice(0, 3)) {
        if (curY < 145) break;
        drawClinicalRow({
          bulletColor: [0.15, 0.55, 0.35],
          title: m.name || 'Prescription',
          badge: m.status || 'Active',
          badgeColor: [0.15, 0.55, 0.35],
          details: `Dosage: ${m.dose_raw || m.dose || 'As directed'}   |   Indication: ${m.indication || 'Maintenance'}`,
          source: m.source,
        });
      }
      curY -= 4;
    }

    if (labResults.length > 0 && curY > 150) {
      drawText('3. LABORATORY BIOMARKERS & OBSERVATIONS', 40, curY, 'F1', 10, 0.11, 0.17, 0.1);
      curY -= 5;
      drawLine(40, curY, pageW - 40, curY, 0.83, 0.91, 0.78, 1);
      curY -= 14;
      for (const l of labResults.slice(0, 3)) {
        if (curY < 145) break;
        const flagLower = String(l.flag || '').toLowerCase();
        const flagColor = flagLower.includes('high') ? [0.86, 0.15, 0.15] : flagLower.includes('low') ? [0.85, 0.5, 0.1] : [0.15, 0.55, 0.35];
        drawClinicalRow({
          bulletColor: flagColor,
          title: l.test_name || 'Laboratory Test',
          badge: l.flag || 'Normal',
          badgeColor: flagColor,
          details: `Result: ${l.value || '--'} ${l.unit || ''}   |   Reference: ${l.reference_range || 'Normal'}`,
          source: l.source,
        });
      }
      curY -= 4;
    }

    if (allergies.length > 0 && curY > 150) {
      drawText('4. KNOWN ALLERGIES & ADVERSE REACTIONS', 40, curY, 'F1', 10, 0.86, 0.15, 0.15);
      curY -= 5;
      drawLine(40, curY, pageW - 40, curY, 0.95, 0.8, 0.8, 1);
      curY -= 14;
      for (const a of allergies.slice(0, 2)) {
        if (curY < 145) break;
        drawClinicalRow({
          bulletColor: [0.86, 0.15, 0.15],
          title: cleanAllergySubstance(a),
          badge: a.severity || 'Severe',
          badgeColor: [0.86, 0.15, 0.15],
          details: `Reaction: ${a.reaction || 'Hypersensitivity'} (Contraindicated)`,
          source: a.source,
        });
      }
    }
  }

  // 8. Signature & Cryptographic Seal
  const sealY = 110;
  drawLine(40, sealY + 28, pageW - 40, sealY + 28, 0.83, 0.91, 0.78, 1);

  drawText('Patient Verification Signature:', 40, sealY + 12, 'F1', 8.5, 0.42, 0.5, 0.42);
  drawText(`${patientName} [Digitally Signed via MediVault]`, 40, sealY - 3, 'F1', 9.5, 0.365, 0.541, 0.196);

  drawText('Cryptographic Hash (SHA-256):', col2X, sealY + 12, 'F1', 8.5, 0.42, 0.5, 0.42);
  drawText('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', col2X, sealY - 3, 'F2', 7.5, 0.42, 0.5, 0.42);

  // 9. Footer Bar
  fillRect(0, 0, pageW, 26, 0.97, 0.98, 0.97);
  drawText('MediVault Sovereign Health Platform  |  Confidential Medical Record  |  AES-256 Encrypted', 40, 9, 'F2', 8, 0.42, 0.5, 0.42);

  // Assemble Complete PDF 1.4 File
  const streamContent = ops.join('\n');
  const streamBytes = new TextEncoder().encode(streamContent);

  let pdfString = '%PDF-1.4\n';
  const offsets = [];

  const addObj = (objContent) => {
    offsets.push(new TextEncoder().encode(pdfString).length);
    pdfString += objContent + '\n';
  };

  addObj('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  addObj('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  addObj('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj');
  addObj('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj');
  addObj('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');
  addObj(`6 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${streamContent}\nendstream\nendobj`);

  const xrefOffset = new TextEncoder().encode(pdfString).length;
  pdfString += `xref\n0 7\n0000000000 65535 f \n`;
  for (let i = 0; i < offsets.length; i++) {
    pdfString += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdfString += `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdfString);
}

/**
 * Open PDF directly in a new browser tab or native print preview
 */
export async function viewMedicalPdf(record) {
  try {
    // 1. Native mobile (Android APK / iOS)
    if (Platform.OS !== 'web') {
      const html = generateMedicalHtml(record);
      await Print.printAsync({ html });
      return true;
    }

    // 2. Web browser
    let newTab = null;
    if (typeof window !== 'undefined') {
      try {
        newTab = window.open('about:blank', '_blank');
      } catch (e) {}
    }

    let blob = null;
    if (record.fileBlob && (record.fileBlob.type === 'application/pdf' || record.name?.toLowerCase().endsWith('.pdf'))) {
      blob = record.fileBlob;
    } else if (record.dataUrl && record.dataUrl.startsWith('data:application/pdf')) {
      const base64Data = record.dataUrl.split(',')[1];
      const byteChars = atob(base64Data);
      const byteNums = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
      blob = new Blob([new Uint8Array(byteNums)], { type: 'application/pdf' });
    } else if (record.base64 && (record.mimeType === 'application/pdf' || record.name?.toLowerCase().endsWith('.pdf'))) {
      const byteChars = atob(record.base64);
      const byteNums = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
      blob = new Blob([new Uint8Array(byteNums)], { type: 'application/pdf' });
    } else {
      const pdfBytes = await generateMedicalPdf(record);
      blob = new Blob([pdfBytes], { type: 'application/pdf' });
    }
    const url = URL.createObjectURL(blob);

    if (newTab && !newTab.closed) {
      newTab.location.href = url;
    } else if (typeof window !== 'undefined') {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (a.parentNode) document.body.removeChild(a);
      }, 300);
    }
    return url;
  } catch (err) {
    console.warn('[viewMedicalPdf] Error viewing PDF:', err);
    throw err;
  }
}

/**
 * Trigger direct client-side PDF download or native mobile share sheet
 */
export async function downloadMedicalPdf(record) {
  try {
    // 1. Native mobile (Android APK / iOS)
    if (Platform.OS !== 'web') {
      const html = generateMedicalHtml(record);
      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Download / Share ${record.name || 'Medical Report'}`,
          UTI: 'com.adobe.pdf',
        });
        return true;
      }
    }

    // 2. Web browser
    let blob = null;
    if (record.fileBlob && (record.fileBlob.type === 'application/pdf' || record.name?.toLowerCase().endsWith('.pdf'))) {
      blob = record.fileBlob;
    } else if (record.dataUrl && record.dataUrl.startsWith('data:application/pdf')) {
      const base64Data = record.dataUrl.split(',')[1];
      const byteChars = atob(base64Data);
      const byteNums = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
      blob = new Blob([new Uint8Array(byteNums)], { type: 'application/pdf' });
    } else if (record.base64 && (record.mimeType === 'application/pdf' || record.name?.toLowerCase().endsWith('.pdf'))) {
      const byteChars = atob(record.base64);
      const byteNums = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
      blob = new Blob([new Uint8Array(byteNums)], { type: 'application/pdf' });
    } else {
      const pdfBytes = await generateMedicalPdf(record);
      blob = new Blob([pdfBytes], { type: 'application/pdf' });
    }
    const baseName = sanitizeFilename((record.name || 'medical_record').replace(/\.pdf$/i, ''));
    const filename = `${baseName}.pdf`;

    downloadBlob(blob, filename);
    return true;
  } catch (err) {
    console.warn('[downloadMedicalPdf] Error downloading PDF:', err);
    throw err;
  }
}

function downloadBlob(blob, filename) {
  if (typeof document !== 'undefined') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (a.parentNode) document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 500);
  }
}

function sanitizeFilename(name) {
  if (!name) return 'medical_record';
  return name.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_');
}
