/**
 * Resend notification provider.
 *
 * Delivers email notifications through the Resend API.
 */

import { Resend } from "resend";
import NotificationProvider from "./provider.interface.js";

import env from "../../../config/env.js";
import logger from "../../../utils/logger.js";

class ResendProvider extends NotificationProvider {
  constructor() {
    super();
    this.resend = null;
  }

  async initialize() {
    this.resend = new Resend(env.RESEND_API_KEY);
    logger.success("Resend provider initialized.");
  }
  /**
   * Send an email through Resend.
   *
   * @param {Object} message
   *
   * @param {string} message.to
   * Recipient email address.
   *
   * @param {string} message.subject
   * Email subject.
   *
   * @param {string} message.html
   * Email body.
   *
   * @returns {Promise<void>}
   */
  async send({ to, subject, html }) {
    const { data, error } = await this.resend.emails.send({
      from: env.MAIL_FROM,
      to,
      subject,
      html,
    });

    if (error) {
      throw error;
    }

    logger.info(data);
  }
}

export default new ResendProvider();
