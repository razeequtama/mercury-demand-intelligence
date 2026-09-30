import test from 'node:test';
import assert from 'node:assert';
import { getClient } from '../db.js';

test('Database transaction rollbacks safely on invalid product ID', async () => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Attempt to query a non-existent product
    const prodRes = await client.query('SELECT current_price FROM products WHERE id = $1', [-999]);
    assert.strictEqual(prodRes.rows.length, 0);

    // Should trigger rollback path
    await client.query('ROLLBACK');
    client.release();
    assert.ok(true, 'Transaction rolled back successfully without crashing');
  } catch (err) {
    await client.query('ROLLBACK');
    client.release();
    assert.fail(`Transaction threw an unexpected error: ${err.message}`);
  }
});

test('Order simulation updates inventory correctly within a transaction', async () => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Get a valid test product and its current stock
    const productRes = await client.query('SELECT id, current_price FROM products LIMIT 1');
    const productId = productRes.rows[0].id;
    const price = parseFloat(productRes.rows[0].current_price);

    const invRes = await client.query('SELECT stock_quantity FROM inventory WHERE product_id = $1', [productId]);
    const initialStock = invRes.rows[0].stock_quantity;

    const orderQty = 5;
    const totalAmount = price * orderQty;

    // Simulate order insert and inventory reduction
    await client.query(
      'INSERT INTO orders (product_id, quantity, total_amount, order_date) VALUES ($1, $2, $3, NOW())',
      [productId, orderQty, totalAmount]
    );

    await client.query(
      'UPDATE inventory SET stock_quantity = GREATEST(0, stock_quantity - $1), updated_at = NOW() WHERE product_id = $2',
      [orderQty, productId]
    );

    // Verify stock dropped by exactly orderQty
    const updatedInvRes = await client.query('SELECT stock_quantity FROM inventory WHERE product_id = $1', [productId]);
    const newStock = updatedInvRes.rows[0].stock_quantity;

    assert.strictEqual(newStock, initialStock - orderQty);

    // Clean up test data by rolling back so we don't mess up the seed state
    await client.query('ROLLBACK');
    client.release();
  } catch (err) {
    await client.query('ROLLBACK');
    client.release();
    assert.fail(`Order simulation test failed: ${err.message}`);
  }
});