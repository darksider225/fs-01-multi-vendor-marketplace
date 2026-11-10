const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth');
const { ROLES } = require('../../constants/statusCodes');
const validate = require('../../middlewares/validate');
const paymentController = require('../../controllers/payment.controller');
const { checkoutValidator, paymentIdValidator, razorpayVerifyValidator } = require('../../validators/payment.validator');

const router = express.Router();

// Stripe Checkout and payment lookup - customer only
router.post('/checkout', authenticate, authorize(ROLES.CUSTOMER), checkoutValidator, validate, paymentController.createCheckout);

// Razorpay Checkout - customer only
router.post('/checkout/razorpay', authenticate, authorize(ROLES.CUSTOMER), checkoutValidator, validate, paymentController.createRazorpayCheckout);

// Razorpay Payment Verification - customer only
router.post('/verify/razorpay', authenticate, authorize(ROLES.CUSTOMER), razorpayVerifyValidator, validate, paymentController.verifyRazorpayPayment);

// Payment lookup - customer only
router.get('/:orderId', authenticate, authorize(ROLES.CUSTOMER), paymentIdValidator, validate, paymentController.getPaymentByOrder);

module.exports = router;