const express = require('express');
const { authenticate, authorize } = require('../../../middlewares/auth');
const { ROLES, VENDOR_APPROVAL_STATUS } = require('../../../constants/statusCodes');
const validate = require('../../../middlewares/validate');
const { vendorController } = require('../../../controllers/vendor');
const { vendorProductController } = require('../../../controllers/vendor');
const { applyValidator, profileValidator, settingsValidator } = require('../../../validators/vendor.validator');
const { createProductValidator, productIdValidator, updateProductValidator, productQueryValidator } = require('../../../validators/product.validator');

const router = express.Router();

// Customer applies to become a vendor
router.post(
  '/apply',
  authenticate,
  authorize(ROLES.CUSTOMER),
  applyValidator,
  validate,
  vendorController.applyVendor
);

// Vendor profile management
router.get(
  '/profile',
  authenticate,
  authorize(ROLES.VENDOR),
  vendorController.getVendorProfile
);

router.put(
  '/profile',
  authenticate,
  authorize(ROLES.VENDOR),
  profileValidator,
  validate,
  vendorController.updateVendorProfile
);

router.put(
  '/settings',
  authenticate,
  authorize(ROLES.VENDOR),
  settingsValidator,
  validate,
  vendorController.updateVendorSettings
);

// Product CRUD — only vendor can manage own products
router.get(
  '/products',
  authenticate,
  authorize(ROLES.VENDOR),
  productQueryValidator,
  validate,
  vendorProductController.listProducts
);

router.post(
  '/products',
  authenticate,
  authorize(ROLES.VENDOR),
  createProductValidator,
  validate,
  vendorProductController.createProduct
);

router.get(
  '/products/:id',
  authenticate,
  authorize(ROLES.VENDOR),
  productIdValidator,
  validate,
  vendorProductController.getProduct
);

router.put(
  '/products/:id',
  authenticate,
  authorize(ROLES.VENDOR),
  updateProductValidator,
  validate,
  vendorProductController.updateProduct
);

router.delete(
  '/products/:id',
  authenticate,
  authorize(ROLES.VENDOR),
  productIdValidator,
  validate,
  vendorProductController.deleteProduct
);

module.exports = router;

