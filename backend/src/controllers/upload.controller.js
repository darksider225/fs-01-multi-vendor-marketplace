const { uploadMultipleFiles, deleteFile } = require('../services/s3.service');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const httpStatus = require('../constants/httpStatus');

/**
 * POST /api/v1/uploads/products
 * Upload multiple product images to S3
 * Only authenticated vendors can upload
 */
const uploadProductImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No files uploaded');
  }

  const fileUrls = await uploadMultipleFiles(req.files, 'products');

  return sendSuccess(res, httpStatus.CREATED, 'Images uploaded successfully', {
    images: fileUrls,
  });
});

/**
 * DELETE /api/v1/uploads/products/:key
 * Delete a product image from S3
 * Only authenticated vendors can delete
 */
const deleteProductImage = asyncHandler(async (req, res) => {
  const key = req.params.key || req.params[0] || req.query.key || req.body.key || req.body.url;

  if (!key) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Image key or URL is required');
  }

  // The key can be either a full URL or just the S3 object key
  const fileUrl = String(key).startsWith('http')
    ? String(key)
    : `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${String(key).replace(/^\/+/, '')}`;

  await deleteFile(fileUrl);

  return sendSuccess(res, httpStatus.OK, 'Image deleted successfully', {
    key: String(key),
  });
});

module.exports = { uploadProductImages, deleteProductImage };