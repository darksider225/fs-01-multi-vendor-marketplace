const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth');
const { ROLES } = require('../../constants/statusCodes');
const validate = require('../../middlewares/validate');
const reviewController = require('../../controllers/review.controller');
const { createReviewValidator, updateReviewValidator } = require('../../validators/review.validator');

const router = express.Router();

router.get('/:id/reviews', reviewController.getProductReviews);
router.post('/:id/reviews', authenticate, authorize(ROLES.CUSTOMER), createReviewValidator, validate, reviewController.createReview);
router.put('/:id', authenticate, authorize(ROLES.CUSTOMER), updateReviewValidator, validate, reviewController.updateReview);
router.delete('/:id', authenticate, authorize(ROLES.CUSTOMER), reviewController.deleteReview);

module.exports = router;
