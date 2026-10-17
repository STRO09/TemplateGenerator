import authStrategy from "../auth/provider.js";
import authTransport from "../auth/transport.js";

import ApiError from "../utils/ApiError.js";
import logger from "../utils/logger.js";

/**
 * Authenticate an incoming HTTP request.
 *
 * The configured authentication transport extracts the access token,
 * while the configured authentication strategy verifies it.
 *
 * On successful authentication, the decoded token payload is attached
 * to `req.user`.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @returns {void}
 */
export function authenticate(req, res, next) {

    const token = authTransport.extractAccessToken(req);

    if (!token) {
        return next(
            new ApiError({
                statusCode: 401,
                message: "Authentication required."
            })
        );
    }

    try {

        const payload = authStrategy.verifyAccessToken(token);

        req.user = payload;

        logger.debug("Request authenticated.", {
            method: req.method,
            path: req.originalUrl,
            userId: payload.sub
        });

        next();

    } catch (error) {

        logger.warn("Authentication failed.", {
            method: req.method,
            path: req.originalUrl,
            reason: error.message
        });

        return next(
            new ApiError({
                statusCode: 401,
                message: "Invalid or expired access token."
            })
        );
    }
}