const { Cart, Product, Vendor } = require('../models');
const ApiError = require('../utils/apiError');
const httpStatus = require('../constants/httpStatus');

const MAX_CART_ITEMS = 100;

const ITEM_POPULATE = {
  path: 'items.product',
  select: 'title slug price stock status images vendor',
  populate: { path: 'vendor', select: 'storeName slug' },
};

/**
 * Shared helper: load a product and ensure it can be purchased.
 * Accepts an optional mongoose session for transaction-ready callers.
 */
const getPurchasableProduct = async (productId, session = null) => {
  const opts = session ? { session } : {};
  const product = await Product.findById(productId, null, opts);

  if (!product || product.isDeleted) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found.');
  }
  if (product.status !== 'published') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Product is not available for purchase.');
  }

  const vendor = await Vendor.findById(product.vendor, null, opts);
  if (!vendor || vendor.approvalStatus !== 'approved') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Product vendor is not approved.');
  }

  return product;
};

const getOrCreateCart = async (userId, session = null) => {
  const opts = session ? { session } : {};
  let cart = await Cart.findOne({ user: userId }, null, opts);
  if (!cart) {
    cart = new Cart({ user: userId, items: [] });
    await cart.save(session ? { session } : undefined);
  }
  return cart;
};

const getCart = async (userId, session = null) => {
  const cart = await getOrCreateCart(userId, session);
  await cart.populate(ITEM_POPULATE);
  return cart;
};

const addToCart = async (userId, productId, quantity = 1, session = null) => {
  const product = await getPurchasableProduct(productId, session);

  if (quantity > product.stock) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Requested quantity exceeds available stock.');
  }

  let cart = await getOrCreateCart(userId, session);
  const existing = cart.items.find((item) => item.product.toString() === String(productId));

  if (existing) {
    const newQuantity = existing.quantity + quantity;
    if (newQuantity > product.stock) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Requested quantity exceeds available stock.');
    }
    existing.quantity = newQuantity;
    // Keep the original price snapshot; do not overwrite on quantity change.
  } else {
    if (cart.items.length >= MAX_CART_ITEMS) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cart item limit reached.');
    }
    cart.items.push({
      product: product._id,
      quantity,
      priceAtAddTime: product.price,
    });
  }

  await cart.save(session ? { session } : undefined);
  cart = await Cart.findOne({ user: userId }, null, session ? { session } : {}).populate(ITEM_POPULATE);
  return cart;
};

const updateCartItem = async (userId, productId, quantity, session = null) => {
  const opts = session ? { session } : {};
  let cart = await Cart.findOne({ user: userId }, null, opts);
  if (!cart) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Cart not found.');
  }

  const item = cart.items.find((entry) => entry.product.toString() === String(productId));
  if (!item) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Cart item not found.');
  }

  const product = await getPurchasableProduct(productId, session);
  if (quantity > product.stock) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Requested quantity exceeds available stock.');
  }

  item.quantity = quantity;
  await cart.save(session ? { session } : undefined);
  cart = await Cart.findOne({ user: userId }, null, session ? { session } : {}).populate(ITEM_POPULATE);
  return cart;
};

const removeCartItem = async (userId, productId, session = null) => {
  const opts = session ? { session } : {};
  let cart = await Cart.findOne({ user: userId }, null, opts);
  if (!cart) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Cart not found.');
  }

  const before = cart.items.length;
  cart.items = cart.items.filter((entry) => entry.product.toString() !== String(productId));
  if (cart.items.length === before) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Cart item not found.');
  }

  await cart.save(session ? { session } : undefined);
  cart = await Cart.findOne({ user: userId }, null, session ? { session } : {}).populate(ITEM_POPULATE);
  return cart;
};

const clearCart = async (userId, session = null) => {
  const opts = session ? { session } : {};
  let cart = await Cart.findOne({ user: userId }, null, opts);
  if (!cart) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Cart not found.');
  }

  cart.items = [];
  await cart.save(session ? { session } : undefined);
  cart = await Cart.findOne({ user: userId }, null, session ? { session } : {}).populate(ITEM_POPULATE);
  return cart;
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  getPurchasableProduct,
};