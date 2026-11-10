const { body, param } = require('express-validator');

const checkoutValidator = [
  body('orderId')
    .isMongoId()
    .withMessage('A valid order ID is required'),
];

const razorpayVerifyValidator = [
  body('razorpay_order_id')
    .trim()
    .notEmpty()
    .withMessage('razorpay_order_id is required'),
  body('razorpay_payment_id')
    .trim()
    .notEmpty()
    .withMessage('razorpay_payment_id is required'),
  body('razorpay_signature')
    .trim()
    .notEmpty()
    .withMessage('razorpay_signature is required'),
];

const paymentIdValidator = [
  param('orderId')
    .isMongoId()
    .withMessage('A valid order ID is required'),
];

module.exports = {
  checkoutValidator,
  razorpayVerifyValidator,
  paymentIdValidator,
};