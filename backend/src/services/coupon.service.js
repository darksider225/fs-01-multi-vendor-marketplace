const { Coupon, Order } = require('../models');
const ApiError = require('../utils/apiError');
const httpStatus = require('../constants/httpStatus');

const createCoupon = async (data) => {
  if (data.endDate && data.startDate && data.endDate <= this.startDate) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Coupon endDate must be after startDate');
  }
  if (data.applicableTo === 'category' && !this.applicableCategory) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'applicableCategory is required');
  }
  if (data.applicableTo === 'product' && !this.applicableProduct) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'applicableProduct is required');
  }
const getCouponByCode = async (code) => {
  return await Coupon.findOne({ code: code.toUpperCase().trim() });
};

const validateCoupon = async (couponCode, userId, orderTotal, categoryId = null, vendorId = null) => {
  const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim() });
  if (!coupon) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid coupon code');
  if (!coupon.isActive) throw new ApiError(httpStatus.BAD_REQUEST, 'This coupon is no longer active');
  if (coupon.endDate < new Date()) throw new ApiError(httpStatus.BAD_REQUEST, 'This coupon has expired');
  if (coupon.startDate > new Date()) throw new ApiError(httpStatus.BAD_REQUEST, 'This coupon has not started yet');
  if (coupon.minOrderAmount > orderTotal) throw new ApiError(httpStatus.BAD_REQUEST, 'Minimum order amount not met');
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Coupon usage limit reached');
  }
  if (coupon.perUserLimit > 0) {
    // Count orders where this user has applied this coupon (no couponUsed field on Order model)
    const userUsage = await Order.countDocuments({ customer: userId, coupon: coupon._id });
    if (userUsage >= coupon.perUserLimit) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Maximum coupon usage reached');
    }
  }
  if (coupon.applicableTo === 'all') {
  } else if (coupon.applicableTo === 'category' && coupon.applicableCategory) {
    if (!categoryId || coupon.applicableCategory.toString() !== categoryId.toString()) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Coupon not valid for this category');
    }
  } else if (coupon.applicableTo === 'product') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Product-scoped coupons not yet supported in this flow');
  }
  return coupon;
};

const applyCouponToOrder = async (coupon, order) => {
  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = Math.min((order.subtotal * coupon.value) / 100, coupon.maxDiscount || 0);
  } else {
    // For fixed coupons: discount is min of coupon value and order total.
    // If maxDiscount is explicitly set (>0), also cap the discount at that amount.
    const maxDiscountCap = coupon.maxDiscount && coupon.maxDiscount > 0 ? coupon.maxDiscount : coupon.value;
    discount = Math.min(coupon.value, order.subtotal + order.shippingFee, maxDiscountCap);
  }
  order.discountAmount = discount;
  order.coupon = coupon._id;
  order.couponCode = coupon.code;
  order.couponAppliedAt = new Date();
  await order.save();
  // Atomic increment to prevent race conditions on concurrent usage
  await Coupon.updateOne({ _id: coupon._id }, { $inc: { usedCount: 1 } });
  return order;
};

module.exports = { createCoupon, getAllCoupons, getCouponByCode, validateCoupon, applyCouponToOrder };
