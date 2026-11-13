/**
 * tests/testGrokClient.js
 * 
 * Unit tests for Grok 4-key rotation, failover, cooldown, and token limit handling.
 */

const assert = require('assert');

// Mock environment variables with 4 Grok keys
process.env.EXPO_PUBLIC_GROK_API_KEY_1 = 'xai-key1-aaaa-1111';
process.env.EXPO_PUBLIC_GROK_API_KEY_2 = 'xai-key2-bbbb-2222';
process.env.EXPO_PUBLIC_GROK_API_KEY_3 = 'xai-key3-cccc-3333';
process.env.EXPO_PUBLIC_GROK_API_KEY_4 = 'xai-key4-dddd-4444';
process.env.EXPO_PUBLIC_GROK_MODEL = 'grok-2-latest';

const {
  getGrokApiKeys,
  getGrokModel,
  maskGrokKey,
  callGrok,
  getGrokKeyPoolStatus,
  resetGrokKeyCooldowns,
} = require('../services/grokClient');

async function runTests() {
  console.log('🧪 Starting Grok 4-Key Client Unit Tests...\n');

  // Test 1: Key Loading
  console.log('Test 1: Key Loading of all 4 keys...');
  const keys = getGrokApiKeys();
  assert.strictEqual(keys.length, 4, 'Should load all 4 Grok keys');
  console.log('  Passed: 4 Grok keys loaded successfully.');

  // Test 2: Masking
  console.log('Test 2: Key Masking prevents secret leakage...');
  const masked = maskGrokKey(keys[0]);
  assert.strictEqual(masked, '...1111', 'Should only display last 4 characters');
  console.log('  Passed: Keys masked correctly.');

  // Test 3: Rotation on HTTP 429 (Token Limit / Rate Limit)
  console.log('Test 3: Failover on HTTP 429 (Token Limit)...');
  resetGrokKeyCooldowns();
  let callCount = 0;
  const usedKeys = [];

  global.fetch = async (url, options) => {
    callCount++;
    const authHeader = options.headers['Authorization'];
    const key = authHeader.replace('Bearer ', '');
    usedKeys.push(key);

    // Key 1 hits 429 token limit
    if (key.includes('1111')) {
      return {
        status: 429,
        ok: false,
        text: async () => 'Rate limit exceeded: Token quota reached',
      };
    }

    // Key 2 succeeds
    return {
      status: 200,
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"status":"ok"}' } }],
      }),
    };
  };

  const res = await callGrok([{ role: 'user', content: 'test' }]);
  assert(res.choices, 'Should return valid choices');
  assert.strictEqual(usedKeys[0], 'xai-key1-aaaa-1111', 'First attempt used Key 1');
  assert.strictEqual(usedKeys[1], 'xai-key2-bbbb-2222', 'Rotated to Key 2 after 429');
  console.log('  Passed: Automatically rotated from Key 1 to Key 2 on 429 Token Limit.');

  // Test 4: Memory of Last Working Key
  console.log('Test 4: Subsequent call starts directly with last working key (Key 2)...');
  usedKeys.length = 0;
  await callGrok([{ role: 'user', content: 'test2' }]);
  assert.strictEqual(usedKeys[0], 'xai-key2-bbbb-2222', 'Should start with Key 2 without retrying Key 1');
  console.log('  Passed: Remembered Key 2 as working key.');

  // Test 5: All 4 keys rate limited error
  console.log('Test 5: Clear error message when all 4 keys are exhausted...');
  resetGrokKeyCooldowns();
  global.fetch = async () => ({
    status: 429,
    ok: false,
    text: async () => 'Quota exceeded',
  });

  try {
    await callGrok([{ role: 'user', content: 'test3' }]);
    assert.fail('Should have thrown error when all keys are exhausted');
  } catch (err) {
    assert(err.message.includes('All configured Grok API keys are currently rate-limited'), 'Should throw all-keys rate-limited error');
    console.log('  Passed: Throws clear all-keys exhausted message.');
  }

  console.log('\n🎉 ALL 5 GROK CLIENT TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
