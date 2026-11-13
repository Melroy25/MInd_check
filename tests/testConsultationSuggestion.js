// tests/testConsultationSuggestion.js
import fs from 'fs';
import path from 'path';

// Load .env.local into process.env for Node
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
}

import { generateConsultationSuggestions } from '../services/consultationService.js';

async function run() {
  console.log('Testing generateConsultationSuggestions with mock consultation transcript...');
  const transcript = `
Doctor: Good morning, what symptoms brought you in today?
Patient: Hello Doctor, for the last 3 days I have had a severe sore throat, painful swallowing, fever around 101F, and swollen glands in my neck.
Doctor: Are you allergic to any medicines like penicillin?
Patient: No known drug allergies. But I take Metformin 500mg for my mild blood sugar.
Doctor: Got it. Any cough or runny nose?
Patient: No cough, just pure throat pain and fever.
`;

  const result = await generateConsultationSuggestions(transcript, 'doc_test_123');
  console.log('Symptoms extracted:', result.symptoms);
  console.log('Probable Diagnosis:', result.probable_diagnosis);
  console.log('Allergies:', result.allergies);
  console.log('Current Medications:', result.current_medications);
  console.log('Suggested Medicines Count:', result.suggested_medicines.length);
  if (result.suggested_medicines.length > 0) {
    console.log('Top Suggestion:', JSON.stringify(result.suggested_medicines[0], null, 2));
  }
  console.log('\nSUCCESS! Consultation reasoning engine verified.');
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
