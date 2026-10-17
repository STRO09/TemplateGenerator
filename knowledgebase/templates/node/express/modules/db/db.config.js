/**
 * Initializes the configured database connection.
 *
 * The database implementation is selected using the
 * DB_DRIVER environment variable.
 *
 * Supported drivers:
 * - mongo
 * - mysql
 * - postgres
 *
 * @returns {Promise<void>}
 * @throws {Error}
 * If the configured database driver is unsupported.
 */

import mongoose from "mongoose";
import env from "./env.js";
import retry from "../utils/retry.js";
import repositories from "../db/provider.js";
import logger from '../utils/logger.js';

/**
 * Establish a MongoDB connection using Mongoose.
 *
 * @returns {Promise<void>}
 */

async function connectMongo() {
  logger.info("Connecting to MongoDB");

  await retry(() => mongoose.connect(env.MONGO_URI), {
    retries: 5,

    onRetry(error, attempt, delay) {
      logger.warn("Retrying MongoDB connection", {
        attempt,
        delay,
      });
    },
  });

    logger.success("MongoDB connected");
  await initializeRepositories();
}

/**
 * Performs one-time initialization for all registered repositories.
 *
 * Called after a successful database connection to prepare database
 * resources before the application begins accepting requests.
 *
 * Typical initialization includes:
 * - Creating collections
 * - Synchronizing indexes
 * - Warming database metadata
 *
 * @returns {Promise<void>}
 */

async function initializeRepositories() {
  const repositoryEntries = Object.entries(repositories);

  logger.info(`🔄 Initializing ${repositoryEntries.length} repositories...`);

  await Promise.all(
    repositoryEntries.map(async ([name, repository]) => {
      console.log(`${name}↴`);

      await repository.initialize();

      console.log(`✓ ${name}`);
    }),
  );

  logger.success("✅ Repository initialization complete.");
}

async function connectDB() {
  switch (env.DB_DRIVER) {
    case "mongo":
      return connectMongo();

    case "mysql":
      return connectMySQL();

    case "postgres":
      return connectPostgres();

    default:
      throw new Error("Unsupported database");
  }
}

export default connectDB;
