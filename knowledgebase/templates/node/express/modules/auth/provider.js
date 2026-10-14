import env from "../config/env.js";

import jwtStrategy from "./strategies/jwt/jwt.strategy.js";
import jwtRefreshStrategy from "./strategies/jwt-refresh/jwt-refresh.strategy.js";

/**
 * Authentication strategy registry.
 *
 * Maps configured authentication strategies to their implementations.
 *
 * The selected strategy is determined by AUTH_STRATEGY in the
 * application environment configuration.
 *
 * Supported strategies:
 * - jwt
 * - jwt-refresh
 *
 * AuthService depends only on the strategy returned by this provider,
 * allowing the underlying authentication mechanism to be changed
 * without modifying the authentication service.
 *
 * @type {Object<string, Object>}
 */
const strategies = {
    jwt: jwtStrategy,
    "jwt-refresh": jwtRefreshStrategy
};

/**
 * Active authentication strategy.
 *
 * @throws {Error}
 * If AUTH_STRATEGY does not match a registered strategy.
 */
const authStrategy = strategies[env.AUTH_STRATEGY];

if (!authStrategy) {
    throw new Error(
        `Unsupported authentication strategy: ${env.AUTH_STRATEGY}`
    );
}

export default authStrategy;