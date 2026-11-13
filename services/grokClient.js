/**
 * services/grokClient.js
 * 
 * Production Grok (xAI) API Client with Automatic 4-Key Rotation & Token Limit Failover.
 * 
 * Features:
 * 1. Supports 1 to 4 Grok API keys loaded from literal EXPO_PUBLIC_GROK_API_KEY_1..4.
 * 2. Automatic key rotation and 60-second cooldown on HTTP 429 (Rate / Token limit exceeded).
 * 3. Immediate failover to the next available key without failing user requests.
 * 4. Remembers the last working key to eliminate failover latency.
 * 5. Masks API keys in logs (only last 4 characters shown).
 * 6. OpenAI-compatible endpoint: https://api.x.ai/v1/chat/completions with JSON mode support.
 */

let lastWorkingGrokIndex = 0;
const grokCooldownMap = new Map(); // key -> cooldownExpiryTimestamp (ms)

/**
 * Explicitly load all configured Grok API keys.
 * Note: Uses literal process.env references so Expo Metro inlines them at bundle time.
 */
export function getGrokApiKeys() {
  const rawKeys = [
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_GROK_API_KEY_1 : undefined,
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_GROK_API_KEY_2 : undefined,
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_GROK_API_KEY_3 : undefined,
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_GROK_API_KEY_4 : undefined,
    // Fallback single keys
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_GROK_API_KEY : undefined,
    typeof process !== 'undefined' ? process.env?.GROK_API_KEY : undefined,
  ];

  const validKeys = rawKeys
    .map((k) => (typeof k === 'string' ? k.trim() : ''))
    .filter((k) => k.length > 0);

  return Array.from(new Set(validKeys));
}

/**
 * Retrieve the active Grok model name
 */
export function getGrokModel() {
  if (typeof process !== 'undefined') {
    return (
      process.env?.EXPO_PUBLIC_GROK_MODEL ||
      process.env?.GROK_MODEL ||
      'grok-2-latest'
    );
  }
  return 'grok-2-latest';
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
 * Execute Grok Chat Completion with automatic multi-key rotation and token limit failover.
 * 
 * @param {Array} messages OpenAI-compatible messages array: [{ role: 'system'|'user', content: ... }]
 * @param {Object} options Optional config: model, temperature, response_format
 */
export async function callGrok(messages, options = {}) {
  const keys = getGrokApiKeys();
  if (keys.length === 0) {
    throw new Error('No Grok API keys found. Please define EXPO_PUBLIC_GROK_API_KEY_1 in .env.local.');
  }

  const model = options.model || getGrokModel();
  const totalKeys = keys.length;
  let attempts = 0;
  let currentIndex = lastWorkingGrokIndex % totalKeys;

  while (attempts < totalKeys) {
    const currentKey = keys[currentIndex];

    // If key is on cooldown, check next key
    if (isGrokKeyOnCooldown(currentKey)) {
      currentIndex = (currentIndex + 1) % totalKeys;
      attempts++;
      continue;
    }

    try {
      const payload = {
        model,
        messages,
        temperature: options.temperature !== undefined ? options.temperature : 0.0,
        response_format: options.response_format || { type: 'json_object' },
      };

      const response = await fetch('https://api.x.ai/v1/chat/completions', {
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
          `[GrokClient] Key #${currentIndex + 1} (${maskGrokKey(currentKey)}) hit status ${response.status} (Rate/Token Limit). Placing on 60s cooldown and rotating...`
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
          console.warn(`[GrokClient] Key #${currentIndex + 1} quota exhausted. Rotating...`);
          setGrokKeyCooldown(currentKey, 60000);
          currentIndex = (currentIndex + 1) % totalKeys;
          attempts++;
          continue;
        }
        throw new Error(`Grok API Forbidden (403): ${errorBody}`);
      }

      // Handle Client Errors (400, 401) immediately without rotating valid keys
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          console.warn(`[GrokClient] Key #${currentIndex + 1} invalid (401). Rotating...`);
          setGrokKeyCooldown(currentKey, 3600000); // 1 hour cooldown for invalid key
          currentIndex = (currentIndex + 1) % totalKeys;
          attempts++;
          continue;
        }
        throw new Error(`Grok API Error (${response.status}): ${errorText}`);
      }

      const json = await response.json();
      lastWorkingGrokIndex = currentIndex; // Remember working key
      return json;

    } catch (err) {
      if (err.message && err.message.includes('Grok API Error (400)')) {
        throw err;
      }
      console.warn(`[GrokClient] Network exception on key #${currentIndex + 1} (${maskGrokKey(currentKey)}):`, err.message);
      setGrokKeyCooldown(currentKey, 30000);
      currentIndex = (currentIndex + 1) % totalKeys;
      attempts++;
    }
  }

  throw new Error('All configured Grok API keys are currently rate-limited or exhausted. Please try again shortly.');
}
