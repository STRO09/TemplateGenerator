/**
 * Abstract contract for file storage providers.
 *
 * Storage providers are responsible only for
 * persisting files after they have been parsed
 * by the upload middleware.
 *
 * The upload middleware is intentionally kept
 * separate from the persistence layer.
 *
 * Supported storage backends may include:
 *
 * - Local filesystem
 * - AWS S3
 * - Cloudinary
 * - Azure Blob Storage
 *
 * @abstract
 */
export default class FileStorageProvider {
  /**
   * Persist an uploaded file.
   *
   * @abstract
   *
   * @param {Express.Multer.File} file
   *
   * @returns {Promise<Object>}
   */
  async upload() {
    throw new Error("Method not implemented.");
  }

  /**
   * Delete a stored file.
   *
   * @abstract
   *
   * @param {string} identifier
   *
   * @returns {Promise<void>}
   */
  async delete() {
    throw new Error("Method not implemented.");
  }
}
