/**
 * Wraps an asynchronous Express route handler.
 *
 * Any rejected Promise or thrown exception is automatically forwarded
 * to Express' error handling middleware, eliminating repetitive
 * try/catch blocks in controllers.
 *
 * @param {Function} handler Express route handler.
 * @returns {Function} Wrapped Express middleware.
 */
const asyncHandler = (handler) => {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
};

export default asyncHandler;