import { sign, verify } from "../../../utils/jwt.js";
import {
  generateRefreshToken,
  hashRefreshToken,
} from "../../../utils/refreshToken.js";

import repositories from "../../../db/provider.js";

import TokenStrategy from "../token.strategy.js";

import env from "../../../config/env.js";
import ApiError from "../../../utils/ApiError.js";
import logger from "../../../utils/logger.js";
import { parseDuration } from "../../../utils/DateTimeFormat.js";

const { refreshSession: refreshSessionRepository } = repositories;

/**
 * JWT authentication strategy with refresh-token sessions.
 *
 * Access tokens remain stateless JWTs.
 * Refresh tokens are opaque credentials whose hashes are persisted
 * as refresh sessions.
 */
class JwtRefreshStrategy extends TokenStrategy {
  /**
   * Issue access and refresh credentials for a user.
   *
   * Creates a persisted refresh session while returning the
   * plaintext refresh token to the client.
   *
   * @param {Object} user
   * Authenticated user.
   *
   * @param {Object} [context={}]
   * Session metadata.
   *
   * @param {string} [context.ipAddress]
   * Client IP address.
   *
   * @param {string} [context.userAgent]
   * Client user-agent.
   *
   * @returns {Promise<{
   *     accessToken: string,
   *     refreshToken: string
   * }>}
   */
  async issue(user, context = {}) {
    const accessToken = sign({
      sub: user._id.toString(),
      type: "access",
    });

    const refreshToken = generateRefreshToken();

    const tokenHash = hashRefreshToken(refreshToken);

    const expiresAt = new Date(
      Date.now() + parseDuration(env.REFRESH_EXPIRES_IN),
    );

    await refreshSessionRepository.create({
      userId: user._id,
      tokenHash,
      expiresAt,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });

    logger.debug("Refresh session created.", {
      userId: user._id.toString(),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Verify an access token.
   *
   * @param {string} token
   * Access token.
   *
   * @returns {Object}
   * Decoded JWT payload.
   *
   * @throws {Error}
   * If the token is invalid or is not an access token.
   */
  verifyAccessToken(token) {
    const payload = verify(token);

    if (payload.type !== "access" || !payload.sub) {
      throw new Error("Invalid access token.");
    }

    return payload;
  }

  /**
   * Rotate a refresh token.
   *
   * The existing refresh session is revoked and a new refresh
   * session is created.
   *
   * @param {string} refreshToken
   * Plaintext refresh token supplied by the client.
   *
   * @param {Object} [context={}]
   * Session metadata.
   *
   * @param {string} [context.ipAddress]
   * Client IP address.
   *
   * @param {string} [context.userAgent]
   * Client user-agent.
   *
   * @returns {Promise<{
   *     accessToken: string,
   *     refreshToken: string
   * }>}
   *
   * @throws {ApiError}
   * If the refresh token is invalid, expired, or revoked.
   */
  async refresh(refreshToken, context = {}) {
    const tokenHash = hashRefreshToken(refreshToken);

    const session = await refreshSessionRepository.findByTokenHash(tokenHash);

    if (!session) {
      throw new ApiError({
        statusCode: 401,
        message: "Invalid refresh token.",
      });
    }

    if (session.revokedAt) {
      throw new ApiError({
        statusCode: 401,
        message: "Refresh token has been revoked.",
      });
    }

    if (session.expiresAt <= new Date()) {
      throw new ApiError({
        statusCode: 401,
        message: "Refresh token has expired.",
      });
    }

    const revokedSession = await refreshSessionRepository.revokeIfActive(
      session._id,
    );

    if (!revokedSession) {
      throw new ApiError({
        statusCode: 401,
        message: "Refresh token has been revoked.",
      });
    }

    const user = {
      _id: session.userId,
    };

    return this.issue(user, {
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }
}

export default new JwtRefreshStrategy();
