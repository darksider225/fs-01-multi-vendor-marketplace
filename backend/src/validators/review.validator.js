const { body, param, query } = require('express-validator');

const createReviewValidator = [
  body('product').optional().isMongoId().withMessage('Valid product ID is required'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').optional().trim().isLength({ max: 150 }).withMessage('Title cannot exceed 150 characters'),
  body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters'),
  body('images').optional().isArray().withMessage('Images must be an array'),
];

const updateReviewValidator = [
  param('id').isMongoId().withMessage('Valid review ID is required'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').optional().trim().isLength({ max: 150 }).withMessage('Title cannot exceed 150 characters'),
  body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters'),
];

module.exports = { createReviewValidator, updateReviewValidator };
