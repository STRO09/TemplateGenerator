import crypto from "crypto";

import env from "../config/env.js";

import cacheProvider from "../cache/providers/provider.js";
import notificationProvider from "../notifications/email/providers/provider.js";

import repositories from "../db/provider.js";

import { sign, verify } from "../utils/jwt.js";

import emailVerificationTemplate from "../notifications/email/templates/emailVerification.template.js";

import ApiError from "../utils/ApiError.js";

const { user: userRepository } = repositories;

class VerificationService {
  /**
   * Send an email verification link.
   *
   * @param {string} userId
   * @param {string} email
   *
   * @returns {Promise<void>}
   */
  async send(userId) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new ApiError({
        statusCode: 404,
        message: "User not found.",
      });
    }

    const email = user.email;
    const token = sign(
      {
        sub: userId,
        type: "email-verification",
      },
      {
        expiresIn: env.EMAIL_VERIFICATION_EXPIRES_IN,
      },
    );

    const cacheKey = `email-verification:${crypto
      .createHash("sha256")
      .update(token)
      .digest("hex")}`;

    await cacheProvider.set(
      cacheKey,
      userId,
      env.EMAIL_VERIFICATION_EXPIRES_IN,
    );

    // const verificationUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;
    const verificationUrl = `http://localhost:3000/api/auth/verify-email?token=${token}`;

    const template = emailVerificationTemplate({
      verificationUrl,
    });

    await notificationProvider.send({
      to: email,
      subject: template.subject,
      html: template.html,
    });
  }

  /**
   * Verify an email verification token.
   *
   * @param {string} token
   *
   * @returns {Promise<void>}
   */
  async verifyEmail(token) {
    const payload = verify(token);

    if (payload.type !== "email-verification") {
      throw new ApiError({
        statusCode: 400,
        message: "Invalid verification token.",
      });
    }

    const cacheKey = `email-verification:${crypto
      .createHash("sha256")
      .update(token)
      .digest("hex")}`;

    const exists = await cacheProvider.get(cacheKey);

    if (!exists) {
      throw new ApiError({
        statusCode: 400,
        message: "Verification token is invalid or has expired.",
      });
    }

    await userRepository.updateById(payload.sub, {
      isVerified: true,
    });

    await cacheProvider.delete(cacheKey);
  }
}

export default new VerificationService();
