import test from 'node:test';
import assert from 'node:assert';
import { query } from '../db.js';
import { runDecisionEngine } from '../services/decisionEngine.js';
import app from '../server.js';

test('TOCTOU Prevention: Concurrent execution of decision engine produces zero duplicate action log entries', async () => {
  const testSessionId = '00000000-0000-0000-0000-toctou-test-01';

  try {
    // 1. Ensure test session is clean
    await query('DELETE FROM automated_actions_log WHERE session_id = $1', [testSessionId]);

    // 2. Fire 10 simultaneous concurrent executions of the decision engine for the same session
    const concurrentExecutions = Array.from({ length: 10 }, () => runDecisionEngine(testSessionId));
    const results = await Promise.all(concurrentExecutions);

    // Sum of actions reported as executed across all concurrent callers
    const totalExecutedAcrossCallers = results.reduce((acc, curr) => acc + curr, 0);

    // 3. Inspect database rows for this session
    const { rows } = await query(
      'SELECT id, product_id, description FROM automated_actions_log WHERE session_id = $1',
      [testSessionId]
    );

    // Verify no duplicates exist
    const seenKeys = new Set();
    for (const row of rows) {
      const key = `${row.product_id}::${row.description}`;
      assert.strictEqual(
        seenKeys.has(key),
        false,
        `TOCTOU Violation! Duplicate action log detected for product ${row.product_id}: ${row.description}`
      );
      seenKeys.add(key);
    }

    // Verify database row count matches total executed count
    assert.strictEqual(
      rows.length,
      totalExecutedAcrossCallers,
      'Total executed actions across concurrent promises must equal total distinct inserted rows'
    );
  } finally {
    await query('DELETE FROM automated_actions_log WHERE session_id = $1', [testSessionId]);
  }
});

test('TOCTOU Prevention: Concurrent HTTP POST /api/insights/execute-actions produces zero duplicate records', async () => {
  const server = app.listen(0);
  const port = server.address().port;
  const testSessionId = '00000000-0000-0000-0000-toctou-test-02';

  try {
    // 1. Ensure test session is clean
    await query('DELETE FROM automated_actions_log WHERE session_id = $1', [testSessionId]);

    // 2. Fire 5 parallel HTTP requests simultaneously
    const httpRequests = Array.from({ length: 5 }, () =>
      fetch(`http://127.0.0.1:${port}/api/insights/execute-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': testSessionId
        }
      })
    );

    const responses = await Promise.all(httpRequests);
    for (const res of responses) {
      assert.strictEqual(res.status, 200, 'Expected HTTP 200 from concurrent action trigger');
      const body = await res.json();
      assert.strictEqual(body.success, true);
    }

    // 3. Verify exactly zero duplicate rows in the database
    const { rows } = await query(
      'SELECT id, product_id, description FROM automated_actions_log WHERE session_id = $1',
      [testSessionId]
    );

    const uniqueSet = new Set(rows.map(r => `${r.product_id}::${r.description}`));
    assert.strictEqual(
      rows.length,
      uniqueSet.size,
      `TOCTOU race condition detected! Found ${rows.length} rows with only ${uniqueSet.size} unique actions.`
    );
  } finally {
    server.close();
    await query('DELETE FROM automated_actions_log WHERE session_id = $1', [testSessionId]);
  }
});

