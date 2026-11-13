/**
 * services/geminiClient.js
 * 
 * Centralized Google Gemini API Client with Automatic Multi-Key Rotation & Failover.
 * 
 * Features:
 * 1. Supports 1 to 5 API keys loaded from literal EXPO_PUBLIC_GEMINI_API_KEY_1..5.
 * 2. Remembers last working key to minimize failover latency.
 * 3. Automatic 60-second cooldown on HTTP 429, 500, 503, or 403 quota exhaustion.
 * 4. Immediate failover to the next available key.
 * 5. Throws real errors on client-side bugs (400, 401, non-quota 403) without rotating.
 * 6. Sends API key in 'x-goog-api-key' header (never exposed in URL).
 * 7. Strictly masks API keys in all logs (only last 4 characters shown).
 */

// Memory state for keys & cooldowns across sessions
let lastWorkingIndex = 0;
const cooldownMap = new Map(); // key -> cooldownExpiryTimestamp (ms)

/**
 * Explicitly load all configured Gemini API keys.
 * Note: Must use literal process.env.EXPO_PUBLIC_* references so Expo Metro
 * inlines the environment variables at bundle time.
 */
export function getGeminiApiKeys() {
  const rawKeys = [
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_GEMINI_API_KEY_1 : undefined,
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_GEMINI_API_KEY_2 : undefined,
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_GEMINI_API_KEY_3 : undefined,
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_GEMINI_API_KEY_4 : undefined,
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_GEMINI_API_KEY_5 : undefined,
    // Backwards-compatibility single key fallbacks
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_GEMINI_API_KEY : undefined,
    typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined,
  ];

  // Filter out empty, undefined, or whitespace-only keys
  const validKeys = rawKeys
    .map((k) => (typeof k === 'string' ? k.trim() : ''))
    .filter((k) => k.length > 0);

  // Deduplicate
  return Array.from(new Set(validKeys));
}

/**
 * Retrieve the active Gemini model name
 */
export function getGeminiModel() {
  if (typeof process !== 'undefined') {
    return (
      process.env?.EXPO_PUBLIC_GEMINI_MODEL ||
      process.env?.GEMINI_MODEL ||
      'gemini-3.1-flash-lite'
    );
  }
  return 'gemini-3.1-flash-lite';
}

/**
 * Mask an API key for safe logging (e.g. "...EPnw")
 */
export function maskKey(key) {
  if (!key || typeof key !== 'string') return '...????';
  return `...${key.slice(-4)}`;
}

/**
 * Check if a key is currently on cooldown
 */
function isKeyOnCooldown(key) {
  const expiry = cooldownMap.get(key) || 0;
  return Date.now() < expiry;
}

/**
 * Put a key on cooldown for the specified duration (default 60 seconds)
 */
function setKeyCooldown(key, durationMs = 60000) {
  cooldownMap.set(key, Date.now() + durationMs);
}

/**
 * Reset all key cooldowns
 */
export function resetKeyCooldowns() {
  cooldownMap.clear();
}

/**
 * Return current pool health for telemetry & diagnostic logging
 */
export function getKeyPoolStatus() {
  const keys = getGeminiApiKeys();
  const now = Date.now();
  return keys.map((k, idx) => {
    const expiry = cooldownMap.get(k) || 0;
    const onCooldown = now < expiry;
    const remainingSec = onCooldown ? Math.ceil((expiry - now) / 1000) : 0;
    return {
      index: idx + 1,
      masked: maskKey(k),
      onCooldown,
      cooldownSeconds: remainingSec,
      isLastWorking: idx === lastWorkingIndex,
    };
  });
}

/**
 * Centralized Gemini API caller with automatic rotation and failover.
 * 
 * @param {object|string} body - The JSON request body (contents, generationConfig, etc.)
 * @param {object} [options]
 * @param {string} [options.model] - Override model (defaults to getGeminiModel())
 * @param {AbortSignal} [options.signal] - Optional abort signal
 * @returns {Promise<object>} Parsed Gemini API response JSON
 */
