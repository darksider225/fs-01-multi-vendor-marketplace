const { body } = require('express-validator');

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

module.exports = { createProductValidator };
