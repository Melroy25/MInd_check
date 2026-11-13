/**
 * services/grokClient.js
 * 
 * Production Groq API Client with Automatic 4-Key Rotation & Token Limit Failover.
 * 
 * Features:
 * 1. Supports 1 to 4 Groq API keys loaded from literal EXPO_PUBLIC_GROK_API_KEY_1..4.
 * 2. Automatic key rotation and 60-second cooldown on HTTP 429 (Rate / Token limit exceeded) or 503.
 * 3. Immediate failover to the next available key without failing user requests.
 * 4. Remembers the last working key to eliminate failover latency.
 * 5. Masks API keys in logs (only last 4 characters shown).
 * 6. High-speed Whisper speech-to-text transcription via whisper-large-v3-turbo (Zero audio storage).
 * 7. Structured JSON clinical inference via openai/gpt-oss-120b (or configured model).
 */

let lastWorkingGrokIndex = 0;
const grokCooldownMap = new Map(); // key -> cooldownExpiryTimestamp (ms)

/**
 * Explicitly load all configured Groq API keys.
 * Note: Uses literal process.env references so Expo Metro inlines them at bundle time.
 * Also parses .env.local as fallback for Node / testing environments.
 */
export function getGrokApiKeys() {
  let rawKeys = [
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_GROK_API_KEY_1 : undefined,
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_GROK_API_KEY_2 : undefined,
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_GROK_API_KEY_3 : undefined,
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_GROK_API_KEY_4 : undefined,
    // Fallback single keys
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_GROK_API_KEY : undefined,
    typeof process !== 'undefined' ? process.env?.GROK_API_KEY : undefined,
    typeof process !== 'undefined' ? process.env?.GROQ_API_KEY : undefined,
  ];

  let validKeys = rawKeys
    .map((k) => (typeof k === 'string' ? k.trim() : ''))
    .filter((k) => k.length > 0);

  // If running in Node.js test environment and env vars are not set in process.env
  if (validKeys.length === 0 && typeof process !== 'undefined' && typeof require !== 'undefined') {
    try {
      const fs = require('fs');
      const path = require('path');
      const envPath = path.resolve(process.cwd(), '.env.local');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        for (let i = 1; i <= 4; i++) {
          const match = content.match(new RegExp(`EXPO_PUBLIC_GROK_API_KEY_${i}=([^\r\n]+)`));
          if (match && match[1]) {
            validKeys.push(match[1].trim());
          }
        }
      }
    } catch {
      // Ignore in browser/React Native environment
    }
  }

  return Array.from(new Set(validKeys));
}

/**
 * Retrieve the active chat completion model name
 */
export function getGrokModel(key = '') {
  let model = 'openai/gpt-oss-120b';
  if (typeof process !== 'undefined') {
    model = (
      process.env?.EXPO_PUBLIC_GROK_MODEL ||
      process.env?.GROK_MODEL ||
      'openai/gpt-oss-120b'
    );
  }
  // If Groq key (gsk_...) is used with a grok- named model, adapt to Groq's high-performance LLM
  if ((!key || key.startsWith('gsk_')) && model.startsWith('grok-')) {
    return 'openai/gpt-oss-120b';
  }
  return model;
}

/**
 * Retrieve the active Whisper STT model name
 */
export function getWhisperModel() {
  if (typeof process !== 'undefined') {
    return (
      process.env?.EXPO_PUBLIC_GROK_WHISPER_MODEL ||
      'whisper-large-v3-turbo'
    );
  }
  return 'whisper-large-v3-turbo';
}

/**
 * Determine API endpoint based on key prefix
 */
function getApiBaseUrl(key) {
  if (key && key.startsWith('xai-')) {
    return 'https://api.x.ai/v1';
  }
  // Default to Groq OpenAI-compatible endpoint
  return 'https://api.groq.com/openai/v1';
}

