const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth');
const { ROLES } = require('../../constants/statusCodes');
const validate = require('../../middlewares/validate');
const couponController = require('../../controllers/coupon.controller');
const { createCouponValidator, updateCouponValidator, applyCouponValidator, getCouponsValidator } = require('../../validators/coupon.validator');

const router = express.Router();

// Admin routes - create, update, delete coupons
router.post('/', authenticate, authorize(ROLES.ADMIN), createCouponValidator, validate, couponController.createCoupon);
router.put('/:id', authenticate, authorize(ROLES.ADMIN), updateCouponValidator, validate, couponController.updateCoupon);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), couponController.deleteCoupon);

// Customer route - apply coupon to order
router.post('/apply', authenticate, authorize(ROLES.CUSTOMER), applyCouponValidator, validate, couponController.applyCoupon);

// Admin route - get all coupons (with filters)
router.get('/', authenticate, authorize(ROLES.ADMIN), getCouponsValidator, validate, couponController.getAllCoupons);

module.exports = router;