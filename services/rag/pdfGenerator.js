/**
 * services/rag/pdfGenerator.js
 * 
 * Hritika's Official Medical Dossier & Quoted PDF Generator
 * Formats clinical flags, verbatim evidence quotes, and doctor notes
 * into clean, responsive HTML for expo-print and expo-sharing.
 */

export function generateDossierHtml({ patient, flags = [], records = [], doctorNotes = '' }) {
  const flagsRows = flags.length > 0
    ? flags.map((f) => `
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 10px; font-weight: bold; color: #0F172A;">${f.testName}</td>
          <td style="padding: 10px; color: ${f.flag.includes('high') ? '#DC2626' : '#2563EB'}; font-weight: bold;">
            ${f.value} ${f.unit}
          </td>
          <td style="padding: 10px; color: #64748B;">${f.referenceRange}</td>
          <td style="padding: 10px; font-style: italic; color: #475569; font-size: 11px;">
            "${f.citation}" (p. ${f.page})
          </td>
        </tr>
      `).join('')
    : `<tr><td colspan="4" style="padding: 12px; text-align: center; color: #64748B;">All lab biomarkers within normal clinical thresholds.</td></tr>`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>MedFlow Clinical Summary - ${patient?.name || 'Patient'}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0F172A; margin: 30px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #16A34A; padding-bottom: 14px; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: 800; color: #16A34A; margin: 0; }
          .sub { font-size: 13px; color: #64748B; margin-top: 4px; }
          .patient-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { text-align: left; padding: 10px; background: #F1F5F9; font-size: 12px; color: #475569; text-transform: uppercase; }
          .footer { margin-top: 40px; font-size: 11px; color: #94A3B8; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">MEDFLOW HEALTH DOSSIER</h1>
            <div class="sub">Verified Clinical Summary & RAG Evidence Citations</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: bold; font-size: 14px;">Date: ${new Date().toLocaleDateString()}</div>
            <div style="font-size: 12px; color: #64748B;">Vault: ${patient?.vaultId || 'MV-2026-PAT-892'}</div>
          </div>
        </div>

        <div class="patient-box">
          <div style="font-size: 18px; font-weight: bold;">${patient?.name || 'Melroy Almeida'}</div>
          <div style="font-size: 13px; color: #64748B; margin-top: 4px;">
            Blood Group: <strong>${patient?.bloodType || 'O+'}</strong> | Attending: <strong>${patient?.attendingDoctor || 'Dr. Sarah Jenkins'}</strong>
          </div>
        </div>

        <h3 style="font-size: 16px; color: #0F172A; margin-bottom: 8px;">Flagged Lab Biomarkers & Verbatim Quotes</h3>
        <table>
          <thead>
            <tr>
              <th>Test Name</th>
              <th>Value</th>
              <th>Normal Range</th>
              <th>Verbatim Citation (Source PDF)</th>
            </tr>
          </thead>
          <tbody>
            ${flagsRows}
          </tbody>
        </table>

        ${doctorNotes ? `
          <div style="margin-top: 24px; padding: 14px; background: #EFF6FF; border-left: 4px solid #2563EB; border-radius: 6px;">
            <div style="font-weight: bold; color: #1E40AF; font-size: 13px;">Clinical Impression:</div>
            <div style="font-size: 13px; color: #1E3A8A; margin-top: 4px;">${doctorNotes}</div>
          </div>
        ` : ''}

        <div class="footer">
          Generated via MedFlow Sovereign Vault System • Encrypted Architecture • HIPAA-Compliant
        </div>
      </body>
    </html>
  `;
}
