const express = require('express');
const authRoutes = require('./auth.routes');
const vendorRoutes = require('./vendor');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/vendor', vendorRoutes);

module.exports = router;
