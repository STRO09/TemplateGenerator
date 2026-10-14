/**
 * Middleware for processing multipart/form-data
 * requests.
 *
 * This middleware only parses incoming files and
 * attaches them to the request object.
 *
 * File persistence is delegated to the configured
 * storage provider.
 *
 * Supported methods:
 *
 * - upload.single()
 * - upload.array()
 * - upload.fields()
 */

import multer from "multer";

import uploadConfig from "../config/upload.config.js";

const fileFilter = (req, file, callback) => {
  const allowed = uploadConfig.allowedMimeTypes.includes(file.mimetype);

  if (!allowed) {
    return callback(new Error("Unsupported file type."));
  }

  callback(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: uploadConfig.maxFileSize,
  },

  fileFilter,
});

export default upload;

/*
 * Single file
 *
 * upload.single("avatar") // the string is the name of the field in the form
 *
 * req.file
 */

/*
 * Multiple files
 *
 * upload.array("images", 10)
 *
 * req.files
 */

/*
 * Multiple fields
 *
 * upload.fields([
 *   {
 *     name: "thumbnail",
 *     maxCount: 1
 *   },
 *   {
 *     name: "gallery",
 *     maxCount: 5
 *   }
 * ])
 *
 * req.files.thumbnail
 * req.files.gallery
 */
