import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

/**
 * Key generator helper for rate limiting.
 * If the request has an active visitor session (not 'baseline'), key by session ID
 * to ensure visitors behind shared proxies or NATs do not exhaust each other's quotas.
 * Otherwise, falls back to the client IP (normalized for IPv6 via ipKeyGenerator).
 */
export const sessionOrIpKeyGenerator = (req) => {
  if (req.sessionId && req.sessionId !== 'baseline') {
    return `sess_${req.sessionId}`;
  }
  return ipKeyGenerator(req.ip || '127.0.0.1');
};

/**
 * Global rate limiter across all endpoints to prevent general DDoS and brute-force flooding.
 * Allows up to 150 requests per minute per IP.
 */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip || '127.0.0.1'),
  message: {
    success: false,
    error: 'Too many requests from this client. Please slow down and try again shortly.'
  }
});

/**
 * Strict rate limiter for compute-intensive ML inference endpoints (/api/intelligence, /api/sandbox/simulate).
 * Limits inference calls to 60 per minute per visitor session (or client IP) to prevent CPU/memory exhaustion.
 */
export const mlInferenceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: sessionOrIpKeyGenerator,
  message: {
    success: false,
    error: 'Too many ML inference requests. Please slow down and try again shortly.'
  }
});

/**
 * Strict rate limiter for state mutations (/api/simulate-order, /api/insights/execute-actions).
 * Limits mutations to 30 per minute per visitor session (or client IP) to protect database throughput and prevent order flooding.
 */
export const mutationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: sessionOrIpKeyGenerator,
  message: {
    success: false,
    error: 'Too many simulation actions submitted. Please wait a moment before trying again.'
  }
});
