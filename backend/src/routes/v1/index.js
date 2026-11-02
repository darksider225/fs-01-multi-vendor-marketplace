const express = require('express');
const authRoutes = require('./auth.routes');
const vendorRoutes = require('./vendor');
const adminRoutes = require('./admin');
const publicProductRoutes = require('./public/products');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/vendor', vendorRoutes);
router.use('/admin', adminRoutes);

// Public product marketplace APIs (no authentication required)
router.use('/products', publicProductRoutes);

module.exports = router;
