/**
 * Base contract for authentication token strategies.
 *
 * Token strategies are responsible for establishing an authenticated
 * session/token state for a user.
 *
 * Implementations may issue:
 * - A single JWT access token.
 * - An access token and refresh token pair.
 * - Other authentication/session mechanisms.
 */
export default class TokenStrategy {

    /**
     * Issue authentication credentials for a user.
     *
     * @param {Object} user
     * Authenticated user.
     *
     * @returns {Promise<Object>|Object}
     * Authentication credentials issued by the strategy.
     */
    async issue(user) {
        throw new Error("Method not implemented.");
    }
}