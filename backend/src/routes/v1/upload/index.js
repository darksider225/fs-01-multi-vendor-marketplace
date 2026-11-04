const express = require('express');
const { authenticate, authorize } = require('../../../middlewares/auth');
const { uploadMultipleImages, uploadErrorHandler } = require('../../../middlewares/upload.middleware');
const { ROLES } = require('../../../constants/statusCodes');
const { uploadProductImages, deleteProductImage } = require('../../../controllers/upload.controller');

const router = express.Router();

// All routes require authentication and vendor role
router.use(authenticate);
router.use(authorize(ROLES.VENDOR));

/**
 * POST /api/v1/uploads/products
 * Upload multiple product images to S3
 * Only authenticated vendors can upload
 */
router.post(
  '/products',
  uploadMultipleImages,
  uploadErrorHandler,
  uploadProductImages
);

/**
 * DELETE /api/v1/uploads/products/:key
 * Delete a product image from S3
 * Only authenticated vendors can delete
 */
// Delete by S3 object key (may contain slashes) or by full URL passed as query/body
router.delete('/products', deleteProductImage);
router.delete(/^\/products\/(.*)$/, deleteProductImage);

module.exports = router;