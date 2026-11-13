/**
 * services/rag/biomarkerRAG.js
 * 
 * Hritika's RAG & Clinical Biomarker Pipeline
 * Parses extracted clinical values, checks normal clinical reference ranges,
 * flags abnormalities (HIGH / LOW / CRITICAL), and cites verbatim page quotes.
 */

// ─── STANDARD CLINICAL REFERENCE RANGES ──────────────────────────────────────
export const REFERENCE_RANGES = {
  glucose_fasting: { min: 70, max: 99, unit: 'mg/dL', name: 'Fasting Plasma Glucose' },
  hba1c: { min: 4.0, max: 5.6, unit: '%', name: 'Hemoglobin A1c' },
  total_cholesterol: { min: 125, max: 200, unit: 'mg/dL', name: 'Total Cholesterol' },
  triglycerides: { min: 50, max: 150, unit: 'mg/dL', name: 'Triglycerides' },
  creatinine: { min: 0.7, max: 1.3, unit: 'mg/dL', name: 'Creatinine, Serum' },
  systolic_bp: { min: 90, max: 120, unit: 'mmHg', name: 'Systolic Blood Pressure' },
  diastolic_bp: { min: 60, max: 80, unit: 'mmHg', name: 'Diastolic Blood Pressure' },
};

/**
 * Evaluates a numeric test result against clinical reference standards
 */
export function evaluateBiomarker(testKey, numericValue, rawQuote = '', pageNumber = 1) {
  const ref = REFERENCE_RANGES[testKey];
  if (!ref) return { status: 'UNKNOWN', flag: 'normal', quote: rawQuote };

  let flag = 'normal';
  let severity = 'LOW_RISK';

  if (numericValue > ref.max) {
    flag = numericValue > ref.max * 1.3 ? 'critical_high' : 'high';
    severity = flag === 'critical_high' ? 'CRITICAL' : 'ELEVATED';
  } else if (numericValue < ref.min) {
    flag = numericValue < ref.min * 0.7 ? 'critical_low' : 'low';
    severity = flag === 'critical_low' ? 'CRITICAL' : 'LOW';
  }

  return {
    testName: ref.name,
    value: numericValue,
    unit: ref.unit,
    standardRange: `${ref.min} - ${ref.max} ${ref.unit}`,
    flag,
    severity,
    evidenceCitation: {
      verbatimQuote: rawQuote || `Recorded value: ${numericValue} ${ref.unit}`,
      page: pageNumber,
    },
  };
}

/**
 * Scans an entire extracted clinical JSON document and returns flagged findings
 */
export function scanRecordForBiomarkerFlags(extractedJson) {
  if (!extractedJson || !extractedJson.lab_results) return [];

  const findings = [];
  extractedJson.lab_results.forEach((lab, idx) => {
    const val = parseFloat(lab.value);
    if (!isNaN(val)) {
      const isHigh = lab.flag === 'high' || lab.flag === 'critical_high';
      const isLow = lab.flag === 'low' || lab.flag === 'critical_low';

      if (isHigh || isLow) {
        findings.push({
          id: `flag_${idx}`,
          testName: lab.test_name,
          value: lab.value,
          unit: lab.unit,
          referenceRange: lab.reference_range_raw,
          flag: lab.flag,
          citation: lab.evidence?.quote || 'Extracted from source lab report',
          page: lab.evidence?.page || 1,
        });
      }
    }
  });

  return findings;
}
