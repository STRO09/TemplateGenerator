/**
 * Convert a user document into a safe API representation.
 *
 * Removes sensitive authentication fields before the user object
 * is returned outside the service layer.
 *
 * @param {Object} user
 * User document or plain user object.
 *
 * @returns {Object}
 * Sanitized user representation.
 */
export function serializeUser(user) {

    const data =
        typeof user.toObject === "function"
            ? user.toObject()
            : { ...user };

    delete data.passwordHash;

    return data;
}