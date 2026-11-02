const { body, param, query } = require('express-validator');

const createProductValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Product title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('category')
    .isMongoId().withMessage('A valid category is required'),
  body('price')
    .isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),
  body('brand')
    .optional()
    .trim(),
  body('images')
    .optional()
    .isArray().withMessage('Images must be an array of URLs'),
];

const productIdValidator = [
  param('id')
    .isMongoId().withMessage('A valid product ID is required'),
];

const updateProductValidator = [
  param('id')
    .isMongoId().withMessage('A valid product ID is required'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('category')
    .optional()
    .isMongoId().withMessage('A valid category is required'),
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),
  body('brand')
    .optional()
    .trim(),
  body('images')
    .optional()
    .isArray().withMessage('Images must be an array of URLs'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'unpublished', 'archived']).withMessage('Invalid product status'),
];

const productQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['draft', 'published', 'unpublished', 'archived']).withMessage('Invalid product status'),
  query('category')
    .optional()
    .isMongoId().withMessage('A valid category is required'),
  query('search')
    .optional()
    .trim(),
];

module.exports = { createProductValidator, productIdValidator, updateProductValidator, productQueryValidator };

