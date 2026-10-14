import env from "../config/env.js";
import cookieTransport from "./transports/cookie.transport.js";

/**
 * Delivers authentication credentials through their configured
 * HTTP transports.
 *
 * Authentication strategies are responsible for producing credentials.
 * This module is responsible only for deciding how those credentials
 * are delivered to the client.
 *
 * Access tokens may be delivered through:
 * - Bearer response
 * - HTTP cookie
 *
 * Refresh tokens are delivered through:
 * - HTTP-only cookie
 *
 * @param {import("express").Response} res
 * Express response.
 *
 * @param {Object} credentials
 * Authentication credentials produced by an authentication strategy.
 *
 * @param {string} credentials.accessToken
 * Access token.
 *
 * @param {string} [credentials.refreshToken]
 * Refresh token.
 *
 * @returns {Object}
 * Credentials that should remain in the JSON response.
 */
export function deliverCredentials(res, credentials) {
  const { accessToken, refreshToken } = credentials;

  const response = {};

  /*
   * Access token transport.
   */
  if (env.ACCESS_TOKEN_TRANSPORT === "cookie") {
    cookieTransport.set(res, "access", accessToken);
  } else {
    response.accessToken = accessToken;
  }

  /*
   * Refresh tokens are always transported through
   * an HTTP-only cookie.
   */
  if (refreshToken) {
    cookieTransport.set(res, "refresh", refreshToken);
  }

  return response;
}
