import test from 'node:test';
import assert from 'node:assert';
import app from '../server.js';

test('CORS Policy: Authorized origin receives explicit Access-Control-Allow-Origin header (never wildcard)', async () => {
  const server = app.listen(0);
  const port = server.address().port;
  const authorizedOrigin = 'http://localhost:3000';

  try {
    // 1. Test OPTIONS preflight request
    const preflightRes = await fetch(`http://127.0.0.1:${port}/api/intelligence`, {
      method: 'OPTIONS',
      headers: {
        'Origin': authorizedOrigin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type,x-session-id'
      }
    });

    const allowOrigin = preflightRes.headers.get('access-control-allow-origin');
    const allowCredentials = preflightRes.headers.get('access-control-allow-credentials');

    assert.strictEqual(
      allowOrigin,
      authorizedOrigin,
      `Expected Access-Control-Allow-Origin to be '${authorizedOrigin}', got '${allowOrigin}'`
    );
    assert.notStrictEqual(allowOrigin, '*', 'Access-Control-Allow-Origin MUST NOT be wildcard "*"');
    assert.strictEqual(allowCredentials, 'true', 'Expected Access-Control-Allow-Credentials to be true');

    // 2. Test actual GET request with Origin header
    const getRes = await fetch(`http://127.0.0.1:${port}/api/health`, {
      method: 'GET',
      headers: {
        'Origin': authorizedOrigin
      }
    });

    assert.strictEqual(
      getRes.headers.get('access-control-allow-origin'),
      authorizedOrigin,
      'GET response must reflect authorized origin'
    );
  } finally {
    server.close();
  }
});

test('CORS Policy: Unauthorized origin is rejected and denied Access-Control-Allow-Origin', async () => {
  const server = app.listen(0);
  const port = server.address().port;
  const unauthorizedOrigin = 'http://unauthorized-malicious-domain.com';

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`, {
      method: 'GET',
      headers: {
        'Origin': unauthorizedOrigin
      }
    });

    // When an origin is rejected by CORS, it must either return 403 or omit Access-Control-Allow-Origin
    const allowOrigin = res.headers.get('access-control-allow-origin');
    assert.notStrictEqual(
      allowOrigin,
      unauthorizedOrigin,
      'Unauthorized origin must NOT be granted Access-Control-Allow-Origin'
    );
    assert.notStrictEqual(
      allowOrigin,
      '*',
      'Wildcard origin must NOT be granted to unauthorized requests'
    );

    if (res.status === 403) {
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.ok(body.error.includes('CORS'));
    }
  } finally {
    server.close();
  }
});

test('CORS Policy: Non-browser requests without Origin header (curl, backend-to-backend) pass cleanly', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`, {
      method: 'GET'
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'healthy');
  } finally {
    server.close();
  }
});

