import CacheProvider from "./provider.interface.js";

/**
 * In-memory cache provider.
 *
 * Stores cached data inside the current Node.js process.
 *
 * Cached entries are automatically removed when their
 * TTL expires.
 *
 * This provider is intended for:
 *
 * - Development
 * - Testing
 * - Single-instance deployments
 *
 * Because data is stored in memory, the cache is lost
 * whenever the application restarts.
 */
class MemoryProvider extends CacheProvider {
  constructor() {
    super();

    this.cache = new Map();
  }

  /**
   * Retrieve a cached value.
   *
   * @param {string} key
   *
   * @returns {Promise<*>}
   */
  async get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (
      entry.expiresAt &&
      entry.expiresAt <= Date.now()
    ) {
      this.cache.delete(key);

      return null;
    }

    return entry.value;
  }

  /**
   * Store a value in the cache.
   *
   * @param {string} key
   *
   * @param {*} value
   *
   * @param {number} [ttl]
   * Time-to-live in seconds.
   *
   * @returns {Promise<void>}
   */
  async set(key, value, ttl) {
    const expiresAt = ttl
      ? Date.now() + ttl * 1000
      : null;

    this.cache.set(key, {
      value,
      expiresAt,
    });
  }

  /**
   * Remove a cached value.
   *
   * @param {string} key
   *
   * @returns {Promise<void>}
   */
  async delete(key) {
    this.cache.delete(key);
  }

  /**
   * Remove all cached values.
   *
   * @returns {Promise<void>}
   */
  async clear() {
    this.cache.clear();
  }
}

export default new MemoryProvider();