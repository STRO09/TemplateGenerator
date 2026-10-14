/**
 * SMTP notification provider.
 *
 * Delivers email notifications through an SMTP server.
 */

import nodemailer from "nodemailer";

import NotificationProvider from "./provider.interface.js";

import env from "../../../config/env.js";

class SmtpProvider extends NotificationProvider {
  constructor() {
    super();

    this.transporter = null;
  }

  async initialize() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,

      port: Number(env.SMTP_PORT),

      secure: env.SMTP_SECURE === "true",

      auth:
        env.SMTP_USER && env.SMTP_PASSWORD
          ? {
              user: env.SMTP_USER,

              pass: env.SMTP_PASSWORD,
            }
          : undefined,
    });
    this.transporter
      .verify()
      .then(() => {
        console.log("SMTP server is ready.");
      })
      .catch((error) => {
        console.error(error);
      });
  }

  /**
   * Send an email through SMTP.
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
    const info = await this.transporter.sendMail({
      from: env.MAIL_FROM,
      to,
      subject,
      html,
    });

    logger.info(info);
  }
}

export default new SmtpProvider();
