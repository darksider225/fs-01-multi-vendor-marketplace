const { body, param, query } = require('express-validator');

const addressFields = (prefix) => [
  body(`${prefix}.fullName`)
    .trim()
    .notEmpty()
    .withMessage('Full name is required'),
  body(`${prefix}.phone`)
    .trim()
    .notEmpty()
    .withMessage('Phone is required'),
  body(`${prefix}.line1`)
    .trim()
    .notEmpty()
    .withMessage('Address line 1 is required'),
  body(`${prefix}.city`)
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body(`${prefix}.state`)
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body(`${prefix}.pincode`)
    .trim()
    .notEmpty()
    .withMessage('Pincode is required'),
  body(`${prefix}.country`)
    .optional()
    .trim(),
  body(`${prefix}.line2`)
    .optional()
    .trim(),
];

const createOrderValidator = [
  ...addressFields('shippingAddress'),
];

const orderIdValidator = [
  param('id').isMongoId().withMessage('A valid order ID is required'),
];

const getOrdersQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).withMessage('Invalid order status'),
];

const cancelOrderValidator = [
  param('id').isMongoId().withMessage('A valid order ID is required'),
];

module.exports = {
  createOrderValidator,
  orderIdValidator,
  getOrdersQueryValidator,
  cancelOrderValidator,
};