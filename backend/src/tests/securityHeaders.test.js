import test from 'node:test';
import assert from 'node:assert';
import app from '../server.js';

test('Security Headers: Express emits hardened security headers via helmet', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`, {
      method: 'GET'
    });

    assert.strictEqual(res.status, 200);

    // 1. Verify MIME-sniffing protection
    const nosniff = res.headers.get('x-content-type-options');
    assert.strictEqual(nosniff, 'nosniff', 'Missing or invalid X-Content-Type-Options header');

    // 2. Verify Frame embedding protection (clickjacking)
    const frameOptions = res.headers.get('x-frame-options');
    assert.ok(
      frameOptions === 'SAMEORIGIN' || frameOptions === 'DENY',
      `Unexpected X-Frame-Options header: ${frameOptions}`
    );

    // 3. Verify DNS prefetch control
    const dnsPrefetch = res.headers.get('x-dns-prefetch-control');
    assert.strictEqual(dnsPrefetch, 'off', 'Missing or invalid X-DNS-Prefetch-Control header');

    // 4. Verify Cross-Origin-Resource-Policy allows frontend consumption
    const corp = res.headers.get('cross-origin-resource-policy');
    assert.strictEqual(corp, 'cross-origin', 'Expected CORP to be cross-origin for API gateway');

    // 5. Verify HSTS header
    const hsts = res.headers.get('strict-transport-security');
    assert.ok(hsts && hsts.includes('max-age'), 'Missing or invalid Strict-Transport-Security header');

  } finally {
    server.close();
  }
});