/**
 * Mask key for safe console logging (e.g. "...w9Xy")
 */
export function maskGrokKey(key) {
  if (!key || typeof key !== 'string') return '...????';
  return `...${key.slice(-4)}`;
}

/**
 * Check if a Grok key is currently on rate limit cooldown
 */
function isGrokKeyOnCooldown(key) {
  const expiry = grokCooldownMap.get(key) || 0;
  return Date.now() < expiry;
}

/**
 * Place a Grok key on cooldown (default: 60 seconds)
 */
function setGrokKeyCooldown(key, durationMs = 60000) {
  grokCooldownMap.set(key, Date.now() + durationMs);
}

/**
 * Reset all Grok key cooldowns
 */
export function resetGrokKeyCooldowns() {
  grokCooldownMap.clear();
}

/**
 * Return current pool health for Grok keys
 */
export function getGrokKeyPoolStatus() {
  const keys = getGrokApiKeys();
  const now = Date.now();
  return keys.map((k, idx) => {
    const expiry = grokCooldownMap.get(k) || 0;
    const onCooldown = now < expiry;
    const remainingSec = onCooldown ? Math.ceil((expiry - now) / 1000) : 0;
    return {
      index: idx + 1,
      maskedKey: maskGrokKey(k),
      status: onCooldown ? `cooldown (${remainingSec}s)` : 'ready',
      isLastWorking: idx === lastWorkingGrokIndex,
    };
  });
}

/**
 * Execute Groq Chat Completion with automatic multi-key rotation and token limit failover.
 * 
 * @param {Array} messages OpenAI-compatible messages array: [{ role: 'system'|'user', content: ... }]
 * @param {Object} options Optional config: model, temperature, response_format
 */
export async function callGrok(messages, options = {}) {
  const keys = getGrokApiKeys();
  if (keys.length === 0) {
    throw new Error('No Groq API keys found. Please define EXPO_PUBLIC_GROK_API_KEY_1 in .env.local.');
  }

  const totalKeys = keys.length;
  let attempts = 0;
  let currentIndex = lastWorkingGrokIndex % totalKeys;

  while (attempts < totalKeys) {
    const currentKey = keys[currentIndex];
    const model = options.model || getGrokModel(currentKey);

    // If key is on cooldown, check next key
    if (isGrokKeyOnCooldown(currentKey)) {
      currentIndex = (currentIndex + 1) % totalKeys;
      attempts++;
      continue;
    }

    const baseUrl = getApiBaseUrl(currentKey);

    try {
      const payload = {
        model,
        messages,
        temperature: options.temperature !== undefined ? options.temperature : 0.6,
      };
      if (options.response_format) {
        payload.response_format = options.response_format;
      } else if (options.json) {
        payload.response_format = { type: 'json_object' };
      }

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentKey}`,
        },
        body: JSON.stringify(payload),
      });

      // Handle Rate Limit / Token Limit Exceeded / Server Overload
      if (response.status === 429 || response.status === 503 || response.status === 500) {
        console.warn(
          `[GroqClient] Key #${currentIndex + 1} (${maskGrokKey(currentKey)}) hit status ${response.status} (Rate/Token Limit). Placing on 60s cooldown and rotating...`
        );
        setGrokKeyCooldown(currentKey, 60000);
        currentIndex = (currentIndex + 1) % totalKeys;
        attempts++;
        continue;
      }

      // Handle Quota or Forbidden
      if (response.status === 403) {
        const errorBody = await response.text();
        if (errorBody.toLowerCase().includes('quota') || errorBody.toLowerCase().includes('rate') || errorBody.toLowerCase().includes('token')) {
          console.warn(`[GroqClient] Key #${currentIndex + 1} quota exhausted. Rotating...`);
          setGrokKeyCooldown(currentKey, 60000);
          currentIndex = (currentIndex + 1) % totalKeys;
          attempts++;
          continue;
        }
        throw new Error(`Groq API Forbidden (403): ${errorBody}`);
      }

      // Handle Client Errors
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          console.warn(`[GroqClient] Key #${currentIndex + 1} invalid (401). Rotating...`);
          setGrokKeyCooldown(currentKey, 3600000);
          currentIndex = (currentIndex + 1) % totalKeys;
          attempts++;
          continue;
        }
        throw new Error(`Groq API Error (${response.status}): ${errorText}`);
      }

      const json = await response.json();
      lastWorkingGrokIndex = currentIndex; // Remember working key
      return json;

    } catch (err) {
      if (err.message && err.message.includes('Groq API Error (400)')) {
        throw err;
      }
      console.warn(`[GroqClient] Network exception on key #${currentIndex + 1} (${maskGrokKey(currentKey)}):`, err.message);
      setGrokKeyCooldown(currentKey, 30000);
      currentIndex = (currentIndex + 1) % totalKeys;
      attempts++;
    }
  }

  throw new Error('All configured Groq API keys are currently rate-limited or exhausted. Please try again shortly.');
}

