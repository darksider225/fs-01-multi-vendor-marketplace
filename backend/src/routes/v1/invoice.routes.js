const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth');
const { ROLES } = require('../../constants/statusCodes');
const validate = require('../../middlewares/validate');
const invoiceController = require('../../controllers/invoice.controller');

const router = express.Router();

// Customer - get invoice for their order
router.get('/:orderId', authenticate, authorize(ROLES.CUSTOMER), invoiceController.getInvoice);

// Customer - trigger invoice generation for their paid order
router.post('/:orderId/generate', authenticate, authorize(ROLES.CUSTOMER), invoiceController.triggerInvoiceGeneration);

module.exports = router;