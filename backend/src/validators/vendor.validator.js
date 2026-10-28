const { body, param } = require('express-validator');

const applyValidator = [
  body('storeName')
    .trim()
    .notEmpty().withMessage('Store name is required')
    .isLength({ max: 120 }).withMessage('Store name cannot exceed 120 characters'),
  body('slug')
    .trim()
    .notEmpty().withMessage('Store slug is required')
    .isLength({ max: 100 }).withMessage('Slug cannot exceed 100 characters')
    .isSlug().withMessage('Slug must be URL-friendly'),
  body('contactEmail')
    .isEmail().withMessage('Please provide a valid contact email address'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s]{10,15}$/).withMessage('Please provide a valid phone number'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
];

const profileValidator = [
  body('storeName')
    .optional()
    .trim()
    .isLength({ max: 120 }).withMessage('Store name cannot exceed 120 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s]{10,15}$/).withMessage('Please provide a valid phone number'),
  body('address')
    .optional()
    .isObject().withMessage('Address must be an object'),
  body('logo')
    .optional()
    .trim(),
  body('banner')
    .optional()
    .trim(),
];

const settingsValidator = [
  body('payoutDetails')
    .optional()
    .isObject().withMessage('Payout details must be an object'),
];

const approveValidator = [
  param('id')
    .isMongoId().withMessage('Valid vendor ID is required'),
  body('status')
    .isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('reason')
    .optional()
    .trim(),
];

module.exports = { applyValidator, profileValidator, settingsValidator, approveValidator };
