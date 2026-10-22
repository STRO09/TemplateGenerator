import repositories from "../db/provider.js";
import paymentProvider from "../payment/providers/provider.js";
import ApiError from "../utils/ApiError.js";

const {
    order: orderRepository,
    product: productRepository,
    checkout: checkoutRepository,
} = repositories;

class OrderService {
    async checkout({ userId, items }) {
        if (!items?.length) {
            throw new ApiError({
                statusCode: 400,
                message: "Checkout must contain at least one item.",
            });
        }

        const existingCheckout = await checkoutRepository.findActiveByUser(userId);

        if (existingCheckout) {
            return existingCheckout;
        }

        const productIds = items.map((item) => item.productId);

        const products = await productRepository.findManyByIds(productIds);

        if (products.length !== productIds.length) {
            throw new ApiError({
                statusCode: 400,
                message: "One or more products were not found.",
            });
        }

        const productMap = new Map(
            products.map((product) => [product._id.toString(), product]),
        );

        const checkoutItems = items.map(({ productId, quantity }) => {
            const product = productMap.get(productId);

            if (!product) {
                throw new ApiError({
                    statusCode: 400,
                    message: `Product ${productId} was not found.`,
                });
            }

            return {
                product: product._id,
                quantity,
                price: product.price,
            };
        });

        const total = checkoutItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
        );

        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

        const checkout = await checkoutRepository.create({
            user: userId,
            items: checkoutItems,
            total,
            currency: "INR",
            paymentStatus: "pending",
            expiresAt,
        });

        try {
            const razorpayOrder = await paymentProvider.createOrder({
                amount: total * 100,
                currency: "INR",
                receipt: `checkout_${checkout._id}`,
            });

            return checkoutRepository.updateById(checkout._id, {
                razorpayOrderId: razorpayOrder.id,
            });
        } catch (error) {
            await checkoutRepository.deleteById(checkout._id);

            throw error;
        }
    }

    async create({ userId, items }) {
        return orderRepository.create({
            user: userId,
            items,
            total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
            status: "confirmed",
        });
    }

    async verifyPayment({ userId, orderId, paymentId, signature }) {
        const checkout = await checkoutRepository.findPendingByUserAndRazorpayOrderId(userId, orderId);

        if (!checkout) {
            throw new ApiError({
                statusCode: 404,
                message: "Active checkout not found.",
            });
        }

        const isValid = paymentProvider.verifyPayment({
            orderId: checkout.razorpayOrderId,
            paymentId,
            signature,
        });

        if (!isValid) {
            throw new ApiError({
                statusCode: 400,
                message: "Invalid payment signature.",
            });
        }

        const payment = await paymentProvider.fetchPayment(paymentId);

        if (payment.order_id !== checkout.razorpayOrderId) {
            throw new ApiError({
                statusCode: 400,
                message: "Payment does not belong to this checkout.",
            });
        }

        if (payment.amount !== checkout.total * 100) {
            throw new ApiError({
                statusCode: 400,
                message: "Payment amount does not match checkout amount.",
            });
        }

        if (payment.status !== "captured") {
            throw new ApiError({
                statusCode: 400,
                message: `Payment is not captured. Current status: ${payment.status}.`,
            });
        }

        const order = await orderRepository.create({
            user: checkout.user,
            items: checkout.items,
            total: checkout.total,
            status: "confirmed",
        });

        await checkoutRepository.deleteById(checkout._id);

        return order;
    }
}

export default new OrderService();