/**
 * Transcribe an in-memory audio chunk via Groq Whisper with 4-key rotation.
 * 
 * STRICT PRIVACY GUARANTEE:
 * - Audio is received in-memory as a Blob, File, or base64 buffer.
 * - Audio is streamed directly to Groq Whisper over TLS.
 * - Zero audio bytes are persisted to local storage, database, or disk.
 * 
 * @param {Blob|File} audioData In-memory audio file/blob
 * @param {Object} options Optional config: language (default: 'en'), prompt
 */
export async function transcribeAudioGroq(audioData, options = {}) {
  const keys = getGrokApiKeys();
  if (keys.length === 0) {
    throw new Error('No Groq API keys found. Please define EXPO_PUBLIC_GROK_API_KEY_1 in .env.local.');
  }

  const model = options.model || getWhisperModel();
  const totalKeys = keys.length;
  let attempts = 0;
  let currentIndex = lastWorkingGrokIndex % totalKeys;

  while (attempts < totalKeys) {
    const currentKey = keys[currentIndex];

    if (isGrokKeyOnCooldown(currentKey)) {
      currentIndex = (currentIndex + 1) % totalKeys;
      attempts++;
      continue;
    }

    try {
      const formData = new FormData();
      // Attach in-memory audio file
      if (typeof audioData === 'object' && audioData !== null) {
        formData.append('file', audioData, 'consultation_chunk.webm');
      } else {
        throw new Error('Audio data must be a valid in-memory Blob or File');
      }

      formData.append('model', model);
      formData.append('response_format', 'verbose_json');
      if (options.language) {
        formData.append('language', options.language);
      }
      if (options.prompt) {
        formData.append('prompt', options.prompt);
      }

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentKey}`,
        },
        body: formData,
      });

      if (response.status === 429 || response.status === 503 || response.status === 500) {
        console.warn(
          `[GroqWhisper] Key #${currentIndex + 1} (${maskGrokKey(currentKey)}) hit status ${response.status}. Rotating...`
        );
        setGrokKeyCooldown(currentKey, 60000);
        currentIndex = (currentIndex + 1) % totalKeys;
        attempts++;
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          setGrokKeyCooldown(currentKey, 3600000);
          currentIndex = (currentIndex + 1) % totalKeys;
          attempts++;
          continue;
        }
        throw new Error(`Groq Whisper Error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      lastWorkingGrokIndex = currentIndex;
      return result; // Contains { text, segments, duration, language }

    } catch (err) {
      console.warn(`[GroqWhisper] Exception on key #${currentIndex + 1}:`, err.message);
      setGrokKeyCooldown(currentKey, 30000);
      currentIndex = (currentIndex + 1) % totalKeys;
      attempts++;
    }
  }

  throw new Error('All configured Groq API keys are currently rate-limited for Whisper transcription.');
}
