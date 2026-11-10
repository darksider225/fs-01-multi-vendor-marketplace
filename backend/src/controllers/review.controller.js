const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const httpStatus = require('../constants/httpStatus');
const ApiError = require('../utils/apiError');
const { Product, Order, Review } = require('../models');

const createReview = asyncHandler(async (req, res) => {
  const { rating, title, comment, images } = req.body;
  const { id } = req.params;

  const product = await Product.findById(req.params.id);
  if (!product || product.isDeleted) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found.');
  }
  if (product.status !== 'published') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Product is not available for review.');
  }

  const order = await Order.findOne({
    _id: req.body.order,
    customer: req.user._id,
    'items.product': product._id,
    orderStatus: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] }
  });
  if (!order) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only review products you have purchased.');
  }

  const existingReview = await Review.findOne({ product: product._id, user: req.user._id });
  if (existingReview) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You have already reviewed this product.');
  }

  const review = await Review.create({
    product: product._id,
    vendor: product.vendor,
    user: req.user._id,
    order: order._id,
    rating,
    title,
    comment,
    images: images || [],
    isVerifiedPurchase: true,
  });

  await updateProductRating(product._id, rating);

  return sendSuccess(res, httpStatus.CREATED, 'Review submitted successfully.', {
    review: review.toJSON(),
  });
});

const getProductReviews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  const product = await Product.findById(req.params.id);
  if (!product || product.isDeleted) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found.');
  }

  const { skip, limit: paginateLimit } = paginate(req.query);

  const reviews = await Review.find({ product: product._id, status: 'approved' })
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(paginateLimit);

  const total = await Review.countDocuments({ product: product._id, status: 'approved' });

  return sendSuccess(res, httpStatus.OK, 'Reviews retrieved successfully.', {
    reviews,
    pagination: { page: parseInt(page), limit: paginateLimit, total, pages: Math.ceil(total / limit) },
  });
});

const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, title, comment, images, isVerifiedPurchase } = req.body;

  const review = await Review.findById(req.params.id);
  if (!review) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Review not found.');
  }

  if (review.user.toString() !== req.user._id.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only update your own review.');
  }

  if (req.body.status) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Changing review status is not allowed via this endpoint.');
  }

  const updateFields = {};
  if (rating !== undefined) {
    if (rating < 1 || rating > 5) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Rating must be between 1 and 5.');
    }
    updateFields.rating = rating;
  }
  if (title !== undefined) {
    if (title.trim().length > 150) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Title cannot exceed 150 characters');
    }
    updateFields.title = title.trim();
  }
  if (comment !== undefined) {
    if (comment.trim().length > 1000) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Comment cannot exceed 1000 characters');
    }
    updateFields.comment = comment.trim();
  }

  if (updateFields.rating !== undefined) {
    await updateProductRating(review.product, rating, review.rating);
  }

  const updatedReview = await Review.findByIdAndUpdate(review._id, { $set: updateFields }, { new: true });

  return sendSuccess(res, httpStatus.OK, 'Review updated successfully.', {
    review: updatedReview.toJSON(),
  });
});

const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(req.params.id);
  if (!review) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Review not found.');
  }

  if (review.user.toString() !== req.user._id.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only delete your own review.');
  }

  await Review.findByIdAndDelete(review._id);

  const product = await Product.findById(review.product);
  if (product) {
    await updateProductRating(product._id, product.avgRating, review.rating, -1);
  }

  return sendSuccess(res, httpStatus.OK, 'Review deleted successfully.');
});

const updateProductRating = async (productId, newRating, oldRating = null, delta = 1) => {
  const product = await Product.findById(productId);
  if (!product) return;

  const count = delta || 1;
  const ratingDelta = newRating - (oldRating || product.avgRating);

  product.avgRating = Math.round((product.avgRating * product.ratingCount + ratingDelta) / (product.ratingCount + count) * 10) / 10;
  product.ratingCount = product.ratingCount + count;
  await product.save();
};

module.exports = {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  updateProductRating,
};