export async function callGemini(body, options = {}) {
  const keys = getGeminiApiKeys();

  if (!keys || keys.length === 0) {
    throw new Error(
      'No Gemini API keys found. Please define EXPO_PUBLIC_GEMINI_API_KEY_1 in .env.local.'
    );
  }

  const model = options.model || getGeminiModel();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const serializedBody = typeof body === 'string' ? body : JSON.stringify(body);

  // Check if ALL keys are currently on cooldown
  const availableKeysCount = keys.filter((k) => !isKeyOnCooldown(k)).length;
  if (availableKeysCount === 0) {
    console.warn('[GeminiClient] All configured API keys are currently on cooldown.');
    throw new Error('All Gemini keys are rate-limited');
  }

  const totalKeys = keys.length;
  let lastError = null;

  // Attempt requests starting from the last working key index
  for (let attempt = 0; attempt < totalKeys; attempt++) {
    const currentIndex = (lastWorkingIndex + attempt) % totalKeys;
    const key = keys[currentIndex];

    // Skip if on cooldown
    if (isKeyOnCooldown(key)) {
      continue;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key, // Header-based auth (never in URL)
        },
        body: serializedBody,
        signal: options.signal,
      });

      // ─── 2xx Success ──────────────────────────────────────────────────────────
      if (response.ok) {
        lastWorkingIndex = currentIndex; // Update last working pointer
        const result = await response.json();
        return result;
      }

      const status = response.status;
      const errText = await response.text();

      // ─── 429, 500, 503: Cooldown & Failover ──────────────────────────────────
      if (status === 429 || status === 500 || status === 503) {
        console.warn(
          `[GeminiClient] Key #${currentIndex + 1} (${maskKey(key)}) encountered HTTP ${status}. Placing on 60s cooldown and rotating...`
        );
        setKeyCooldown(key, 60000);
        lastError = new Error(`HTTP ${status}: ${errText}`);
        continue; // Retry with next available key
      }

      // ─── 403: Check for Quota / Permission vs Forbidden ──────────────────────
      if (status === 403) {
        const errLower = errText.toLowerCase();
        const isQuotaOrLimit =
          errLower.includes('quota') ||
          errLower.includes('resource_exhausted') ||
          errLower.includes('rate') ||
          errLower.includes('limit') ||
          errLower.includes('exhausted');

        if (isQuotaOrLimit) {
          console.warn(
            `[GeminiClient] Key #${currentIndex + 1} (${maskKey(key)}) hit quota limit (HTTP 403). Placing on 60s cooldown and rotating...`
          );
          setKeyCooldown(key, 60000);
          lastError = new Error(`HTTP 403 Quota: ${errText}`);
          continue; // Retry with next available key
        }

        // Real permission/forbidden error: do not rotate, throw real error
        throw new Error(`Gemini API error (403): ${errText}`);
      }

      // ─── 400, 401: Client Bug / Invalid Format - Do NOT rotate ───────────────
      if (status === 400 || status === 401) {
        throw new Error(`Gemini API error (${status}): ${errText}`);
      }

      // ─── Other 5xx Server Errors: Failover ────────────────────────────────────
      if (status >= 500) {
        console.warn(
          `[GeminiClient] Key #${currentIndex + 1} (${maskKey(key)}) encountered server error (${status}). Placing on 60s cooldown and rotating...`
        );
        setKeyCooldown(key, 60000);
        lastError = new Error(`HTTP ${status}: ${errText}`);
        continue;
      }

      // Any other unexpected status code
      throw new Error(`Gemini API error (${status}): ${errText}`);
    } catch (err) {
      // If error was thrown intentionally (400, 401, non-quota 403, or abort), re-throw immediately
      if (
        err.name === 'AbortError' ||
        (err.message && err.message.startsWith('Gemini API error'))
      ) {
        throw err;
      }

      // Network-level error (timeout, connection reset)
      console.warn(
        `[GeminiClient] Key #${currentIndex + 1} (${maskKey(key)}) network error: ${err.message}. Rotating...`
      );
      setKeyCooldown(key, 60000);
      lastError = err;
    }
  }

  // If loop exhausted and no key succeeded
  console.error('[GeminiClient] All configured Gemini API keys failed or are on cooldown.');
  throw new Error('All Gemini keys are rate-limited');
}

export default callGemini;
