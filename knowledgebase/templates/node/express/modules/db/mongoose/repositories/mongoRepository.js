import mongoose from "mongoose";
import IRepository from "../../repository.interface.js";
import logger from "../../../utils/logger.js";

/**
 * Base repository implementation for MongoDB using Mongoose.
 *
 * Provides common CRUD operations shared across all MongoDB repositories.
 * Entity-specific repositories should extend this class and implement
 * custom queries when needed.
 *
 * This class isolates Mongoose from the service layer so database
 * implementations can be replaced with minimal impact.
 */

export default class MongoRepository extends IRepository {
  /**
   * Create a Mongo repository.
   *
   * @param {mongoose.Model} model
   * A Mongoose model representing the collection.
   */

  constructor(model) {
    super();

    if (!model) {
      throw new Error("Repository requires a model.");
    }

    this.model = model;
  }

  /**
   * Performs one-time repository initialization.
   *
   * By default, this synchronizes the model with MongoDB by ensuring
   * indexes are created before the application begins serving requests.
   *
   * Child repositories may override this method to perform additional
   * startup tasks if required.
   *
   * @returns {Promise<void>}
   */
  async initialize() {
    logger.info(`Initializing ${this.model.modelName} repository...`);
    await this.model.init();
    logger.success(`${this.model.modelName} repository initialized.`);
  }

  async create(data) {
    return this.model.create(data);
  }

  async findById(id) {
    return this.model.findById(id);
  }

  async findAll(filter = {}, options = {}) {
    return this.model.find(filter, null, options);
  }

  async updateById(id, data, options = { returnDocument: "after" },) {
    return this.model.findByIdAndUpdate(id, data, options);
  }

  async deleteById(id) {
    return this.model.findByIdAndDelete(id);
  }

  async exists(filter) {
    const result = await this.model.exists(filter);
    return Boolean(result);
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }

  /**
   * Find a paginated collection of documents.
   *
   * @param {Object} filter
   * Query filter.
   *
   * @param {Object} pagination
   *
   * @param {number} pagination.skip
   * Number of documents to skip.
   *
   * @param {number} pagination.limit
   * Maximum number of documents to return.
   *
   * @returns {Promise<{
   *   items: Array,
   *   total: number
   * }>}
   */
  async findPaginated(filter = {}, { skip = 0, limit = 10 } = {}) {
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),

      this.model.countDocuments(filter),
    ]);

    return {
      items,
      total,
    };
  }

  async findManyByIds(ids) {
    return this.model.find({
      _id: { $in: ids },
    });
  }
}
