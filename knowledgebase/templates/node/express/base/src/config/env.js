/**
 * Loads and validates application environment variables.
 *
 * All configuration values should be accessed through this module
 * instead of using process.env directly.
 *
 * This provides:
 * - Centralized configuration
 * - Early validation
 * - Consistent defaults
 * - Easier testing
 */

import dotenv from "dotenv";
dotenv.config();

/**
 * Retrieve a required environment variable.
 *
 * @param {string} key
 * Environment variable name.
 *
 * @throws {Error}
 * If the variable is missing.
 *
 * @returns {string}
 */

function required(key) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`${key} is missing`);
  }

  return value;
}

/**
 * Application configuration.
 */
const env = {
  /*
   * Application.
   */
  PORT: process.env.PORT ?? 3000,

  NODE_ENV: process.env.NODE_ENV ?? "development",

  CORS_ORIGINS: process.env.CORS_ORIGINS ?? "http://localhost:3000",

  // /*
  //  * Sockets.
  //  */
  // SOCKET_PROVIDER: process.env.SOCKET_PROVIDER ?? "socketio",
};

export default env;
