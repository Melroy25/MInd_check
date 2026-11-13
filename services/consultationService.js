/**
 * services/consultationService.js
 * 
 * Clinical Consultation Engine:
 * 1. Live audio chunking & streaming to Groq Whisper (Zero audio persistence).
 * 2. Debounced real-time clinical reasoning via Groq LLM (openai/gpt-oss-120b).
 * 3. Incorporates Doctor's Preferred Medicines memory to prioritize their usual habits.
 * 4. Extracts: symptoms, probable diagnosis (labeled 'possible'), allergies, current medications,
 *    and structured suggested medicines with why, advantages, disadvantages, warnings.
 */

import { callGrok, transcribeAudioGroq } from './grokClient.js';
import { getDoctorPreferredMedicines } from './supabase/preferredMedsService.js';

/**
 * System Prompt matching clinical guidelines
 */
const CLINICAL_SYSTEM_PROMPT = `You are a clinical decision-support assistant for a licensed doctor.
Based on the consultation transcript and the doctor's preferred medicines, suggest appropriate medicines with reasoning.
Flag allergies, interactions, and uncertainty.
Never present output as a final diagnosis.
If information is insufficient, say so and state what is missing instead of guessing.

Return strictly a valid JSON object matching this schema:
{
  "symptoms": ["string"],
  "probable_diagnosis": ["string (labeled possible)"],
  "allergies": ["string"],
  "current_medications": ["string"],
  "missing_information": "string or null",
  "suggested_medicines": [
    {
      "name": "string (Generic + Brand)",
      "dosage": "string (e.g. 500mg)",
      "frequency": "string (e.g. 1 tab twice daily)",
      "duration": "string (e.g. 5 days)",
      "timing": "string (e.g. after food)",
      "why": "string (reason tied to symptoms mentioned)",
      "advantages": "string (key clinical benefits)",
      "disadvantages": "string (side effects, contraindications, drug interactions)",
      "warnings": "string (allergies or conditions from transcript that conflict, or 'None detected')",
      "is_preferred": true
    }
  ]
}`;

/**
 * Generate real-time clinical suggestions from transcript and doctor preferences
 */
export async function generateConsultationSuggestions(transcriptText, doctorId = 'default_doctor') {
  if (!transcriptText || transcriptText.trim().length < 10) {
    return {
      symptoms: [],
      probable_diagnosis: [],
      allergies: [],
      current_medications: [],
      suggested_medicines: [],
      missing_information: 'Listening for patient consultation...',
    };
  }

  // 1. Fetch Doctor's Preferred Medicines to provide learning context
  const preferredMeds = await getDoctorPreferredMedicines(doctorId);
  const preferredMedsSummary = preferredMeds
    .slice(0, 10)
    .map((m) => `- ${m.name} ${m.strength || ''} (${m.form || 'tablet'}): usual ${m.usual_dosage || ''}, for [${(m.condition_tags || []).join(', ')}] (prescribed ${m.usage_count || 1}x)`)
    .join('\n');

  const userPrompt = `DOCTOR'S PREFERRED MEDICINES (Prioritize these if clinically indicated for the symptoms):
${preferredMedsSummary || 'No stored preferences yet.'}

CONSULTATION TRANSCRIPT:
${transcriptText}

Analyze this live consultation and provide structured medicine suggestions, clinical rationale, contraindication warnings, and extracted facts. Return ONLY the JSON object.`;

  try {
    const groqResponse = await callGrok([
      { role: 'system', content: CLINICAL_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ], {
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const content = groqResponse.choices[0]?.message?.content;
    const parsed = typeof content === 'string' ? JSON.parse(content) : content;

    return {
      symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
      probable_diagnosis: Array.isArray(parsed.probable_diagnosis) ? parsed.probable_diagnosis : [],
      allergies: Array.isArray(parsed.allergies) ? parsed.allergies : [],
      current_medications: Array.isArray(parsed.current_medications) ? parsed.current_medications : [],
      missing_information: parsed.missing_information || null,
      suggested_medicines: Array.isArray(parsed.suggested_medicines) ? parsed.suggested_medicines : [],
    };
  } catch (err) {
    console.error('[ConsultationService] Suggestion generation failed:', err);
    throw err;
  }
}

/**
 * In-Memory Web Audio Recorder Manager (Browser / WebView)
 * STRICT ZERO AUDIO STORAGE GUARANTEE:
 * - Recorded chunks are processed in memory and released immediately.
 * - No audio files are ever written to disk or uploaded to persistent buckets.
 */
export class LiveAudioRecorderSession {
  constructor(options = {}) {
    this.onChunkTranscribed = options.onChunkTranscribed || (() => {});
    this.onError = options.onError || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});
    this.mediaRecorder = null;
    this.mediaStream = null;
    this.chunkInterval = options.chunkIntervalMs || 6000; // 6s chunks
    this.isRecording = false;
    this.isPaused = false;
    this.timer = null;
  }

  async start() {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone access is not supported in this environment.');
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
        },
      });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus') ? 'audio/ogg;codecs=opus' : '');

      this.mediaRecorder = new MediaRecorder(this.mediaStream, mimeType ? { mimeType } : undefined);

      this.mediaRecorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0 && this.isRecording && !this.isPaused) {
          const chunkBlob = event.data;
          try {
            // Transcribe chunk in memory via Groq Whisper with 4-key rotation
            const result = await transcribeAudioGroq(chunkBlob, {
              prompt: 'Clinical consultation between doctor and patient discussing symptoms and medications.',
            });

            if (result && result.text && result.text.trim().length > 0) {
              this.onChunkTranscribed(result.text.trim());
            }
          } catch (sttErr) {
            console.warn('[LiveAudioRecorder] Chunk transcription error:', sttErr.message);
          }
          // Explicitly discard blob reference to free memory immediately
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.isPaused = false;
      this.onStatusChange('recording');

      // Slice audio in memory chunks periodically
      this.timer = setInterval(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.requestData();
        }
      }, this.chunkInterval);

      return true;
    } catch (err) {
      this.onError(err);
      throw err;
    }
  }

  pause() {
    if (this.mediaRecorder && this.isRecording && !this.isPaused) {
      if (this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.pause();
      }
      this.isPaused = true;
      this.onStatusChange('paused');
    }
  }

  resume() {
    if (this.mediaRecorder && this.isRecording && this.isPaused) {
      if (this.mediaRecorder.state === 'paused') {
        this.mediaRecorder.resume();
      }
      this.isPaused = false;
      this.onStatusChange('recording');
    }
  }

  stop() {
    this.isRecording = false;
    this.isPaused = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this.mediaRecorder) {
      try {
        if (this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop();
        }
      } catch {
        // Ignore inactive stop
      }
      this.mediaRecorder = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.onStatusChange('stopped');
  }
}
