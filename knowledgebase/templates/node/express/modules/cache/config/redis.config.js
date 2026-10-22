/**
 * Redis client configuration.
 *
 * Creates and exports a configured Redis client instance.
 *
 * Connection recovery is handled through Redis socket
 * reconnection strategies rather than an external retry
 * utility.
 */

import { createClient } from "redis";

import env from "./env.js";
import logger from "../utils/logger.js";

const redisClient = createClient({
  socket: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    reconnectStrategy(retries) {
      return Math.min(retries * 1000, 5000);
    },
  },

  password: env.REDIS_PASSWORD || undefined,

  database: env.REDIS_DATABASE,
});

redisClient.on("connect", () => {
  logger.success("Redis connected.");
});

redisClient.on("reconnecting", () => {
  logger.warn("Reconnecting to Redis.");
});

redisClient.on("error", (error) => {
  logger.error("Redis connection failed.", error);
});

/**
 * Establish the initial Redis connection.
 *
 * This function is intended to be called once during
 * application startup.
 *
 * Subsequent connection failures are handled automatically
 * by the Redis client's configured reconnection strategy.
 *
 * @returns {Promise<void>}
 *
 * @throws {Error}
 * If the initial connection attempt fails.
 */

export default redisClient;
