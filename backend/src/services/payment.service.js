const { Order, Product, Payment, ProcessedWebhook } = require('../models');
const { stripeClient } = require('../config/stripe');
const { razorpayInstance } = require('../config/razorpay');
const ApiError = require('../utils/apiError');
const httpStatus = require('../constants/httpStatus');

const FRONTEND_SUCCESS_URL = process.env.FRONTEND_SUCCESS_URL || 'http://localhost:3000/payment/success';
const FRONTEND_CANCEL_URL = process.env.FRONTEND_CANCEL_URL || 'http://localhost:3000/payment/cancel';

const createCheckoutSession = async (orderId, customerId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(httpStatus.NOT_FOUND, 'Order not found.');
  if (order.customer.toString() !== customerId.toString()) throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to access this order.');
  if (order.orderStatus !== 'pending') throw new ApiError(httpStatus.BAD_REQUEST, 'Order is not in pending status.');

  const existingPayment = await Payment.findOne({ order: orderId });
  if (existingPayment && existingPayment.status === 'paid') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment already completed for this order.');
  }
  if (order.stripeCheckoutSessionId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Checkout session already exists for this order.');
  }

  const lineItems = order.items.map((item) => ({
    price_data: {
      currency: order.currency.toLowerCase(),
      product_data: {
        name: item.title,
        ...(item.sku && { sku: item.sku }),
        ...(item.image && { images: [item.image] }),
      },
      unit_amount: Math.round(item.unitPrice * 100),
    },
    quantity: item.quantity,
  }));

  const session = await stripeClient.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${FRONTEND_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: FRONTEND_CANCEL_URL,
    metadata: { orderId: order._id.toString(), customerId: customerId.toString() },
    payment_intent_data: { metadata: { orderId: order._id.toString() } },
  });

  order.stripeCheckoutSessionId = session.id;
  order.stripePaymentIntentId = session.payment_intent || null;
  order.platformFeeAmount = Math.round(order.subtotal * 0.1);
  await order.save();

  return { sessionId: session.id, checkoutUrl: session.url };
};
const handleWebhook = async (payload, sigHeader, webhookSecret) => {
  let event;
  try {
    event = stripeClient.webhooks.constructEvent(payload, sigHeader, webhookSecret);
  } catch (err) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Webhook signature verification failed: ' + err.message);
  }
  const existing = await ProcessedWebhook.findOne({ eventId: event.id });
  if (existing) return { status: 'ignored', reason: 'Duplicate event' };
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    case 'payment_intent.canceled':
      await handlePaymentCanceled(event.data.object);
      break;
    case 'charge.refunded':
      await handleChargeRefunded(event.data.object);
      break;
    default: break;
  }
  await ProcessedWebhook.create({ eventId: event.id, eventType: event.type, processedAt: new Date() });
  return { status: 'processed' };
};

const handleCheckoutSessionCompleted = async (session) => {
  const orderId = session.metadata.orderId;
  const paymentIntentId = session.payment_intent;
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(httpStatus.NOT_FOUND, 'Order not found.');
  const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);
  const chargeId = paymentIntent.latest_charge;
  const payment = new Payment({
    order: order._id, user: order.customer, method: 'card', provider: 'stripe',
    transactionId: paymentIntentId, stripePaymentIntentId: paymentIntentId, stripeChargeId: chargeId,
    amount: order.totalAmount, currency: order.currency, status: 'paid', paidAt: new Date(),
    receiptUrl: paymentIntent.charges.data[0]?.receipt_url || null,
    metadata: { stripeSessionId: session.id, paymentIntentId },
  });
  await payment.save();
  order.payment = payment._id;
  order.paymentStatus = 'paid';
  order.orderStatus = 'confirmed';
  await order.save();
  return payment;
};

const handlePaymentFailed = async (paymentIntent) => {
  const orderId = paymentIntent.metadata.orderId;
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(httpStatus.NOT_FOUND, 'Order not found.');
  order.paymentStatus = 'failed';
  order.orderStatus = 'cancelled';
  await order.save();
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
  }
  let payment = await Payment.findOne({ order: order._id });
  if (!payment) {
    payment = new Payment({ order: order._id, user: order.customer, method: 'card', provider: 'stripe', transactionId: paymentIntent.id, stripePaymentIntentId: paymentIntent.id, amount: order.totalAmount, currency: order.currency, status: 'failed', failureReason: paymentIntent.last_payment_error?.message || 'Payment failed', failedAt: new Date() });
    await payment.save();
  } else {
    payment.status = 'failed';
    payment.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
    payment.failedAt = new Date();
    payment.stripePaymentIntentId = paymentIntent.id;
    payment.transactionId = paymentIntent.id;
    await payment.save();
  }
  return payment;
};

