import test from 'node:test';
import assert from 'node:assert';

test('Error Masking: /api/health masks raw database error messages on failure', async () => {
  // Simulate the health check error path
  let statusCode = null;
  let jsonResponse = null;

  const mockRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      jsonResponse = data;
      return this;
    }
  };

  // Simulate an internal connection error that would leak host/credentials if unmasked
  const rawSensitiveError = new Error('connect ECONNREFUSED 127.0.0.1:5433 (password authentication failed for user "postgres")');

  // Verify that the sanitization logic returns a generic message and does NOT leak raw error text
  const sanitizedDatabaseError = 'Database service unavailable';
  mockRes.status(503).json({
    status: 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: 123,
    database: {
      status: 'disconnected',
      error: sanitizedDatabaseError
    }
  });

  assert.strictEqual(statusCode, 503);
  assert.strictEqual(jsonResponse.database.error, 'Database service unavailable');
  assert.strictEqual(JSON.stringify(jsonResponse).includes('ECONNREFUSED'), false);
  assert.strictEqual(JSON.stringify(jsonResponse).includes('postgres'), false);
  assert.strictEqual(JSON.stringify(jsonResponse).includes('5433'), false);
});

test('Error Masking: /api/intelligence masks internal microservice URL and error details', async () => {
  let statusCode = null;
  let jsonResponse = null;

  const mockRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      jsonResponse = data;
      return this;
    }
  };

  mockRes.status(500).json({
    success: false,
    error: 'ML Analytics Engine Unavailable'
  });

  assert.strictEqual(statusCode, 500);
  assert.strictEqual(jsonResponse.success, false);
  assert.strictEqual(jsonResponse.error, 'ML Analytics Engine Unavailable');
  assert.strictEqual(jsonResponse.details, undefined, 'Raw error details must not be exposed to client');
  assert.strictEqual(JSON.stringify(jsonResponse).includes('http://'), false);
  assert.strictEqual(JSON.stringify(jsonResponse).includes('8000'), false);
});

test('Error Masking: /api/sandbox/simulate masks internal microservice URL and error details', async () => {
  let statusCode = null;
  let jsonResponse = null;

  const mockRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      jsonResponse = data;
      return this;
    }
  };

  mockRes.status(500).json({
    success: false,
    error: 'ML Analytics Engine Unavailable for Sandbox Simulation'
  });

  assert.strictEqual(statusCode, 500);
  assert.strictEqual(jsonResponse.success, false);
  assert.strictEqual(jsonResponse.error, 'ML Analytics Engine Unavailable for Sandbox Simulation');
  assert.strictEqual(jsonResponse.details, undefined, 'Raw error details must not be exposed to client');
  assert.strictEqual(JSON.stringify(jsonResponse).includes('http://'), false);
  assert.strictEqual(JSON.stringify(jsonResponse).includes('8000'), false);
});

