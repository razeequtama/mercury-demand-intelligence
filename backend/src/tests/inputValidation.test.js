import test from 'node:test';
import assert from 'node:assert';
import app from '../server.js';

test('Input Validation: /api/simulate-order rejects excessive quantity exceeding MAX_ORDER_QUANTITY with HTTP 400', async () => {
  const server = app.listen(0);
  const port = server.address().port;
  const testSessionId = '00000000-0000-0000-0000-000000000001';

  try {
    // 1. Test overflow quantity: 99999999
    const overflowRes = await fetch(`http://127.0.0.1:${port}/api/simulate-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': testSessionId
      },
      body: JSON.stringify({ productId: 1, quantity: 99999999 })
    });

    assert.strictEqual(overflowRes.status, 400, 'Expected HTTP 400 for excessive quantity');
    const overflowBody = await overflowRes.json();
    assert.strictEqual(overflowBody.success, false);
    assert.strictEqual(overflowBody.error, 'Invalid quantity. Must be an integer between 1 and 1000.');

    // 2. Test boundary quantity: 1001
    const boundaryRes = await fetch(`http://127.0.0.1:${port}/api/simulate-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': testSessionId
      },
      body: JSON.stringify({ productId: 1, quantity: 1001 })
    });
    assert.strictEqual(boundaryRes.status, 400);

    // 3. Test negative / zero quantity
    const zeroRes = await fetch(`http://127.0.0.1:${port}/api/simulate-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': testSessionId
      },
      body: JSON.stringify({ productId: 1, quantity: 0 })
    });
    assert.strictEqual(zeroRes.status, 400);

    // 4. Test float quantity
    const floatRes = await fetch(`http://127.0.0.1:${port}/api/simulate-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': testSessionId
      },
      body: JSON.stringify({ productId: 1, quantity: 5.5 })
    });
    assert.strictEqual(floatRes.status, 400);

    // 5. Test invalid productId out of integer bounds
    const invalidProdRes = await fetch(`http://127.0.0.1:${port}/api/simulate-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': testSessionId
      },
      body: JSON.stringify({ productId: 9999999999999, quantity: 5 })
    });
    assert.strictEqual(invalidProdRes.status, 400);

  } finally {
    server.close();
  }
});

test('Inventory Check: /api/simulate-order rejects order when requested quantity exceeds available stock', async () => {
  const server = app.listen(0);
  const port = server.address().port;
  const testSessionId = '00000000-0000-0000-0000-000000000002';

  try {
    // Attempt to order 900 units when product 1 has only ~45 units in stock
    const res = await fetch(`http://127.0.0.1:${port}/api/simulate-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': testSessionId
      },
      body: JSON.stringify({ productId: 1, quantity: 900 })
    });

    assert.strictEqual(res.status, 400, 'Expected HTTP 400 for insufficient stock');
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.ok(body.error.includes('Insufficient stock available'), `Unexpected error message: ${body.error}`);

    // Verify database state: no order was inserted for this session
    const { query } = await import('../db.js');
    const orderCheck = await query(
      'SELECT id FROM orders WHERE session_id = $1',
      [testSessionId]
    );
    assert.strictEqual(orderCheck.rows.length, 0, 'No order record should be inserted on stockout');

    // Clean up test session records
    await query('DELETE FROM inventory WHERE session_id = $1', [testSessionId]);
  } finally {
    server.close();
  }
});

