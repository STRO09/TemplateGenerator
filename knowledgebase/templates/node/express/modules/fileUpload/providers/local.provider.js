/**
 * Local filesystem storage provider.
 *
 * Implements the file storage provider contract by persisting
 * uploaded files to the application's local filesystem.
 *
 * Uploaded files are written to the directory configured in
 * `upload.config.js` and are exposed through a generated public URL.
 */
import fs from "fs";
import path from "path";

import FileStorageProvider from "./provider.interface.js";

import uploadConfig from "../config/upload.config.js";

class LocalProvider extends FileStorageProvider {
  /**
   * Create a local storage provider.
   *
   * Ensures that the configured upload directory exists before
   * the provider begins accepting file uploads.
   */
  constructor() {
    super();

    if (!fs.existsSync(uploadConfig.destination)) {
      fs.mkdirSync(uploadConfig.destination, {
        recursive: true,
      });
    }
  }

  /**
   * Persist an uploaded file to the local filesystem.
   *
   * The file is renamed using a timestamp prefix to reduce the
   * likelihood of filename collisions while preserving the original
   * filename.
   *
   * @param {Express.Multer.File} file
   * Uploaded file produced by Multer.
   *
   * @returns {Promise<{
   *   filename: string,
   *   path: string,
   *   url: string
   * }>}
   * Metadata describing the stored file.
   */
  async upload(file) {
    const sanitizedFilename = file.originalname.replace(
      /\s+/g,
      uploadConfig.filenameSeparator,
    );

    const filename = `${Date.now()}-${sanitizedFilename}`;

    const filepath = path.join(
      uploadConfig.destination,
      filename,
    );

    await fs.promises.writeFile(
      filepath,
      file.buffer,
    );

    return {
      filename,
      path: filepath,
      url: `/uploads/${filename}`,
    };
  }

  /**
   * Delete a previously stored file.
   *
   * @param {string} filepath
   * Absolute path to the stored file.
   *
   * @returns {Promise<void>}
   */
  async delete(filepath) {
    await fs.promises.unlink(filepath);
  }
}

export default new LocalProvider();