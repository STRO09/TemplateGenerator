import env from "../../config/env.js";

import memoryProvider from "./inMemory.provider.js";
import redisProvider from "./redis.provider.js";

const providers = {
  memory: memoryProvider,
  redis: redisProvider,
};

const cacheProvider = providers[env.CACHE_PROVIDER];

if (!cacheProvider) {
  throw new Error(`Unsupported cache provider: ${env.CACHE_PROVIDER}`);
}

export default cacheProvider;
