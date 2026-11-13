// tests/testGrokRotation.js
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

import { getGrokKeyPoolStatus, callGrok } from '../services/grokClient.js';

async function main() {
  console.log('Testing Groq Key Pool...');
  const pool = getGrokKeyPoolStatus();
  console.log('Pool count:', pool.length);
  pool.forEach(p => console.log(`  Key #${p.index}: ${p.maskedKey} (${p.status})`));

  console.log('\nSending test clinical prompt to Groq (openai/gpt-oss-120b)...');
  const response = await callGrok([
    {
      role: 'system',
      content: 'You are a clinical decision-support assistant. Respond strictly with a JSON object.'
    },
    {
      role: 'user',
      content: 'Suggest 1 medicine for mild hypertension. Output JSON with format: {"medication": "Amlodipine", "dosage": "5mg"}'
    }
  ]);

  const output = response.choices[0].message.content;
  console.log('Groq Response:\n', output);
  console.log('\nSUCCESS! Groq 4-Key Rotation Client is operational.');
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
