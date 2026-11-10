const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const httpStatus = require('../constants/httpStatus');
const ApiError = require('../utils/apiError');
const paymentService = require('../services/payment.service');

const createCheckout = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const result = await paymentService.createCheckoutSession(orderId, req.user._id);
  return sendSuccess(res, httpStatus.OK, 'Checkout session created.', result);
});

const createRazorpayCheckout = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const result = await paymentService.createRazorpayOrder(orderId, req.user._id);
  return sendSuccess(res, httpStatus.OK, 'Razorpay order created.', result);
});

const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.verifyRazorpayPayment(req.body, req.user._id);
  return sendSuccess(res, httpStatus.OK, 'Payment verified.', result);
});

const getPaymentByOrder = asyncHandler(async (req, res) => {
  const result = await paymentService.getPaymentByOrder(req.params.orderId, req.user._id);
  return sendSuccess(res, httpStatus.OK, 'Payment retrieved.', result);
});

const handleWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const result = await paymentService.handleWebhook(req.body, sig, webhookSecret);
  return res.status(200).json(result);
});

module.exports = {
  createCheckout,
  createRazorpayCheckout,
  verifyRazorpayPayment,
  getPaymentByOrder,
  handleWebhook,
};