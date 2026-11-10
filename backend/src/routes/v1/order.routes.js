const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth');
const { ROLES } = require('../../constants/statusCodes');
const validate = require('../../middlewares/validate');
const orderController = require('../../controllers/order.controller');
const {
  createOrderValidator,
  orderIdValidator,
  getOrdersQueryValidator,
  cancelOrderValidator,
} = require('../../validators/order.validator');

const router = express.Router();

// All order routes are customer-only.
router.use(authenticate, authorize(ROLES.CUSTOMER));

router.post('/', createOrderValidator, validate, orderController.createOrder);
router.get('/', getOrdersQueryValidator, validate, orderController.getMyOrders);
router.get('/:id', orderIdValidator, validate, orderController.getOrderDetails);
router.patch('/:id/cancel', cancelOrderValidator, validate, orderController.cancelOrder);

module.exports = router;