/**
 * In-memory TTL cache for ML demand predictions.
 * Prevents redundant Scikit-Learn retraining and database queries on rapid consecutive requests.
 */
class MemoryCache {
  constructor(defaultTtlMs = 6000) {
    this.defaultTtlMs = defaultTtlMs;
    this.cache = new Map();
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs
    });
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

export const intelligenceCache = new MemoryCache(6000); // 6-second TTL

