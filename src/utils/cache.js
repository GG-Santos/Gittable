const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

/**
 * Simple in-memory cache with optional persistence
 */
class Cache {
  constructor(name, options = {}) {
    this.name = name;
    this.ttl = options.ttl || 30000; // 30 seconds default
    this.persist = options.persist || false;
    this.cache = {};
    this.timestamps = {};

    if (this.persist) {
      this.cacheFile = path.join(os.homedir(), '.gittable', 'cache', `${name}.json`);
      this.load();
    }
  }

  /**
   * Get cached value
   */
  get(key) {
    const entry = this.cache[key];
    if (!entry) {
      return null;
    }

    const timestamp = this.timestamps[key];
    if (timestamp && Date.now() - timestamp > this.ttl) {
      delete this.cache[key];
      delete this.timestamps[key];
      return null;
    }

    return entry;
  }

  /**
   * Set cached value
   */
  set(key, value) {
    this.cache[key] = value;
    this.timestamps[key] = Date.now();

    if (this.persist) {
      this.save();
    }
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache = {};
    this.timestamps = {};

    if (this.persist && fs.existsSync(this.cacheFile)) {
      fs.unlinkSync(this.cacheFile);
    }
  }

  /**
   * Load from disk
   */
  load() {
    if (!this.persist || !fs.existsSync(this.cacheFile)) {
      return;
    }

    try {
      const data = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
      this.cache = data.cache || {};
      this.timestamps = data.timestamps || {};
    } catch (error) {
      // Ignore load errors
    }
  }

  /**
   * Save to disk
   */
  save() {
    if (!this.persist) {
      return;
    }

    const cacheDir = path.dirname(this.cacheFile);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    try {
      fs.writeFileSync(
        this.cacheFile,
        JSON.stringify({
          cache: this.cache,
          timestamps: this.timestamps,
        }),
        'utf8'
      );
    } catch (error) {
      // Ignore save errors
    }
  }
}

// Global cache instances
const caches = {};

/**
 * Get or create a cache instance
 */
function getCache(name, options = {}) {
  if (!caches[name]) {
    caches[name] = new Cache(name, options);
  }
  return caches[name];
}

/**
 * Clear all caches
 */
function clearAllCaches() {
  Object.values(caches).forEach((cache) => cache.clear());
}

module.exports = {
  Cache,
  getCache,
  clearAllCaches,
};
