import { query } from '../db.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{16,64}$/;

/**
 * Validates a session identifier string.
 * Allows 'baseline' or safe alphanumeric / UUID tokens.
 */
export const isValidSessionId = (id) => {
  if (typeof id !== 'string') return false;
  const trimmed = id.trim();
  return trimmed === 'baseline' || UUID_REGEX.test(trimmed) || SAFE_ID_REGEX.test(trimmed);
};

/**
 * Non-blocking session extractor middleware.
 * Reads 'x-session-id' header or 'sessionId' query parameter.
 * Defaults to 'baseline' if omitted or invalid.
 */
export const extractSession = (req, res, next) => {
  const rawId = req.headers['x-session-id'] || req.query.sessionId;

  if (rawId && isValidSessionId(rawId)) {
    req.sessionId = rawId.trim();
  } else {
    req.sessionId = 'baseline';
  }

  next();
};

/**
 * Mandatory session middleware for state-mutating endpoints.
 * Requires an active, isolated visitor session ID (cannot be omitted or 'baseline').
 * Rejects unauthenticated/anonymous requests with 401 Unauthorized.
 */
export const requireSession = (req, res, next) => {
  const rawId = req.headers['x-session-id'];

  if (!rawId) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. An x-session-id header is required to perform simulation mutations.'
    });
  }

  const trimmed = rawId.trim();

  if (trimmed === 'baseline') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden. The baseline environment cannot be directly mutated. An active visitor session is required.'
    });
  }

  if (!isValidSessionId(trimmed)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid session ID format. Must be a valid UUID or 16-64 character token.'
    });
  }

  req.sessionId = trimmed;
  next();
};

/**
 * Ensures that an isolated visitor session has its own copy of the inventory table.
 * If the session does not yet have inventory rows, copies the baseline inventory.
 */
export const ensureSessionInventory = async (dbClientOrQuery, sessionId) => {
  if (!sessionId || sessionId === 'baseline') return;

  const runQuery = typeof dbClientOrQuery.query === 'function'
    ? (text, params) => dbClientOrQuery.query(text, params)
    : query;

  // Check if session inventory exists
  const checkRes = await runQuery(
    'SELECT 1 FROM inventory WHERE session_id = $1 LIMIT 1',
    [sessionId]
  );

  if (checkRes.rows.length === 0) {
    // Clone baseline inventory for this visitor session
    await runQuery(`
      INSERT INTO inventory (product_id, warehouse_name, stock_quantity, reorder_threshold, session_id)
      SELECT product_id, warehouse_name, stock_quantity, reorder_threshold, $1
      FROM inventory
      WHERE session_id = 'baseline'
    `, [sessionId]);
  }
};

