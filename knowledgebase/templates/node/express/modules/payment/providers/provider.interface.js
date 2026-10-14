/**
 * Abstract contract for payment providers.
 *
 * Payment providers are responsible for communicating
 * with external payment gateways.
 *
 * @abstract
 */
export default class PaymentProvider {
  /**
   * Create a payment order.
   *
   * @abstract
   *
   * @param {Object} options
   * @param {number} options.amount
   * Amount in the smallest currency unit.
   *
   * @param {string} options.currency
   * Currency code.
   *
   * @param {string} [options.receipt]
   * Provider receipt identifier.
   *
   * @param {Object} [options.notes]
   * Additional provider metadata.
   *
   * @returns {Promise<Object>}
   */
  async createOrder() {
    throw new Error("Method not implemented.");
  }

  verifyPayment() {
    throw new Error("Method not implemented.");
  }

  async fetchPayment() {
    throw new Error("Method not implemented.");
  }
}
