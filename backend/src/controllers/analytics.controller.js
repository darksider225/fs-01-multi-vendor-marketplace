const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const getRevenueStats = asyncHandler(async (req, res) => {
  const stats = await require('../services/analytics.service').getRevenueStats();
  return sendSuccess(res, 200, 'Revenue statistics retrieved successfully', stats);
});

const getOrderStats = asyncHandler(async (req, res) => {
  const stats = await require('../services/analytics.service').getOrderStats();
  return sendSuccess(res, 200, 'Order statistics retrieved successfully', stats);
});

const getPaymentStats = asyncHandler(async (req, res) => {
  const stats = await require('../services/analytics.service').getPaymentStats();
  return sendSuccess(res, 200, 'Payment statistics retrieved successfully', stats);
});

const getTopSellingProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const products = await require('../services/analytics.service').getTopSellingProducts(limit);
  return sendSuccess(res, 200, 'Top selling products retrieved successfully', products);
});

const getTopVendors = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const vendors = await require('../services/analytics.service').getTopVendors(limit);
  return sendSuccess(res, 200, 'Top vendors retrieved successfully', vendors);
});

const getMonthlyRevenue = asyncHandler(async (req, res) => {
  const year = req.query.year ? parseInt(req.query.year) : null;
  const monthlyRevenue = await require('../services/analytics.service').getMonthlyRevenue(year);
  return sendSuccess(res, 200, 'Monthly revenue statistics retrieved successfully', monthlyRevenue);
});

const getRecentOrders = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const orders = await require('../services/analytics.service').getRecentOrders(limit);
  return sendSuccess(res, 200, 'Recent orders retrieved successfully', orders);
});

module.exports = {
  getRevenueStats,
  getOrderStats,
  getPaymentStats,
  getTopSellingProducts,
  getTopVendors,
  getMonthlyRevenue,
  getRecentOrders
};