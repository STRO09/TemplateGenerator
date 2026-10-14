/**
 * Abstract contract for cache providers.
 *
 * Cache providers expose a common API for storing
 * and retrieving temporary application data.
 *
 * Implementations may store data in:
 *
 * - In-memory cache
 * - Redis
 * - Memcached
 *
 * Services should depend on this contract rather than
 * directly interacting with a specific cache implementation.
 *
 * @abstract
 */
export default class CacheProvider {
  /**
   * Retrieve a cached value.
   *
   * @abstract
   *
   * @param {string} key
   *
   * @returns {Promise<*>}
   */
  async get() {
    throw new Error("Method not implemented.");
  }

  /**
   * Store a value in the cache.
   *
   * @abstract
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
  async set() {
    throw new Error("Method not implemented.");
  }

  /**
   * Remove a cached value.
   *
   * @abstract
   *
   * @param {string} key
   *
   * @returns {Promise<void>}
   */
  async delete() {
    throw new Error("Method not implemented.");
  }

  /**
   * Remove all cached values.
   *
   * @abstract
   *
   * @returns {Promise<void>}
   */
  async clear() {
    throw new Error("Method not implemented.");
  }
}