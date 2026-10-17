import passwordProvider from "../auth/providers/password.provider.js";
import authStrategy from "../auth/provider.js";
import repositories from "../db/provider.js";
import { hash } from "../utils/hashing.js";
import { hashRefreshToken } from "../utils/refreshToken.js";
import { generateFromEmail } from "../utils/usernameGenerator.js";
import { serializeUser } from "../utils/userSerializer.js";
const { user: userRepository, refreshSession: refreshSessionRepository } =
  repositories;

import ApiError from "../utils/ApiError.js";
import logger from "../utils/logger.js";

class AuthService {
  async register({
    // firstName, lastName,
    email,
    password,
  }) {
    logger.info("User registration attempt", {
      email,
    });

    const emailExists = await userRepository.existsByEmail(email);

    if (emailExists) {
      throw new ApiError({
        statusCode: 409,
        message: "Email is already registered.",
      });
    }

    // let username;

    // for (let attempt = 0; attempt < 5; attempt++) {
    //   const candidate = generateFromEmail(email);

    //   const usernameExists = await userRepository.existsByUsername(candidate);

    //   if (!usernameExists) {
    //     username = candidate;
    //     break;
    //   }
    // }

    // if (!username) {
    //   throw new ApiError({
    //     statusCode: 500,
    //     message: "Unable to generate a unique username.",
    //   });
    // }

    const passwordHash = await hash(password);

    const user = await userRepository.create({
      //   firstName,
      //   lastName,
      email: email.toLowerCase(),
      //   username,
      passwordHash,
    });

    logger.success("User registered", {
      userId: user._id.toString(),
    });

    return serializeUser(user);
  }

  async login({ email, password }, context = {}) {
    logger.info("Authentication attempt", {
      email,
    });

    const user = await passwordProvider.authenticate({
      email,
      password,
    });

    const credentials = await authStrategy.issue(user, context);

    logger.success("User authenticated", {
      userId: user._id.toString(),
    });

    return {
      user: serializeUser(user),
      ...credentials,
    };
  }

  async refresh(refreshToken, context = {}) {
    return authStrategy.refresh(refreshToken, context);
  }

  async logout(refreshToken) {
    const tokenHash = hashRefreshToken(refreshToken);
    const revoked = await refreshSessionRepository.revoke(tokenHash);

    if (!revoked) {
      throw new ApiError({
        statusCode: 404,
        message: "Refresh token not found.",
      });
    }

    return revoked;
  }

  async logoutAll(userId) {
    await refreshSessionRepository.revokeAllForUser(userId);

    return true;
  }
}

export default new AuthService();
