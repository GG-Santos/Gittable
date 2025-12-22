/**
 * Cache utilities
 * Provides in-memory caching with TTL support
 */

/**
 * Cache class for storing key-value pairs with TTL
 */
class Cache {
  constructor(name, options = {}) {
    this.name = name;
    this.ttl = options.ttl || 60000; // Default 60 seconds
    this.data = new Map();
    this.timestamps = new Map();
  }

  /**
   * Get value from cache
   */
  get(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp) {
      return undefined;
    }

    // Check if expired
    if (Date.now() - timestamp > this.ttl) {
      this.delete(key);
      return undefined;
    }

    return this.data.get(key);
  }

  /**
   * Set value in cache
   */
  set(key, value) {
    this.data.set(key, value);
    this.timestamps.set(key, Date.now());
  }

  /**
   * Delete value from cache
   */
  delete(key) {
    this.data.delete(key);
    this.timestamps.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.data.clear();
    this.timestamps.clear();
  }

  /**
   * Check if key exists and is not expired
   */
  has(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp) {
      return false;
    }

    if (Date.now() - timestamp > this.ttl) {
      this.delete(key);
      return false;
    }

    return true;
  }
}

// Global cache registry
const caches = new Map();

/**
 * Get or create a cache instance
 */
function getCache(name, options = {}) {
  if (!caches.has(name)) {
    caches.set(name, new Cache(name, options));
  }
  return caches.get(name);
}

/**
 * Clear all caches
 */
function clearAllCaches() {
  for (const cache of caches.values()) {
    cache.clear();
  }
  caches.clear();
}

module.exports = {
  Cache,
  getCache,
  clearAllCaches,
};
