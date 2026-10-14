import jwt from "jsonwebtoken";

import env from "../config/env.js";

/**
 * Sign a JWT.
 *
 * @param {Object} payload
 * Token payload.
 *
 * @param {Object} [options={}]
 * JWT signing options.
 *
 * @param {string} [options.secret=env.JWT_SECRET]
 * Signing secret.
 *
 * @param {string} [options.expiresIn=env.JWT_EXPIRES_IN]
 * Token lifetime.
 *
 * @returns {string}
 * Signed JWT.
 */
export function sign(payload, options = {}) {
  const {
    secret = env.JWT_SECRET,
    expiresIn = env.JWT_EXPIRES_IN,
    ...jwtOptions
  } = options;

  return jwt.sign(payload, secret, {
    expiresIn,
    ...jwtOptions,
  });
}

/**
 * Verify and decode a JWT.
 *
 * @param {string} token
 * JWT to verify.
 *
 * @param {Object} [options={}]
 * JWT verification options.
 *
 * @param {string} [options.secret=env.JWT_SECRET]
 * Verification secret.
 *
 * @returns {Object}
 * Decoded token payload.
 *
 * @throws {JsonWebTokenError|TokenExpiredError}
 * If the token is invalid or expired.
 */
export function verify(token, options = {}) {
  const { secret = env.JWT_SECRET, ...jwtOptions } = options;

  return jwt.verify(token, secret, jwtOptions);
}
