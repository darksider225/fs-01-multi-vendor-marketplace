const { body, param } = require('express-validator');

const addCartItemValidator = [
  body('productId')
    .isMongoId()
    .withMessage('A valid product ID is required'),
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
];

const updateCartItemValidator = [
  param('productId')
    .isMongoId()
    .withMessage('A valid product ID is required'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
];

const cartItemParamValidator = [
  param('productId')
    .isMongoId()
    .withMessage('A valid product ID is required'),
];

module.exports = {
  addCartItemValidator,
  updateCartItemValidator,
  cartItemParamValidator,
};