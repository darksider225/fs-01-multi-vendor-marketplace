const express = require('express');
const authRoutes = require('./auth.routes');
const vendorRoutes = require('./vendor');
const adminRoutes = require('./admin');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/vendor', vendorRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
