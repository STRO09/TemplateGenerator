import express from "express";

import controller from "../controllers/order.controller.js";

import validate from "../middleware/validation.middleware.js";

import { checkoutSchema, verifyPaymentSchema } from "../validators/order.validator.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
    "/checkout",
    authenticate,
    validate(checkoutSchema),
    controller.checkout,
);

router.post(
    "/checkout/verify",
    authenticate,
    validate(verifyPaymentSchema),
    controller.verifyPayment,
);

export default router;
