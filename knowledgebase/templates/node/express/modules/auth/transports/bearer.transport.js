/**
 * Extracts an access token from the HTTP Authorization header.
 *
 * Expected format:
 *
 * Authorization: Bearer <token>
 *
 * This transport only extracts the token. It does not verify
 * or otherwise interpret the JWT.
 */
class BearerTransport {

    /**
     * Extract an access token from an Express request.
     *
     * @param {import("express").Request} req
     * Express request.
     *
     * @returns {string|null}
     * Extracted token, or null when no valid Bearer header exists.
     */
    extractAccessToken(req) {
        const authorization = req.headers.authorization;

        if (!authorization) {
            return null;
        }

        const [scheme, token] = authorization.split(" ");

        if (scheme?.toLowerCase() !== "bearer" || !token) {
            return null;
        }

        return token;
    }
}

export default new BearerTransport();