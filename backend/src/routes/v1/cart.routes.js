const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth');
const { ROLES } = require('../../constants/statusCodes');
const validate = require('../../middlewares/validate');
const cartController = require('../../controllers/cart.controller');
const {
  addCartItemValidator,
  updateCartItemValidator,
  cartItemParamValidator,
} = require('../../validators/cart.validator');

const router = express.Router();

// All cart routes are customer-only.
router.use(authenticate, authorize(ROLES.CUSTOMER));

router.get('/', cartController.getCart);

router.post(
  '/items',
  addCartItemValidator,
  validate,
  cartController.addToCart
);

router.patch(
  '/items/:productId',
  updateCartItemValidator,
  validate,
  cartController.updateCartItem
);

router.delete(
  '/items/:productId',
  cartItemParamValidator,
  validate,
  cartController.removeCartItem
);

router.delete('/', cartController.clearCart);

module.exports = router;