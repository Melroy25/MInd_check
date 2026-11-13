/**
 * tests/testGeminiClient.js
 * 
 * Comprehensive Unit Test Suite for Gemini API Key Rotation & Failover Client
 */

// Mock process.env with 3 sample keys for testing
process.env.EXPO_PUBLIC_GEMINI_API_KEY_1 = 'AIzaSyA_TEST_KEY_ALPHA_1111';
process.env.EXPO_PUBLIC_GEMINI_API_KEY_2 = 'AIzaSyB_TEST_KEY_BRAVO_2222';
process.env.EXPO_PUBLIC_GEMINI_API_KEY_3 = 'AIzaSyC_TEST_KEY_CHARLIE_3333';
process.env.EXPO_PUBLIC_GEMINI_API_KEY_4 = ''; // Empty placeholder
delete process.env.EXPO_PUBLIC_GEMINI_API_KEY_5; // Undefined placeholder
process.env.EXPO_PUBLIC_GEMINI_MODEL = 'gemini-3.1-flash-lite';

const assert = require('assert');

// Simple test runner
let testsPassed = 0;

async function runTests() {
  console.log('🧪 Starting Gemini Client Unit Tests...\n');

  const {
    callGemini,
    getGeminiApiKeys,
    getGeminiModel,
    maskKey,
    resetKeyCooldowns,
    getKeyPoolStatus,
  } = require('../services/geminiClient.js');

  // ─── TEST 1: Key Loading & Filtering ──────────────────────────────────────────
  console.log('Test 1: Key Loading & Filtering of empty/undefined keys...');
  const keys = getGeminiApiKeys();
  assert.strictEqual(keys.length, 3, 'Should load exactly 3 non-empty keys');
  assert.strictEqual(keys[0], 'AIzaSyA_TEST_KEY_ALPHA_1111');
  assert.strictEqual(keys[1], 'AIzaSyB_TEST_KEY_BRAVO_2222');
  assert.strictEqual(keys[2], 'AIzaSyC_TEST_KEY_CHARLIE_3333');
  console.log('  Passed: 3 keys loaded, empty/undefined keys filtered out.\n');
  testsPassed++;

  // ─── TEST 2: Key Masking (Safe Logging) ──────────────────────────────────────
  console.log('Test 2: Key Masking prevents leakage of full secrets...');
  assert.strictEqual(maskKey('AIzaSyA_TEST_KEY_ALPHA_1111'), '...1111');
  assert.strictEqual(maskKey('AIzaSyB_TEST_KEY_BRAVO_2222'), '...2222');
  assert.strictEqual(maskKey(null), '...????');
  console.log('  Passed: Keys properly masked with only last 4 characters.\n');
  testsPassed++;

  // ─── TEST 3: Header-Based Authentication (x-goog-api-key) ───────────────────
  console.log('Test 3: Verification that API key is sent via header and NEVER in URL...');
  const originalFetch = global.fetch;
  let capturedUrl = null;
  let capturedHeaders = null;

  global.fetch = async (url, options) => {
    capturedUrl = url;
    capturedHeaders = options.headers;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: '{"status":"ok"}' }] } }],
      }),
    };
  };

  resetKeyCooldowns();
  const resSuccess = await callGemini({ contents: [] });
  assert.strictEqual(resSuccess.candidates[0].content.parts[0].text, '{"status":"ok"}');
  assert(capturedUrl.includes('generateContent'), 'URL points to generateContent');
  assert(!capturedUrl.includes('key='), 'API key MUST NOT be present in URL query params');
  assert.strictEqual(capturedHeaders['x-goog-api-key'], 'AIzaSyA_TEST_KEY_ALPHA_1111', 'Key sent in x-goog-api-key header');
  console.log('  Passed: API key sent strictly in x-goog-api-key header, not in URL.\n');
  testsPassed++;

  // ─── TEST 4: Automatic Failover on HTTP 429 (Rate Limit) ─────────────────────
  console.log('Test 4: Failover on HTTP 429 with 60-second cooldown...');
  resetKeyCooldowns();
  const callAttempts = [];

  global.fetch = async (url, options) => {
    const key = options.headers['x-goog-api-key'];
    callAttempts.push(key);

    if (key === 'AIzaSyA_TEST_KEY_ALPHA_1111') {
      // Simulate Rate Limit on Key 1
      return {
        ok: false,
        status: 429,
        text: async () => 'RESOURCE_EXHAUSTED: Rate limit exceeded',
      };
    }

    // Key 2 succeeds
    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Success from Key 2' }] } }],
      }),
    };
  };

  const failoverRes = await callGemini({ contents: [] });
  assert.strictEqual(failoverRes.candidates[0].content.parts[0].text, 'Success from Key 2');
  assert.strictEqual(callAttempts.length, 2, 'Should have made 2 attempts');
  assert.strictEqual(callAttempts[0], 'AIzaSyA_TEST_KEY_ALPHA_1111', 'Attempt 1 used Key 1');
  assert.strictEqual(callAttempts[1], 'AIzaSyB_TEST_KEY_BRAVO_2222', 'Attempt 2 used Key 2');

  const poolStatus = getKeyPoolStatus();
  assert.strictEqual(poolStatus[0].onCooldown, true, 'Key 1 should be marked on cooldown');
  assert.strictEqual(poolStatus[1].onCooldown, false, 'Key 2 should be active');
  assert.strictEqual(poolStatus[1].isLastWorking, true, 'Key 2 should be recorded as last working');
  console.log('  Passed: Key 1 rotated to Key 2 on 429, Key 1 placed on cooldown.\n');
  testsPassed++;

  // ─── TEST 5: Subsequent Call Starts with Last Working Key ────────────────────
  console.log('Test 5: Subsequent call starts directly with last working key (Key 2)...');
  callAttempts.length = 0;
  await callGemini({ contents: [] });
  assert.strictEqual(callAttempts.length, 1, 'Should directly succeed in 1 attempt');
  assert.strictEqual(callAttempts[0], 'AIzaSyB_TEST_KEY_BRAVO_2222', 'Directly used Key 2 without re-trying Key 1');
  console.log('  Passed: Starts with last working key, skipping key on cooldown.\n');
  testsPassed++;

  // ─── TEST 6: Failover on HTTP 500 / 503 ──────────────────────────────────────
  console.log('Test 6: Failover on HTTP 503 Service Unavailable...');
  global.fetch = async (url, options) => {
    const key = options.headers['x-goog-api-key'];
    callAttempts.push(key);
    if (key === 'AIzaSyB_TEST_KEY_BRAVO_2222') {
      return { ok: false, status: 503, text: async () => 'Service Unavailable' };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Success from Key 3' }] } }],
      }),
    };
  };

  callAttempts.length = 0;
  const res503 = await callGemini({ contents: [] });
  assert.strictEqual(res503.candidates[0].content.parts[0].text, 'Success from Key 3');
  assert.strictEqual(callAttempts[0], 'AIzaSyB_TEST_KEY_BRAVO_2222');
  assert.strictEqual(callAttempts[1], 'AIzaSyC_TEST_KEY_CHARLIE_3333');
  console.log('  Passed: Successfully failed over from Key 2 to Key 3 on HTTP 503.\n');
  testsPassed++;

  // ─── TEST 7: Immediate Throw on Client Errors (400, 401) Without Rotating ───
  console.log('Test 7: Client errors (400 / 401) throw immediately without rotating...');
  resetKeyCooldowns();
  callAttempts.length = 0;

  global.fetch = async (url, options) => {
    callAttempts.push(options.headers['x-goog-api-key']);
    return {
      ok: false,
      status: 400,
      text: async () => 'Bad Request: invalid schema parameter',
    };
  };

  let threw400 = false;
  try {
    await callGemini({ contents: [] });
  } catch (err) {
    threw400 = true;
    assert(err.message.includes('400'), 'Error message contains 400');
  }
  assert.strictEqual(threw400, true, 'Must throw on 400');
  assert.strictEqual(callAttempts.length, 1, 'Must NOT rotate to other keys on 400 error');
  console.log('  Passed: 400 throws immediately without rotating keys.\n');
  testsPassed++;

  // ─── TEST 8: All Keys Rate-Limited ───────────────────────────────────────────
  console.log('Test 8: Error message when all keys are rate-limited...');
  global.fetch = async (url, options) => {
    return {
      ok: false,
      status: 429,
      text: async () => 'Quota exceeded',
    };
  };

  let threwAllRateLimited = false;
  try {
    await callGemini({ contents: [] });
  } catch (err) {
    threwAllRateLimited = true;
    assert.strictEqual(err.message, 'All Gemini keys are rate-limited');
  }
  assert.strictEqual(threwAllRateLimited, true, 'Throws "All Gemini keys are rate-limited"');
  console.log('  Passed: Clear error "All Gemini keys are rate-limited" thrown.\n');
  testsPassed++;

  // Restore global.fetch
  global.fetch = originalFetch;

  console.log(`\n🎉 ALL ${testsPassed} TESTS PASSED SUCCESSFULLY!`);
}

runTests().catch((err) => {
  console.error('\n❌ Test failure:', err);
  process.exit(1);
});
