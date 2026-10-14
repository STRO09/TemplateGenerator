import env from "../../config/env.js";
import razorpayProvider from "./razorpay.provider.js";

const providers = {
  razorpay: razorpayProvider,
};

const uninitializedProvider = new Proxy(
  {},
  {
    get() {
      throw new Error(
        "Payment provider is not initialized. Set PAYMENT_PROVIDER in your environment.",
      );
    },
  },
);

const providerName = env.PAYMENT_PROVIDER;

let paymentProvider;

if (providerName === undefined || providerName === "none") {
  paymentProvider = uninitializedProvider;
} else if (providerName === "") {
  throw new Error("PAYMENT_PROVIDER is configured but empty.");
} else {
  paymentProvider = providers[providerName];

  if (!paymentProvider) {
    throw new Error(`Unsupported payment provider: ${providerName}`);
  }
}

export default paymentProvider;
