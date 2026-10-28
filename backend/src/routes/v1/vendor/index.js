const express = require('express');
const { authenticate, authorize } = require('../../../middlewares/auth');
const { ROLES } = require('../../../constants/roles');
const validate = require('../../../middlewares/validate');
const { vendorController } = require('../../../controllers/vendor');
const { vendorProductController } = require('../../../controllers/vendor');
const { applyValidator, profileValidator, settingsValidator } = require('../../../validators/vendor.validator');
const { createProductValidator } = require('../../../validators/product.validator');

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
