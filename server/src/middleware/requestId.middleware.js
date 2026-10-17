import crypto from "crypto";

/**
 * Assigns a unique request ID to each incoming request.
 *
 * An existing X-Request-ID supplied by the client is reused; otherwise
 * a new ID is generated. The ID is also returned through the response
 * header for request correlation.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export default function requestId(req, res, next) {
  req.id = req.get("X-Request-ID") || crypto.randomUUID();

  res.set("X-Request-ID", req.id);

  next();
}
