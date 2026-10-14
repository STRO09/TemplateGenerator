/**
 * File storage provider registry.
 *
 * Maps configured storage providers to their implementations.
 */

import env from "../../config/env.js";

import localProvider from "./local.provider.js";

// import s3Provider from "./s3.provider.js";

// import cloudinaryProvider from "./cloudinary.provider.js";

const providers = {
  local: localProvider,

  // s3: s3Provider,

  // cloudinary: cloudinaryProvider,
};

const fileStorageProvider = providers[env.FILE_STORAGE_PROVIDER];

if (!fileStorageProvider) {
  throw new Error(`Unsupported file storage provider: ${env.FILE_STORAGE_PROVIDER}`);
}

export default fileStorageProvider;
