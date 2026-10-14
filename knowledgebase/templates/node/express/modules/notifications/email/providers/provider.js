/**
 * Notification provider registry.
 *
 * Maps configured notification providers
 * to their implementations.
 */

import env from "../../../config/env.js";

import smtpProvider from "./smtp.provider.js";
import resendProvider from "./resend.provider.js";
// import sendgridProvider from "./sendgrid.provider.js";

const providers = {
  smtp: smtpProvider,
  resend: resendProvider,
  // sendgrid: sendgridProvider,
};

const uninitializedProvider = new Proxy(
  {},
  {
    get() {
      throw new Error(
        "Notification provider is not initialized. Set NOTIFICATION_PROVIDER in your environment.",
      );
    },
  },
);

const providerName = env.NOTIFICATION_PROVIDER;

let notificationProvider;

if (providerName === undefined || providerName === "none") {
  notificationProvider = uninitializedProvider;
} else if (providerName === "") {
  throw new Error("NOTIFICATION_PROVIDER is configured but empty.");
} else {
  notificationProvider = providers[providerName];

  if (!notificationProvider) {
    throw new Error(`Unsupported notification provider: ${providerName}`);
  }
  await notificationProvider.initialize();
}
export default notificationProvider;
