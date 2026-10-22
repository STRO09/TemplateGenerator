import orderService from "../services/order.service.js";

import asyncHandler from "../utils/asyncHandler.js";
import { success } from "../utils/response.js";

class OrderController {
    checkout = asyncHandler(async (req, res) => {
        const checkout = await orderService.checkout({
            userId: req.user.sub,
            items: req.body.items,
        });

        return success(res, {
            statusCode: 201,
            message: "Checkout created successfully.",
            data: checkout,
        });
    });

    verifyPayment = asyncHandler(async (req, res) => {
        const order = await orderService.verifyPayment({
            userId: req.user.sub,
            orderId: req.body.orderId,
            paymentId: req.body.paymentId,
            signature: req.body.signature,
        });

        return success(res, {
            message: "Payment verified and order created successfully.",
            data: order,
        });
    });
}

export default new OrderController();