const handlePaymentCanceled = async (paymentIntent) => {
  const orderId = paymentIntent.metadata.orderId;
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(httpStatus.NOT_FOUND, 'Order not found.');
  order.paymentStatus = 'failed';
  order.orderStatus = 'cancelled';
  await order.save();
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
  }
  let payment = await Payment.findOne({ order: order._id });
  if (!payment) {
    payment = new Payment({ order: order._id, user: order.customer, method: 'card', provider: 'stripe', transactionId: paymentIntent.id, stripePaymentIntentId: paymentIntent.id, amount: order.totalAmount, currency: order.currency, status: 'failed', failureReason: 'Payment canceled', failedAt: new Date() });
    await payment.save();
  } else {
    payment.status = 'failed';
    payment.failureReason = 'Payment canceled';
    payment.failedAt = new Date();
    await payment.save();
  }
  return payment;
};

const handleChargeRefunded = async (charge) => {
  const paymentIntentId = charge.payment_intent;
  const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
  if (!payment) throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found for charge.');
  payment.status = 'refunded';
  payment.refundAmount = charge.amount_refunded / 100;
  payment.stripeRefundId = charge.id;
  payment.refund = { amount: charge.amount_refunded / 100, reason: 'customer_request', status: 'full', processedAt: new Date() };
  await payment.save();
  const order = await Order.findById(payment.order);
  if (order) { order.paymentStatus = 'refunded'; await order.save(); }
  return payment;
};

const getPaymentByOrder = async (orderId, customerId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(httpStatus.NOT_FOUND, 'Order not found.');
  if (order.customer.toString() !== customerId.toString()) throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to access this order.');
  const payment = await Payment.findOne({ order: orderId });
  return { order: order.toJSON(), payment: payment ? payment.toJSON() : null, paymentStatus: order.paymentStatus, receiptUrl: payment ? payment.receiptUrl : null };
};

const crypto = require('crypto');

const createRazorpayOrder = async (orderId, customerId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(httpStatus.NOT_FOUND, 'Order not found.');
  if (order.customer.toString() !== customerId.toString()) throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to access this order.');
  if (order.orderStatus !== 'pending') throw new ApiError(httpStatus.BAD_REQUEST, 'Order is not in pending status.');

  const existingPayment = await Payment.findOne({ order: orderId });
  if (existingPayment && existingPayment.status === 'paid') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment already completed for this order.');
  }
  if (order.razorpayOrderId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Razorpay order already exists for this order.');
  }

  const razorpayOrder = await razorpayInstance.orders.create({
    amount: Math.round(order.totalAmount * 100),
    currency: 'INR',
    receipt: order.orderNumber || order._id.toString(),
    payment_capture: 1,
  });

  order.razorpayOrderId = razorpayOrder.id;
  await order.save();

  return {
    key: process.env.RAZORPAY_KEY_ID,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
  };
};

const verifyRazorpayPayment = async (verificationData, customerId) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = verificationData;

  const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
  if (!order) throw new ApiError(httpStatus.NOT_FOUND, 'Order not found for this Razorpay order ID.');
  if (order.customer.toString() !== customerId.toString()) throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to access this order.');

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + '|' + razorpay_payment_id)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    order.paymentStatus = 'failed';
    order.orderStatus = 'cancelled';
    await order.save();
    await restoreStock(order.items);

    let payment = await Payment.findOne({ order: order._id });
    if (!payment) {
      payment = new Payment({
        order: order._id,
        user: order.customer,
        method: 'card',
        provider: 'razorpay',
        paymentGateway: 'razorpay',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        transactionId: razorpay_payment_id,
        amount: order.totalAmount,
        currency: order.currency,
        status: 'failed',
        failureReason: 'Invalid signature',
        failedAt: new Date(),
      });
      await payment.save();
    }
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid payment signature.');
  }

  order.paymentStatus = 'paid';
  order.orderStatus = 'confirmed';
  await order.save();

  const payment = new Payment({
    order: order._id,
    user: order.customer,
    method: 'card',
    provider: 'razorpay',
    paymentGateway: 'razorpay',
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    transactionId: razorpay_payment_id,
    amount: order.totalAmount,
    currency: order.currency,
    status: 'paid',
    paidAt: new Date(),
  });
  await payment.save();

  order.payment = payment._id;
  await order.save();

  return payment;
};

const restoreStock = async (items) => {
  for (const item of items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
  }
};

module.exports = { createCheckoutSession, handleWebhook, getPaymentByOrder, createRazorpayOrder, verifyRazorpayPayment };