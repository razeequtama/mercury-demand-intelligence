import test from 'node:test';
import assert from 'node:assert';
import { intelligenceCache } from '../utils/cache.js';
import { mlInferenceLimiter } from '../middleware/rateLimiter.js';

test('MemoryCache: Stores, retrieves, and invalidates cached data', () => {
  const testKey = 'test_cache_key';
  const testData = { success: true, count: 42 };

  intelligenceCache.set(testKey, testData, 1000);
  const retrieved = intelligenceCache.get(testKey);
  assert.deepStrictEqual(retrieved, testData, 'Cache should return stored data');

  intelligenceCache.delete(testKey);
  const afterDelete = intelligenceCache.get(testKey);
  assert.strictEqual(afterDelete, null, 'Cache entry should be null after delete');
});

test('Rate limiting: Enforces limits and rejects excessive requests with HTTP 429', async () => {
  let statusResult = null;
  let jsonResult = null;
  const mockIp = '10.0.0.42';

  for (let i = 0; i < 65; i++) {
    statusResult = null;
    jsonResult = null;

    await new Promise((resolve) => {
      let resolved = false;
      const safeResolve = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      const mockReq = {
        ip: mockIp,
        headers: {},
        app: { get: () => false }
      };

      const mockRes = {
        statusCode: 200,
        setHeader: () => {},
        getHeader: () => undefined,
        status(code) {
          statusResult = code;
          this.statusCode = code;
          return this;
        },
        send(data) {
          jsonResult = data;
          safeResolve();
          return this;
        },
        json(data) {
          jsonResult = data;
          safeResolve();
          return this;
        }
      };

      mlInferenceLimiter(mockReq, mockRes, () => {
        safeResolve();
      });
    });

    if (statusResult === 429) {
      break;
    }
  }

  assert.strictEqual(statusResult, 429, 'Expected HTTP 429 Too Many Requests when exceeding rate limit');
  assert.strictEqual(jsonResult?.success, false);
});

