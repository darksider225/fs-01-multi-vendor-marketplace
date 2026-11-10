const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const Order = require('../models/order.model');

const getInvoice = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);
  if (!order) {
    return sendError(res, 404, 'Order not found');
  }

  // Check ownership
  if (order.customer.toString() !== req.user._id.toString()) {
    return sendError(res, 403, 'Not authorized to access this invoice');
  }

  if (!order.invoiceUrl) {
    return sendError(res, 404, 'Invoice not generated yet');
  }

  return sendSuccess(res, 200, 'Invoice retrieved successfully', {
    invoiceNumber: order.invoiceNumber,
    invoiceUrl: order.invoiceUrl,
    invoiceGeneratedAt: order.invoiceGeneratedAt,
    orderId: order._id,
  });
});

const triggerInvoiceGeneration = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);
  if (!order) {
    return sendError(res, 404, 'Order not found');
  }

  // Check ownership
  if (order.customer.toString() !== req.user._id.toString()) {
    return sendError(res, 403, 'Not authorized to generate this invoice');
  }

  // ISSUE 2 FIX: If invoice already exists, return existing invoice (no regeneration)
  if (order.invoiceUrl) {
    return sendSuccess(res, 200, 'Invoice already exists', {
      invoiceNumber: order.invoiceNumber,
      invoiceUrl: order.invoiceUrl,
      invoiceGeneratedAt: order.invoiceGeneratedAt,
    });
  }

  // Only generate invoice for paid orders
  if (order.paymentStatus !== 'paid') {
    return sendError(res, 400, 'Invoice can only be generated for paid orders');
  }

  try {
    const result = await require('../services/invoice.service').generateInvoice(orderId);
    return sendSuccess(res, 200, 'Invoice generated successfully', result);
  } catch (error) {
    // ISSUE 4 FIX: If generation fails (e.g., PDF/S3 error),
    // payment success is not affected - return order info without invoice
    return sendError(res, 500, 'Invoice generation failed (payment successful)', error.message);
  }
});

module.exports = {
  getInvoice,
  triggerInvoiceGeneration,
};