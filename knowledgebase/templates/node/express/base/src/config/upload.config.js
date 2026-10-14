/**
 * File upload configuration.
 *
 * Centralizes upload-related settings so they can be shared across
 * middleware and storage providers.
 *
 * Supported settings include:
 *
 * - Storage destination
 * - File size limits
 * - Allowed MIME types
 *
 * Environment-specific values should be configured here instead of
 * being scattered throughout the application.
 */

import path from "path";

export default {
  destination: path.resolve("src/fileUploads/storage"),

  maxFileSize: 5 * 1024 * 1024,

  filenameSeparator: "-",

  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ],
};
