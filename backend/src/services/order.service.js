const { Order, Cart, Product, Vendor } = require("../models");
const ApiError = require("../utils/apiError");
const httpStatus = require("../constants/httpStatus");

function computeVendorSplits(items, vendorsById) {
  const splitsMap = new Map();
  for (const item of items) {
    const vendor = vendorsById.get(item.vendor.toString());
    const commissionRate = vendor ? vendor.commissionRate || 0 : 0;
    const commissionAmount = Math.round(item.totalPrice * commissionRate * 100) / 100;
    const payoutAmount = Math.round((item.totalPrice - commissionAmount) * 100) / 100;
    const key = item.vendor.toString();
    if (!splitsMap.has(key)) {
      splitsMap.set(key, { vendor: item.vendor, vendorStoreName: vendor ? vendor.storeName : "Unknown Vendor", subtotal: 0, commissionAmount: 0, payoutAmount: 0, commissionRate });
    }
    const split = splitsMap.get(key);
    split.subtotal = Math.round((split.subtotal + item.totalPrice) * 100) / 100;
    split.commissionAmount = Math.round((split.commissionAmount + commissionAmount) * 100) / 100;
    split.payoutAmount = Math.round((split.payoutAmount + payoutAmount) * 100) / 100;
  }
  return Array.from(splitsMap.values());
}

const createOrderFromCart = async (userId, shippingAddress, session = null) => {
  const opts = session ? { session } : {};
  const cart = await Cart.findOne({ user: userId }, null, opts);
  if (!cart || cart.items.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Cart is empty. Add items before placing an order.");
  }
  const snapshotItems = [];
  const vendorsById = new Map();
  let subtotal = 0;
  for (const item of cart.items) {
    const product = await Product.findById(item.product, null, opts);
    if (!product || product.isDeleted) {
      throw new ApiError(httpStatus.NOT_FOUND, `Product not found: ${item.product}`);
    }
    if (product.status !== "published") {
      throw new ApiError(httpStatus.BAD_REQUEST, `Product is not available: ${product.title}`);
    }
    const vendor = await Vendor.findById(product.vendor, null, opts);
    if (!vendor || vendor.approvalStatus !== "approved") {
      throw new ApiError(httpStatus.BAD_REQUEST, `Vendor not approved for product: ${product.title}`);
    }
    const unitPrice = item.priceAtAddTime;
    const totalPrice = Math.round(unitPrice * item.quantity * 100) / 100;
    subtotal = Math.round((subtotal + totalPrice) * 100) / 100;
    snapshotItems.push({ product: product._id, vendor: product.vendor, title: product.title, sku: product.sku || undefined, quantity: item.quantity, unitPrice, totalPrice, image: product.images && product.images.length > 0 ? product.images[0] : undefined });
  }
  const discountAmount = cart.discount || 0;
  const taxAmount = 0;
  const shippingFee = 0;
  const totalAmount = Math.round((subtotal + taxAmount + shippingFee - discountAmount) * 100) / 100;
  const vendorSplits = computeVendorSplits(snapshotItems, vendorsById);
  const order = new Order({ customer: userId, items: snapshotItems, vendorSplits, shippingAddress: shippingAddress, billingAddress: shippingAddress, coupon: cart.coupon || undefined, subtotal, taxAmount, shippingFee, discountAmount, totalAmount, orderStatus: "pending", paymentStatus: "pending", placedAt: new Date() });
  for (const item of cart.items) {
    const updated=await Product.findOneAndUpdate({_id:item.product,stock:{$gte:item.quantity}},{$inc:{stock:-item.quantity}},session?{session}:undefined);if(!updated){throw new ApiError(httpStatus.BAD_REQUEST,`Insufficient stock for product ${item.product}`);}
  }
  await order.save(session ? { session } : undefined);
  cart.items = [];
  cart.totalItems = 0;
  cart.totalAmount = 0;
  cart.discount = 0;
  cart.coupon = null;
  await cart.save(session ? { session } : undefined);
  return order;
};

const getMyOrders = async (userId, filters = {}, session = null) => {
  const opts = session ? { session } : {};
  const page = parseInt(filters.page, 10) || 1;
  const limit = parseInt(filters.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const sort = filters.sort || "-createdAt";
  const query = { customer: userId };
  if (filters.status) query.orderStatus = filters.status;
  const [orders, total] = await Promise.all([
    Order.find(query, null, opts).sort(sort).skip(skip).limit(limit),
    Order.countDocuments(query),
  ]);
  return { orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

const getOrderById = async (orderId, userId, role, session = null) => {
  const opts = session ? { session } : {};
  const order = await Order.findById(orderId, null, opts);
  if (!order) throw new ApiError(httpStatus.NOT_FOUND, "Order not found.");
  if (role === "customer" && order.customer.toString() !== userId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, "Not authorized to view this order.");
  }
  if (role === "vendor") {
    const hasVendorItem = order.items.some((item) => item.vendor.toString() === userId.toString());
    if (!hasVendorItem) throw new ApiError(httpStatus.FORBIDDEN, "Not authorized to view this order.");
  }
  return order;
};

const cancelOrder = async (orderId, userId, session = null) => {
  const opts = session ? { session } : {};
  const order = await Order.findById(orderId, null, opts);
  if (!order) throw new ApiError(httpStatus.NOT_FOUND, "Order not found.");
  if (order.customer.toString() !== userId.toString()) throw new ApiError(httpStatus.FORBIDDEN, "Not authorized to cancel this order.");
  if (order.orderStatus !== "pending") {
    throw new ApiError(httpStatus.BAD_REQUEST, `Order cannot be cancelled in "${order.orderStatus}" status. Only pending orders can be cancelled.`);
  }
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } }, session ? { session } : undefined);
  }
  order.orderStatus = "cancelled";
  order.cancellation = { cancelledBy: userId, cancelledAt: new Date() };
  await order.save(session ? { session } : undefined);
  return order;
};

const getVendorOrders = async (vendorId, filters = {}, session = null) => {
  const opts = session ? { session } : {};
  const page = parseInt(filters.page, 10) || 1;
  const limit = parseInt(filters.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const sort = filters.sort || "-createdAt";
  const query = { "items.vendor": vendorId };
  if (filters.status) query.orderStatus = filters.status;
  const [orders, total] = await Promise.all([
    Order.find(query, null, opts).sort(sort).skip(skip).limit(limit),
    Order.countDocuments(query),
  ]);
  return { orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

module.exports = { createOrderFromCart, getMyOrders, getOrderById, cancelOrder, getVendorOrders };

