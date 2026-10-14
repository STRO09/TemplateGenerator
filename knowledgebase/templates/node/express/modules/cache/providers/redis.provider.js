/**
 * Redis cache provider.
 */

import CacheProvider from "./provider.interface.js";

import redisClient from "../../config/redis.config.js";

class RedisProvider extends CacheProvider {
  /**
   * Retrieve a cached value.
   *
   * @param {string} key
   *
   * @returns {Promise<any>}
   */
  async get(key) {
    const value = await redisClient.get(key);

    return value ? JSON.parse(value) : null;
  }

  /**
   * Store a value in the cache.
   *
   * @param {string} key
   *
   * @param {any} value
   *
   * @param {number} [ttl]
   * Time to live in seconds.
   *
   * @returns {Promise<void>}
   */
  async set(key, value, ttl) {
    const serialized = JSON.stringify(value);

    if (ttl) {
      await redisClient.set(key, serialized, {
        EX: ttl,
      });

      return;
    }

    await redisClient.set(key, serialized);
  }

  /**
   * Delete a cached value.
   *
   * @param {string} key
   *
   * @returns {Promise<void>}
   */
  async delete(key) {
    await redisClient.del(key);
  }

  /**
   * Clear the cache.
   *
   * @returns {Promise<void>}
   */
  async clear() {
    await redisClient.flushDb();
  }
}

export default new RedisProvider();
