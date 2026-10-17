import ApiResponse from "./ApiResponse.js";

/**
 * Sends a standardized success response.
 *
 * @param {import("express").Response} res
 * @param {Object} options
 * @param {number} [options.statusCode=200]
 * @param {string} [options.message="Success"]
 * @param {*} [options.data]
 * @param {Object} [options.pagination]
 * @param {Object} [options.meta]
 */

export function success(
  res,
  { statusCode = 200, message = "Success", data, pagination, meta } = {},
) {
  return res.status(statusCode).json(
    new ApiResponse({
      message,
      data,
      pagination,
      meta: {
        requestId: res.req.id,
        ...meta,
      },
    }),
  );
}
