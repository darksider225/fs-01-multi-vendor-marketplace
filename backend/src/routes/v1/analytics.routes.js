const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth');
const { ROLES } = require('../../constants/statusCodes');
const validate = require('../../middlewares/validate');
const analyticsController = require('../../controllers/analytics.controller');

const router = express.Router();

// Admin only - all analytics routes require admin role
router.use(authenticate, authorize(ROLES.ADMIN));

// Revenue statistics
router.get('/revenue', analyticsController.getRevenueStats);

// Order statistics
router.get('/orders', analyticsController.getOrderStats);

// Payment statistics
router.get('/payments', analyticsController.getPaymentStats);

// Top selling products
router.get('/products/top-selling', analyticsController.getTopSellingProducts);

// Top vendors
router.get('/vendors/top', analyticsController.getTopVendors);

// Monthly revenue
router.get('/revenue/monthly', analyticsController.getMonthlyRevenue);

// Recent orders
router.get('/orders/recent', analyticsController.getRecentOrders);

module.exports = router;