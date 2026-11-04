const multer = require('multer');
const ApiError = require('../utils/apiError');
const httpStatus = require('../constants/httpStatus');

// Allowed file types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

// Max file size: 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Max number of files per upload
const MAX_FILES = 5;

/**
 * Multer storage configuration - memory storage for S3 upload
 */
const storage = multer.memoryStorage();

/**
 * File filter to validate image types
 */
const fileFilter = (req, file, cb) => {
  const extension = file.originalname.split('.').pop().toLowerCase();

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid file type: ${file.mimetype}. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`
      ),
      false
    );
  }

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return cb(
      new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid file extension: .${extension}. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`
      ),
      false
    );
  }

  cb(null, true);
};

/**
 * Multer configuration
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
});

/**
 * Middleware to handle multiple file uploads (array of images)
 * Field name: 'images'
 */
const uploadMultipleImages = upload.array('images', MAX_FILES);

/**
 * Middleware to handle errors from multer
 */
const uploadErrorHandler = (err, _req, res, next) => {
  if (err instanceof MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: 'File too large',
          details: `Each image must be ${MAX_FILE_SIZE / (1024 * 1024)}MB or less`,
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Too many files',
          details: `Maximum ${MAX_FILES} images allowed per upload`,
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Unexpected field name',
          details: 'Use "images" as the field name for file uploads',
        });
      default:
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: err.message,
        });
    }
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }

  next(err);
};

const MulterError = multer.MulterError;

module.exports = {
  upload,
  uploadMultipleImages,
  uploadErrorHandler,
  MAX_FILE_SIZE,
  MAX_FILES,
  ALLOWED_EXTENSIONS,
};