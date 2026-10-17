import ApiError from "../utils/ApiError.js";
import logger from "../utils/logger.js";

/**
 * Global Express error handler.
 *
 * Expected application errors (ApiError) are returned to the client
 * with their corresponding HTTP status code and standardized response.
 *
 * Unexpected runtime errors are logged and returned as a generic
 * 500 Internal Server Error to avoid leaking implementation details.
 *
 * This middleware should be registered after all routes.
 */

export default function errorMiddleware(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
      meta: {
        requestId: req.id,
        ...err.meta,
      },
    });
  }

  logger.error(err, {
    method: req.method,
    path: req.originalUrl,
  });

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    meta: {
      requestId: req.id,
    },
  });
}
