import { sign, verify } from "../../../utils/jwt.js";
import TokenStrategy from "../token.strategy.js";

/**
 * JWT authentication strategy.
 *
 * Responsible for creating and verifying access tokens.
 * Token transport (Bearer header, cookie, etc.) is handled separately.
 */
class JwtStrategy extends TokenStrategy {
  /**
   * Create an access token for an authenticated user.
   *
   * @param {Object} user
   * Authenticated User object 
   *
   * @returns {string}
   * Signed access token.
   */
  issue(user) {
    const accessToken = sign({
      sub: user._id.toString(),
      type: "access",
    });

    return {
      accessToken,
    };
  }

  /**
   * Verify an access token.
   *
   * @param {string} token
   * Access token to verify.
   *
   * @returns {Object}
   * Decoded token payload.
   *
   * @throws {JsonWebTokenError|TokenExpiredError}
   * If the token is invalid or expired.
   */
  verifyAccessToken(token) {
    const payload = verify(token);

    if (payload.type !== "access" || !payload.sub) {
      throw new Error("Invalid access token.");
    }

    return payload;
  }
}

export default new JwtStrategy();
