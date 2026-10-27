const express = require('express');
const authController = require('../../controllers/auth');
const { authenticate } = require('../../middlewares/auth');
const { registerValidator, loginValidator } = require('../../validators/auth.validator');
const validate = require('../../middlewares/validate');

const router = express.Router();

// Public
router.post('/register', registerValidator, validate, authController.register);
router.post('/login', loginValidator, validate, authController.login);

// Protected
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;
