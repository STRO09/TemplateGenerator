import MongoRepository from "./mongoRepository.js";
import User from "../models/user.model.js";

class UserRepository extends MongoRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    return this.model.findOne({
      email: email.toLowerCase(),
    });
  }

  /**
   * Find a user by email including the password hash.
   *
   * Used during authentication.
   *
   * @param {string} email
   * @returns {Promise<import("mongoose").Document|null>}
   */
  async findByEmailWithPassword(email) {
    return this.model
      .findOne({
        email: email.toLowerCase(),
      })
      .select("+passwordHash");
  }

  async findByUsername(username) {
    return this.model.findOne({
      username: username.toLowerCase(),
    });
  }

  async existsByEmail(email) {
    return this.exists({
      email: email.toLowerCase(),
    });
  }

  async existsByUsername(username) {
    return this.exists({
      username: username.toLowerCase(),
    });
  }
}

export default new UserRepository();
