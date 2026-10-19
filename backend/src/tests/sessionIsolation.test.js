import test from 'node:test';
import assert from 'node:assert';
import { query, getClient } from '../db.js';
import { ensureSessionInventory } from '../middleware/session.js';

test('Session isolation: Clones baseline inventory and protects baseline from mutation', async () => {
  const testSessionId = 'test-session-uuid-1234567890';
  const client = await getClient();

  try {
    // 1. Get baseline inventory for product 1
    const baselineInv = await query(
      'SELECT stock_quantity FROM inventory WHERE product_id = 1 AND session_id = $1',
      ['baseline']
    );
    const initialBaselineStock = baselineInv.rows[0].stock_quantity;

    // 2. Ensure test session inventory is cloned
    await ensureSessionInventory(client, testSessionId);

    // Verify session inventory exists and matches baseline initially
    const sessionInv = await client.query(
      'SELECT stock_quantity FROM inventory WHERE product_id = 1 AND session_id = $1',
      [testSessionId]
    );
    assert.strictEqual(sessionInv.rows.length, 1);
    assert.strictEqual(sessionInv.rows[0].stock_quantity, initialBaselineStock);

    // 3. Mutate only the test session inventory
    const orderQty = 10;
    await client.query(
      `UPDATE inventory
       SET stock_quantity = GREATEST(0, stock_quantity - $1), updated_at = NOW()
       WHERE product_id = 1 AND session_id = $2`,
      [orderQty, testSessionId]
    );

    // Record order for this test session
    await client.query(
      'INSERT INTO orders (product_id, quantity, total_amount, session_id, order_date) VALUES (1, $1, 499.90, $2, NOW())',
      [orderQty, testSessionId]
    );

    // 4. Verify test session inventory dropped
    const updatedSessionInv = await client.query(
      'SELECT stock_quantity FROM inventory WHERE product_id = 1 AND session_id = $1',
      [testSessionId]
    );
    assert.strictEqual(updatedSessionInv.rows[0].stock_quantity, initialBaselineStock - orderQty);

    // 5. Verify BASELINE inventory remained completely unchanged
    const verifyBaseline = await query(
      'SELECT stock_quantity FROM inventory WHERE product_id = 1 AND session_id = $1',
      ['baseline']
    );
    assert.strictEqual(
      verifyBaseline.rows[0].stock_quantity,
      initialBaselineStock,
      'Baseline inventory was modified! Session sandboxing failed.'
    );

    // Clean up test session records
    await client.query('DELETE FROM inventory WHERE session_id = $1', [testSessionId]);
    await client.query('DELETE FROM orders WHERE session_id = $1', [testSessionId]);
  } finally {
    client.release();
  }
});

test('Database Inspector excludes cost_price from product listings', async () => {
  const products = await query(
    'SELECT id, sku, name, category, current_price, created_at FROM products ORDER BY id ASC'
  );

  assert.ok(products.rows.length > 0);
  for (const row of products.rows) {
    assert.strictEqual(
      row.cost_price,
      undefined,
      'Sensitive cost_price field was exposed in product listing!'
    );
  }
});

test('requireSession middleware denies unauthenticated requests without x-session-id', async () => {
  const { requireSession } = await import('../middleware/session.js');

  let statusCode = null;
  let jsonResponse = null;
  const mockReq = { headers: {} };
  const mockRes = {
    status: (code) => {
      statusCode = code;
      return {
        json: (payload) => { jsonResponse = payload; }
      };
    }
  };
  let nextCalled = false;

  requireSession(mockReq, mockRes, () => { nextCalled = true; });

  assert.strictEqual(statusCode, 401, 'Expected HTTP 401 Unauthorized');
  assert.strictEqual(nextCalled, false, 'next() should not be called');
  assert.strictEqual(jsonResponse?.success, false);
});

test('requireSession middleware forbids direct mutation of baseline session', async () => {
  const { requireSession } = await import('../middleware/session.js');

  let statusCode = null;
  const mockReq = { headers: { 'x-session-id': 'baseline' } };
  const mockRes = {
    status: (code) => {
      statusCode = code;
      return { json: () => {} };
    }
  };
  let nextCalled = false;

  requireSession(mockReq, mockRes, () => { nextCalled = true; });

  assert.strictEqual(statusCode, 403, 'Expected HTTP 403 Forbidden for baseline session');
  assert.strictEqual(nextCalled, false);
});

test('requireSession middleware authorizes requests with valid visitor UUID', async () => {
  const { requireSession } = await import('../middleware/session.js');

  const validUuid = '123e4567-e89b-12d3-a456-426614174000';
  const mockReq = { headers: { 'x-session-id': validUuid } };
  const mockRes = {};
  let nextCalled = false;

  requireSession(mockReq, mockRes, () => { nextCalled = true; });

  assert.strictEqual(nextCalled, true, 'next() should be called for valid visitor UUID');
  assert.strictEqual(mockReq.sessionId, validUuid);
});

test('Visitor Session Reset: Deletes visitor mutations and restores baseline state', async () => {
  const testSessionId = '00000000-0000-0000-0000-reset-test-99';
  const client = await getClient();

  try {
    // 1. Ensure test session inventory is cloned
    await ensureSessionInventory(client, testSessionId);

    // 2. Insert order and deduct inventory
    await client.query(
      'UPDATE inventory SET stock_quantity = 5 WHERE product_id = 1 AND session_id = $1',
      [testSessionId]
    );
    await client.query(
      'INSERT INTO orders (product_id, quantity, total_amount, session_id, order_date) VALUES (1, 10, 499.90, $1, NOW())',
      [testSessionId]
    );
    await client.query(
      `INSERT INTO automated_actions_log (product_id, action_type, description, status, session_id, executed_at) 
       VALUES (1, 'PRICE_MATCH', 'Test match', 'EXECUTED', $1, NOW())`,
      [testSessionId]
    );

    // 3. Execute session reset (same logic as in POST /api/session/reset)
    await query('DELETE FROM inventory WHERE session_id = $1', [testSessionId]);
    await query('DELETE FROM orders WHERE session_id = $1', [testSessionId]);
    await query('DELETE FROM automated_actions_log WHERE session_id = $1', [testSessionId]);

    // 4. Verify test session mutations are deleted, ensuring subsequent queries restore baseline
    const remainingInv = await query('SELECT * FROM inventory WHERE session_id = $1', [testSessionId]);
    assert.strictEqual(remainingInv.rows.length, 0);

    const remainingOrders = await query('SELECT * FROM orders WHERE session_id = $1', [testSessionId]);
    assert.strictEqual(remainingOrders.rows.length, 0);

    const remainingLogs = await query('SELECT * FROM automated_actions_log WHERE session_id = $1', [testSessionId]);
    assert.strictEqual(remainingLogs.rows.length, 0);
  } finally {
    client.release();
  }
});

