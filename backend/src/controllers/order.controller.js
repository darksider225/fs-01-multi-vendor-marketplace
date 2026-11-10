const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const httpStatus = require('../constants/httpStatus');
const ApiError = require('../utils/apiError');
const orderService = require('../services/order.service');
const { Vendor } = require('../models');

const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrderFromCart(req.user._id, req.body.shippingAddress);
  return sendSuccess(res, httpStatus.CREATED, 'Order created successfully.', {
    order: order.toJSON(),
  });
});

const getMyOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getMyOrders(req.user._id, req.query);
  return sendSuccess(res, httpStatus.OK, 'Orders retrieved successfully.', {
    orders: result.orders.map((o) => o.toJSON()),
    pagination: result.pagination,
  });
});

const getOrderDetails = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id, req.user._id, req.user.role);
  return sendSuccess(res, httpStatus.OK, 'Order retrieved successfully.', {
    order: order.toJSON(),
  });
});

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.params.id, req.user._id);
  return sendSuccess(res, httpStatus.OK, 'Order cancelled successfully.', {
    order: order.toJSON(),
  });
});

const getVendorOrders = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Vendor profile not found.');
  }
  const result = await orderService.getVendorOrders(vendor._id, req.query);
  return sendSuccess(res, httpStatus.OK, 'Vendor orders retrieved successfully.', {
    orders: result.orders.map((o) => o.toJSON()),
    pagination: result.pagination,
  });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderDetails,
  cancelOrder,
  getVendorOrders,
};