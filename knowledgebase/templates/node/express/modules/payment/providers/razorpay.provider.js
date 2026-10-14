import Razorpay from "razorpay";
import crypto from "crypto";

import PaymentProvider from "./provider.interface.js";

import env from "../../config/env.js";

class RazorpayProvider extends PaymentProvider {
  constructor() {
    super();

    this.client = null;
  }

  getClient() {
    if (!this.client) {
      if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
        throw new Error(
          "Razorpay credentials are required when using the Razorpay payment provider.",
        );
      }

      this.client = new Razorpay({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET,
      });
    }

    return this.client;
  }

  /**
   * Create an order through Razorpay.
   *
   * @param {Object} options
   * @param {number} options.amount
   * Amount in the smallest currency unit.
   *
   * @param {string} options.currency
   * Currency code.
   *
   * @param {string} [options.receipt]
   * Receipt identifier.
   *
   * @param {Object} [options.notes]
   * Additional metadata.
   *
   * @returns {Promise<Object>}
   */
  async createOrder({ amount, currency, receipt, notes }) {
    return this.getClient().orders.create({
      amount,
      currency,
      receipt,
      notes,
    });
  }

  /**
   * Verify a payment returned by Razorpay Checkout.
   *
   * @param {Object} payment
   * @param {string} payment.orderId
   * Server-side Razorpay order ID.
   * @param {string} payment.paymentId
   * Razorpay payment ID returned by Checkout.
   * @param {string} payment.signature
   * Signature returned by Checkout.
   *
   * @returns {boolean}
   */
  verifyPayment({ orderId, paymentId, signature }) {
    const generatedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(generatedSignature),
      Buffer.from(signature),
    );
  }

  /**
   * Fetch payment details from Razorpay.
   *
   * Retrieves the current state of a payment from Razorpay using
   * the payment ID returned by Razorpay Checkout.
   *
   * @param {string} paymentId
   * Razorpay payment ID.
   *
   * @returns {Promise<Object>}
   * Razorpay payment details.
   */
  async fetchPayment(paymentId) {
    return this.getClient().payments.fetch(paymentId);
  }
}

export default new RazorpayProvider();
