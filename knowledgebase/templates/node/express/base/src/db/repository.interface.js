/**
 * Abstract contract for all repository implementations.
 *
 * Repositories act as the data access layer between the application
 * and a persistence mechanism (MongoDB, PostgreSQL, MySQL, etc.).
 *
 * Database-specific repositories should extend this class and implement
 * each CRUD operation using the underlying database driver.
 *
 * Services should depend on repositories instead of directly accessing
 * database models, allowing the persistence layer to be swapped without
 * changing business logic.
 *
 * @abstract
 */
export default class IRepository {
  /**
   * Persist a new entity.
   *
   * @abstract
   * @param {Object} data - Entity data.
   * @returns {Promise<Object>}
   */
  async create() {
    throw new Error("Method not implemented.");
  }

  /**
   * Retrieve an entity by its unique identifier.
   *
   * @abstract
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById() {
    throw new Error("Method not implemented.");
  }

  /**
   * Retrieve multiple entities matching a filter.
   *
   * @abstract
   * @param {Object} [filter={}]
   * @returns {Promise<Object[]>}
   */

  async findAll() {
    throw new Error("Method not implemented.");
  }

  /**
   * Update an entity by its identifier.
   *
   * @abstract
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object|null>}
   */
  async updateById() {
    throw new Error("Method not implemented.");
  }

  /**
   * Delete an entity by its identifier.
   *
   * @abstract
   * @param {string} id
   * @returns {Promise<Object|null>}
   */

  async deleteById() {
    throw new Error("Method not implemented.");
  }

  /**
   * Check whether an entity exists.
   *
   * @abstract
   * @param {Object} filter
   * @returns {Promise<boolean>}
   */

  async exists() {
    throw new Error("Method not implemented.");
  }

  /**
   * Count entities matching a filter.
   *
   * @abstract
   * @param {Object} [filter={}]
   * @returns {Promise<number>}
   */
  async count() {
    throw new Error("Method not implemented.");
  }

    /**
   * Find multiple entities by their unique identifiers.
   *
   * @abstract
   * @param {string[]} ids
   * @returns {Promise<Object[]>}
   */
  async findManyByIds() {
  throw new Error("Method not implemented.");
}
}
