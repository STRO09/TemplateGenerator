/**
 * Represents an expected application error.
 *
 * Services should throw ApiError for predictable business failures such as:
 * - Validation errors
 * - Resource not found
 * - Authentication failures
 * - Authorization failures
 * - Business rule violations
 *
 * Unexpected runtime exceptions should NOT be wrapped as ApiError.
 * They are handled by the global error middleware as Internal Server Errors.
 */
export default class ApiError extends Error {
    /**
     * @param {Object} options
     * @param {number} [options.statusCode=500] HTTP status code.
     * @param {string} [options.message="Something went wrong."] Error message.
     * @param {Array<Object>} [options.errors] Optional collection of validation or field errors.
     * @param {Object} [options.meta] Additional error metadata.
     */
    constructor({
        statusCode = 500,
        message = "Something went wrong.",
        errors,
        meta
    } = {}) {
        super(message);

        this.statusCode = statusCode;
        this.success = false;

        if (errors !== undefined) this.errors = errors;
        if (meta !== undefined) this.meta = meta;

        Error.captureStackTrace?.(this, this.constructor);
    }
}