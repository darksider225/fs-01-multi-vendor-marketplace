const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const ApiError = require('../utils/apiError');
const httpStatus = require('../constants/httpStatus');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

/**
 * Upload a single file to S3
 * @param {Object} file - Multer file object
 * @param {string} folder - S3 folder prefix (e.g., 'products')
 * @returns {Promise<string>} - Public URL of uploaded file
 */
const uploadSingleFile = async (file, folder = 'products') => {
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No file provided');
  }

  const fileExtension = file.originalname.split('.').pop().toLowerCase();
  const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3Client.send(command);

  const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
  return fileUrl;
};

/**
 * Upload multiple files to S3
 * @param {Array} files - Array of Multer file objects
 * @param {string} folder - S3 folder prefix (e.g., 'products')
 * @returns {Promise<Array<string>>} - Array of public URLs
 */
const uploadMultipleFiles = async (files, folder = 'products') => {
  if (!files || files.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No files provided');
  }

  const uploadPromises = files.map((file) => uploadSingleFile(file, folder));
  return Promise.all(uploadPromises);
};

/**
 * Delete a file from S3
 * @param {string} fileUrl - Full S3 URL of the file to delete
 * @returns {Promise<void>}
 */
const deleteFile = async (fileUrl) => {
  if (!fileUrl) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'File URL is required');
  }

  // Extract key from URL using its pathname (handles bucket host correctly)
  let key = fileUrl;
  try {
    const parsed = new URL(fileUrl);
    key = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
  } catch {
    // Fallback for raw keys passed in (not a URL)
    key = fileUrl.replace(/^\/+/, '');
  }

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
};

module.exports = {
  s3Client,
  uploadSingleFile,
  uploadMultipleFiles,
  deleteFile,
  BUCKET_NAME,
};