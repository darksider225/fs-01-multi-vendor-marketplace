const { body, param, query } = require('express-validator');

const createCouponValidator = [
  body('code')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Coupon code is required and must be less than 50 characters')
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Coupon code must contain only uppercase letters, numbers, or hyphens')
    .toUpperCase(),
  body('type')
    .optional()
    .isIn(['percentage', 'fixed'])
    .withMessage('Coupon type must be percentage or fixed'),
  body('value')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Coupon value must be between 0 and 100 for percentage, or a positive amount for fixed'),
  body('minOrderAmount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum order amount must be a positive number'),
  body('maxDiscount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Maximum discount must be a positive number'),
  body('usageLimit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Usage limit must be at least 1'),
  body('perUserLimit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Per-user limit must be at least 1'),
  body('applicableTo')
    .optional()
    .isIn(['all', 'category', 'product', 'vendor'])
    .withMessage('Applicable to must be all, category, product, or vendor'),
  body('applicableCategory')
    .optional()
    .isMongoId()
    .withMessage('Valid category ID is required when applicableTo is category'),
  body('applicableProduct')
    .optional()
    .isMongoId()
    .withMessage('Valid product ID is required when applicableTo is product'),
  body('applicableVendor')
    .optional()
    .isMongoId()
    .withMessage('Valid vendor ID is required when applicableTo is vendor'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (req.body.startDate && value <= req.body.startDate) {
        throw new Error('Coupon endDate must be after startDate');
      }
      return true;
    }),
];

const updateCouponValidator = [
  param('id').isMongoId().withMessage('Valid coupon ID is required'),
  body('code')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Coupon code must be less than 50 characters')
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Coupon code must contain only uppercase letters, numbers, or hyphens')
    .toUpperCase(),
  body('type')
    .optional()
    .isIn(['percentage', 'fixed'])
    .withMessage('Coupon type must be percentage or fixed'),
  body('value')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Coupon value must be between 0 and 100 for percentage, or a positive amount for fixed'),
  body('minOrderAmount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum order amount must be a positive number'),
  body('maxDiscount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Maximum discount must be a positive number'),
  body('usageLimit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Usage limit must be at least 1'),
  body('perUserLimit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Per-user limit must be at least 1'),
  body('applicableTo')
    .optional()
    .isIn(['all', 'category', 'product', 'vendor'])
    .withMessage('Applicable to must be all, category, product, or vendor'),
  body('applicableCategory')
    .optional()
    .isMongoId()
    .withMessage('Valid category ID is required when applicableTo is category'),
  body('applicableProduct')
    .optional()
    .isMongoId()
    .withMessage('Valid product ID is required when applicableTo is product'),
  body('applicableVendor')
    .optional()
    .isMongoId()
    .withMessage('Valid vendor ID is required when applicableTo is vendor'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (req.body.startDate && value <= req.body.startDate) {
        throw new Error('Coupon endDate must be after startDate');
      }
      return true;
    }),
];

const applyCouponValidator = [
  body('couponCode')
    .trim()
    .notEmpty()
    .withMessage('Coupon code is required')
    .trim()
    .escape(),
  body('orderId')
    .optional()
    .isMongoId()
    .withMessage('Valid order ID is required'),
];

const getCouponsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  query('type')
    .optional()
    .isIn(['percentage', 'fixed'])
    .withMessage('Type must be percentage or fixed'),
];

module.exports = { createCouponValidator, updateCouponValidator, applyCouponValidator, getCouponsValidator };