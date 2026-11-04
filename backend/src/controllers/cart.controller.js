const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const httpStatus = require('../constants/httpStatus');
const cartService = require('../services/cart.service');

const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user._id);
  return sendSuccess(res, httpStatus.OK, 'Cart retrieved successfully.', {
    cart: cart.toJSON(),
  });
});

const addToCart = asyncHandler(async (req, res) => {
  const cart = await cartService.addToCart(
    req.user._id,
    req.body.productId,
    req.body.quantity ?? 1
  );
  return sendSuccess(res, httpStatus.OK, 'Item added to cart.', {
    cart: cart.toJSON(),
  });
});

const updateCartItem = asyncHandler(async (req, res) => {
  const cart = await cartService.updateCartItem(
    req.user._id,
    req.params.productId,
    req.body.quantity
  );
  return sendSuccess(res, httpStatus.OK, 'Cart item updated.', {
    cart: cart.toJSON(),
  });
});

const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await cartService.removeCartItem(req.user._id, req.params.productId);
  return sendSuccess(res, httpStatus.OK, 'Cart item removed.', {
    cart: cart.toJSON(),
  });
});

const clearCart = asyncHandler(async (req, res) => {
  const cart = await cartService.clearCart(req.user._id);
  return sendSuccess(res, httpStatus.OK, 'Cart cleared.', {
    cart: cart.toJSON(),
  });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};