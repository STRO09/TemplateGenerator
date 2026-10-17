import ApiError from "../utils/ApiError.js";
import logger from "../utils/logger.js";

export default function validate(schema) {

    return (req, res, next) => {

        logger.debug("Validating request.", {
            method: req.method,
            path: req.originalUrl,
        });

        const result = schema.safeParse(req.body);

        if (!result.success) {

            const errors = result.error.issues.map(issue => ({
                field: issue.path.join("."),
                message: issue.message
            }));

            logger.warn("Request validation failed.", {
                method: req.method,
                path: req.originalUrl,
                errors
            });

            return next(
                new ApiError({
                    statusCode: 400,
                    message: "Validation failed.",
                    errors
                })
            );
        }

        logger.debug("Request validation succeeded.", {
            method: req.method,
            path: req.originalUrl
        });

        req.body = result.data;

        next();

    };

}