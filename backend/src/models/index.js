/**
 * Model barrel — central exports for the multi-vendor marketplace.
 *
 * Import anywhere as:
 *   const { User, Vendor, Product, Order } = require('../models');
 */
module.exports = {
  User: require('./user.model'),
  Vendor: require('./vendor.model'),
  Category: require('./category.model'),
  Product: require('./product.model'),
  Cart: require('./cart.model'),
  Order: require('./order.model'),
  Review: require('./review.model'),
  Coupon: require('./coupon.model'),
  Payment: require('./payment.model'),
};
