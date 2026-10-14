import env from "../../config/env.js";
import { parseDuration } from "../../utils/DateTimeFormat.js";

/**
 * Extracts authentication tokens from HTTP cookies.
 *
 * This transport only handles the HTTP transport layer.
 * It does not verify or otherwise interpret tokens.
 */
class CookieTransport {
  /**
   * Extract the access token from the access-token cookie.
   *
   * @param {import("express").Request} req
   * Express request.
   *
   * @returns {string|null}
   * Access token, or null when unavailable.
   */
  extractAccessToken(req) {
    return req.cookies?.[env.ACCESS_TOKEN_COOKIE_NAME] ?? null;
  }

  /**
   * Extract the refresh token from the refresh-token cookie.
   *
   * @param {import("express").Request} req
   * Express request.
   *
   * @returns {string|null}
   * Refresh token, or null when unavailable.
   */
  extractRefreshToken(req) {
    return req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME] ?? null;
  }

  /**
   * Set an authentication token cookie.
   *
   * @param {import("express").Response} res
   * @param {"access"|"refresh"} type
   * Token type.
   * @param {string} token
   * Token value.
   */
  set(res, type, token) {
    const isAccessToken = type === "access";

    res.cookie(
      isAccessToken
        ? env.ACCESS_TOKEN_COOKIE_NAME
        : env.REFRESH_TOKEN_COOKIE_NAME,
      token,
      {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: parseDuration(
          isAccessToken ? env.JWT_EXPIRES_IN : env.REFRESH_EXPIRES_IN,
        ),
      },
    );
  }

  /**
   * Clear an authentication token cookie.
   *
   * @param {import("express").Response} res
   * @param {"access"|"refresh"} type
   * Token type.
   */
  clear(res, type) {
    res.clearCookie(
      type === "access" ? env.ACCESS_TOKEN_COOKIE_NAME : env.REFRESH_TOKEN_COOKIE_NAME,
    );
  }
}

export default new CookieTransport();
