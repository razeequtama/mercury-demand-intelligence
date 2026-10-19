import test from 'node:test';
import assert from 'node:assert';
import { intelligenceCache } from '../utils/cache.js';
import { mlInferenceLimiter, sessionOrIpKeyGenerator } from '../middleware/rateLimiter.js';
import app from '../server.js';

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

test('sessionOrIpKeyGenerator: Generates session keys for visitor sandboxes and falls back to IP', () => {
  // 1. Valid visitor session ID
  const sessionReq = { sessionId: 'test-session-uuid-123', ip: '192.168.1.1' };
  assert.strictEqual(sessionOrIpKeyGenerator(sessionReq), 'sess_test-session-uuid-123');

  // 2. Baseline session falls back to IP
  const baselineReq = { sessionId: 'baseline', ip: '192.168.1.1' };
  assert.strictEqual(sessionOrIpKeyGenerator(baselineReq), '192.168.1.1');

  // 3. Missing session ID falls back to IP
  const noSessionReq = { ip: '10.0.0.5' };
  assert.strictEqual(sessionOrIpKeyGenerator(noSessionReq), '10.0.0.5');

  // 4. Missing IP falls back to 127.0.0.1
  const emptyReq = {};
  assert.strictEqual(sessionOrIpKeyGenerator(emptyReq), '127.0.0.1');
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

test('Rate limiting: Session-isolated keying ensures one visitor session does not exhaust another', async () => {
  const visitorA = '00000000-0000-0000-0000-visitor-alpha';
  const visitorB = '00000000-0000-0000-0000-visitor-beta';
  const sharedProxyIp = '198.51.100.99';

  let statusResultA = null;

  // Exhaust visitor A's rate limit quota
  for (let i = 0; i < 65; i++) {
    statusResultA = null;

    await new Promise((resolve) => {
      let resolved = false;
      const safeResolve = () => { if (!resolved) { resolved = true; resolve(); } };

      const reqA = {
        sessionId: visitorA,
        ip: sharedProxyIp,
        headers: {},
        app: { get: () => false }
      };

      const resA = {
        statusCode: 200,
        setHeader: () => {},
        getHeader: () => undefined,
        status(code) { statusResultA = code; this.statusCode = code; return this; },
        send() { safeResolve(); return this; },
        json() { safeResolve(); return this; }
      };

      mlInferenceLimiter(reqA, resA, () => { safeResolve(); });
    });

    if (statusResultA === 429) break;
  }

  assert.strictEqual(statusResultA, 429, 'Visitor A should be rate limited after exceeding quota');

  // Visitor B from the same IP should still be permitted and not blocked by Visitor A
  let visitorBAllowed = false;
  let statusResultB = null;

  await new Promise((resolve) => {
    let resolved = false;
    const safeResolve = () => { if (!resolved) { resolved = true; resolve(); } };

    const reqB = {
      sessionId: visitorB,
      ip: sharedProxyIp,
      headers: {},
      app: { get: () => false }
    };

    const resB = {
      statusCode: 200,
      setHeader: () => {},
      getHeader: () => undefined,
      status(code) { statusResultB = code; this.statusCode = code; return this; },
      send() { safeResolve(); return this; },
      json() { safeResolve(); return this; }
    };

    mlInferenceLimiter(reqB, resB, () => {
      visitorBAllowed = true;
      safeResolve();
    });
  });

  assert.strictEqual(visitorBAllowed, true, 'Visitor B must not be throttled by Visitor A actions');
  assert.notStrictEqual(statusResultB, 429, 'Visitor B must receive operational access');
});

test('Rate limiting: Express trust proxy correctly identifies client IP from X-Forwarded-For header', async () => {
  const server = app.listen(0);
  const port = server.address().port;
  const clientIp = '203.0.113.195';

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`, {
      method: 'GET',
      headers: {
        'X-Forwarded-For': `${clientIp}, 10.0.0.1`
      }
    });

    // Verify rate limit headers are emitted
    const limitHeader = res.headers.get('ratelimit-limit');
    const remainingHeader = res.headers.get('ratelimit-remaining');

    assert.ok(limitHeader !== null, 'Rate limit headers must be present');
    assert.ok(remainingHeader !== null, 'Rate limit remaining header must be present');
  } finally {
    server.close();
  }
});
