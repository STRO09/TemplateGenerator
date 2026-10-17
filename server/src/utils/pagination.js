/**
 * Normalize pagination parameters.
 *
 * @param {Object} options
 *
 * @param {number|string} [options.page=1]
 * Requested page number.
 *
 * @param {number|string} [options.limit=10]
 * Number of records per page.
 *
 * @param {number} [options.maxLimit=100]
 * Maximum number of records allowed per page.
 *
 * @returns {{
 *   page: number,
 *   limit: number,
 *   skip: number
 * }}
 */
export function getPagination({ page = 1, limit = 10, maxLimit = 100 } = {}) {
  page = Math.max(Number(page) || 1, 1);
  limit = Math.min(Math.max(Number(limit) || 10, 1), maxLimit);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

/**
 * Build pagination metadata from the total number of records.
 *
 * @param {Object} options
 *
 * @param {number} options.page
 * Current page number.
 *
 * @param {number} options.limit
 * Number of records per page.
 *
 * @param {number} options.total
 * Total number of matching records.
 *
 * @returns {{
 *   page: number,
 *   limit: number,
 *   total: number,
 *   totalPages: number,
 *   hasNextPage: boolean,
 *   hasPreviousPage: boolean
 * }}
 */
export function buildPagination({ page, limit, total }) {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
