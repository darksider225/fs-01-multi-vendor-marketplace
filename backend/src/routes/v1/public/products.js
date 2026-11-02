const express = require('express');
const { productQueryValidator } = require('../../../validators/product.validator');
const validate = require('../../../middlewares/validate');
const { productController } = require('../../../controllers/public');

const router = express.Router();

// Public product listing - no authentication required
router.get(
  '/',
  productQueryValidator,
  validate,
  productController.listPublicProducts
);

// Public product detail - no authentication required
router.get(
  '/:id',
  validate,
  productController.getPublicProduct
);

module.exports = router;