/**
 * Standard success response returned by the API.
 *
 * This class ensures all successful responses follow a consistent structure.
 * Optional properties are only included when explicitly provided.
 *
 * Response Shape:
 * {
 *   success: true,
 *   message: string,
 *   data?: any,
 *   pagination?: object,
 *   meta?: object
 * }
 */
export default class ApiResponse {
    /**
     * @param {Object} options
     * @param {boolean} [options.success=true] Indicates whether the request succeeded.
     * @param {string} [options.message="Success"] Human-readable response message.
     * @param {*} [options.data] Response payload.
     * @param {Object} [options.pagination] Pagination information for paginated resources.
     * @param {Object} [options.meta] Additional response metadata.
     */
    constructor({
        success = true,
        message = "Success",
        data,
        pagination,
        meta
    } = {}) {
        this.success = success;
        this.message = message;

        if (data !== undefined) this.data = data;
        if (pagination !== undefined) this.pagination = pagination;
        if (meta !== undefined) this.meta = meta;
    }
}