import env from "../config/env.js";

/**
 * Centralized application logger.
 *
 * All application logs should be emitted through this module instead of
 * using console.* directly. This allows the underlying logging
 * implementation (Console, Pino, Winston, etc.) to be replaced without
 * modifying the rest of the codebase.
 *
 * Logging convention:
 *
 * logger.info("Application started");
 *
 * logger.info("Creating product", {
 *     productId,
 *     userId
 * });
 *
 * logger.error("Database connection failed", {
 *     error
 * });
 */

/**
 * Generates an ISO-8601 timestamp for log entries.
 *
 * @returns {string}
 */
const timestamp = () => new Date().toISOString();

/**
 * Normalize an Error object into structured logging information.
 *
 * Error objects don't serialize particularly well when passed as
 * ordinary context values. This explicitly preserves the information
 * needed for debugging.
 *
 * @param {Error} error
 * Error to normalize.
 *
 * @returns {{
 *     name: string,
 *     message: string,
 *     stack?: string
 * }}
 */
function serializeError(error) {
    return {
        name: error.name,
        message: error.message,
        stack: error.stack
    };
}

/**
 * Writes a log entry using the configured logging implementation.
 *
 * This function acts as the single integration point for the application's
 * logging system. Switching from the built-in console to Pino (or another
 * logging library) only requires updating this function.
 *
 * Empty context objects are omitted from the output to reduce log noise.
 *
 * @param {"info"|"success"|"warn"|"error"|"debug"} level
 * Logging level.
 *
 * @param {string} message
 * Human-readable log message.
 *
 * @param {Object} [context={}]
 * Additional structured information associated with the log entry.
 */
function writeLog(level, message, context = {}) {

    const consoleMap = {
        info: console.log,
        success: console.log,
        warn: console.warn,
        error: console.error,
        debug: console.debug
    };

    const prefixes = {
        info: "INFO   ",
        success: "SUCCESS",
        warn: "WARN   ",
        error: "ERROR  ",
        debug: "DEBUG  "
    };

    consoleMap[level](
        `[${timestamp()}] ${prefixes[level]} ${message}`,
        ...(Object.keys(context).length ? [context] : [])
    );
}

/**
 * Application logger.
 *
 * Provides a consistent logging interface throughout the application.
 * Business logic should depend on this abstraction rather than directly
 * invoking console methods or a specific logging library.
 */
const logger = {

    /**
     * Log an informational message.
     *
     * @param {string} message
     * @param {Object} [context={}]
     */
    info(message, context = {}) {
        writeLog("info", message, context);
    },

    /**
     * Log the successful completion of an operation.
     *
     * @param {string} message
     * @param {Object} [context={}]
     */
    success(message, context = {}) {
        writeLog("success", message, context);
    },

    /**
     * Log a warning.
     *
     * @param {string} message
     * @param {Object} [context={}]
     */
    warn(message, context = {}) {
        writeLog("warn", message, context);
    },

    /**
     * Log an error.
     *
     * When an Error object is supplied as the first argument, its
     * name, message, and stack trace are preserved.
     *
     * @param {string|Error} message
     * Error message or Error instance.
     *
     * @param {Object} [context={}]
     * Additional structured information.
     */
    error(message, context = {}) {

        if (message instanceof Error) {

            writeLog(
                "error",
                `${message.name}: ${message.message}`,
                {
                    ...context,
                    error : serializeError(message)
                }
            );

            return;
        }

        writeLog("error", message, context);
    },

    /**
     * Log debugging information.
     *
     * Debug logs are emitted only in non-production environments.
     *
     * @param {string} message
     * @param {Object} [context={}]
     */
    debug(message, context = {}) {

        if (env.NODE_ENV !== "production") {
            writeLog("debug", message, context);
        }
    }
};

export default logger;