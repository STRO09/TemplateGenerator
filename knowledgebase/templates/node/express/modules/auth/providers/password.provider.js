import repositories from "../../db/provider.js";
import { compare } from "../../utils/hashing.js";
import ApiError from "../../utils/ApiError.js";

const { user: userRepository } = repositories;

/**
 * Password authentication provider.
 *
 * Responsible for authenticating users using an email and password.
 *
 * This provider:
 * - Retrieves the user with their password hash.
 * - Compares the supplied password against the stored hash.
 * - Returns the authenticated user.
 *
 * It does not:
 * - Generate tokens.
 * - Manage sessions.
 * - Set cookies.
 * - Handle HTTP requests or responses.
 */
class PasswordProvider {

    /**
     * Authenticate a user using email and password.
     *
     * @param {Object} credentials
     * @param {string} credentials.email
     * User's email address.
     *
     * @param {string} credentials.password
     * Plain-text password supplied during login.
     *
     * @returns {Promise<import("mongoose").Document>}
     * Authenticated user.
     *
     * @throws {ApiError}
     * If the credentials are invalid.
     */
    async authenticate({ email, password }) {

        const user =
            await userRepository.findByEmailWithPassword(email);

        /*
         * Do not reveal whether the email exists.
         *
         * Both an unknown email and an incorrect password should
         * produce the same authentication error.
         */
        if (!user) {
            throw new ApiError({
                statusCode: 401,
                message: "Invalid email or password."
            });
        }

        const passwordValid =
            await compare(password, user.passwordHash);

        if (!passwordValid) {
            throw new ApiError({
                statusCode: 401,
                message: "Invalid email or password."
            });
        }

        return user;
    }
}

export default new PasswordProvider();