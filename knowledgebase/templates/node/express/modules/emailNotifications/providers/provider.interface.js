/**
 * Abstract contract for notification providers.
 *
 * Notification providers are responsible for delivering
 * outbound notifications through external services.
 *
 * Implementations may support:
 *
 * - SMTP
 * - Resend
 * - SendGrid
 * - Amazon SES
 *
 * Services should depend on this contract rather than
 * directly interacting with a specific provider.
 *
 * @abstract
 */
export default class NotificationProvider {
  /**
   * Initialize the notification provider.
   *
   * Performs any setup required before the provider can
   * be used, such as establishing connections, validating
   * credentials, or verifying access to external services.
   *
   * Implementations that don't require initialization may
   * provide an empty implementation.
   *
   * @returns {Promise<void>}
   *
   * @abstract
   */
  async initialize() {
    throw new Error("Method not implemented.");
  }

  /**
   * Send an email.
   *
   * @abstract
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
  async send() {
    throw new Error("Method not implemented.");
  }
}
