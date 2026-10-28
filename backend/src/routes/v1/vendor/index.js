const express = require('express');
const { authenticate, authorize } = require('../../../middlewares/auth');
const { ROLES } = require('../../../constants/roles');
const validate = require('../../../middlewares/validate');
const { vendorProductController } = require('../../../controllers/vendor');
const { createProductValidator } = require('../../../validators/product.validator');

const router = express.Router();

// Only Vendor ➜ Create Product
router.post(
  '/products',
  authenticate,
  authorize(ROLES.VENDOR),
  createProductValidator,
  validate,
  vendorProductController.createProduct
);

module.exports = router;
