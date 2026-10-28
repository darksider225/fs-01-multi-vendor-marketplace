const express = require('express');
const { authenticate, authorize } = require('../../../middlewares/auth');
const { ROLES } = require('../../../constants/roles');
const validate = require('../../../middlewares/validate');
const { adminVendorController } = require('../../../controllers/admin');
const { approveValidator } = require('../../../validators/vendor.validator');

const router = express.Router();

// Admin vendor management
router.get(
  '/vendors',
  authenticate,
  authorize(ROLES.ADMIN),
  adminVendorController.listVendors
);

router.get(
  '/vendors/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  adminVendorController.getVendor
);

router.put(
  '/vendors/:id/approve',
  authenticate,
  authorize(ROLES.ADMIN),
  approveValidator,
  validate,
  adminVendorController.approveVendor
);

module.exports = router;
