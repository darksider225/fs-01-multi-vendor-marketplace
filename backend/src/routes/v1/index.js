const express = require('express');
const authRoutes = require('./auth.routes');
const vendorRoutes = require('./vendor');
const adminRoutes = require('./admin');
const publicProductRoutes = require('./public/products');
const uploadRoutes = require('./upload/index');
const cartRoutes = require('./cart.routes');
const invoiceRoutes = require('./invoice.routes');
const orderRoutes = require('./order.routes');
const paymentRoutes = require('./payment.routes');
const analyticsRoutes = require('./analytics');
const paymentController = require('../../controllers/payment.controller');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/vendor', vendorRoutes);
router.use('/admin', adminRoutes);

// Invoice APIs (authentication required - customer only)
// These must be mounted BEFORE order routes since order routes catch /orders/:orderId
router.use('/orders/:orderId/invoice', invoiceRoutes);

// Public product marketplace APIs (no authentication required)
router.use('/products', publicProductRoutes);

// Upload APIs (authentication required - vendor only)
router.use('/uploads', uploadRoutes);

// Cart APIs (authentication required - customer only)
router.use('/cart', cartRoutes);

// Order APIs (authentication required - customer only)
router.use('/orders', orderRoutes);

// Payment APIs (authentication required - customer only)
router.use('/payments', paymentRoutes);

// Admin analytics
router.use('/admin/analytics', analyticsRoutes);

module.exports = router;
