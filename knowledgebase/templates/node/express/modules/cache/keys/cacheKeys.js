/**
 * Cache key factory.
 *
 * Centralizes cache key generation.
 *
 * This prevents cache-key duplication and
 * ensures consistent naming throughout
 * the application.
 */
const cacheKeys = {
  user: {
    byId: (id) => `user:${id}`,

    byEmail: (email) => `user:email:${email}`,
  },

  product: {
    byId: (id) => `product:${id}`,

    all: () => "products",

    byCategory: (category) => `products:category:${category}`,
  },

  order: {
    byId: (id) => `order:${id}`,

    byUser: (userId) => `orders:user:${userId}`,
  },

  auth: {
    verification: (email) => `verification:${email}`,

    passwordReset: (email) => `password-reset:${email}`,
  },
};

export default cacheKeys;
