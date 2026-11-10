const { Review, Product, Order, User } = require('../models');
const ApiError = require('../utils/apiError');
const httpStatus = require('../constants/httpStatus');

/** Service layer for review operations */
const createReview = async (userId, productId, { rating, title, comment, images, orderId }) => {
  // Verify order exists and product is in that order and order is completed
  const order = await Order.findOne({ _id: orderId, customer: userId, 'items.product': productId, orderStatus: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] } });
  if (!order) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You can only review products you have purchased.');
  }

  const existingReview = await Review.findOne({ product: productId, user: userId });
  if (existingReview) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You have already reviewed this product.');
  }

  const review = await Review.create({
    product: productId,
    vendor: await Product.findById(productId),
    user: userId,
    order: orderId,
    rating,
    title,
    comment,
    images: images || [],
    isVerifiedPurchase: true,
  });

  return review;
};

const getReviewsByProduct = async (productId, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc') => {
  const skip = (page - 1) * limit;
  const reviews = await Review.find({ product: productId, status: 'approved' })
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);
  const total = await Review.countDocuments({ product: productId, status: 'approved' });
  return { reviews, total, page, limit, pages: Math.ceil(total / limit) };
};

const getReviewsByUser = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const reviews = await Review.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  const total = await Review.countDocuments({ user: userId });
  return { reviews, total, page, limit, pages: Math.ceil(total / limit) };
};

const getReview = async (id) => {
  return await Review.findById(id);
};

const updateReview = async (id, data) => {
  const review = await Review.findById(id);
  if (!review) throw new ApiError(httpStatus.NOT_FOUND, 'Review not found.');
  if (review.user.toString() !== data.user) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only update your own review.');
  }
  if (data.status) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Changing review status is not allowed via this endpoint.');
  }
  const { rating, title, comment, images } = data;
  if (rating !== undefined) {
    if (rating < 1 || rating > 5) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Rating must be between 1 and 5.');
    }
  }
  if (title !== undefined && title.trim().length > 150) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Title cannot exceed 150 characters');
  }
  if (comment !== undefined && comment.trim().length > 1000) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Comment cannot exceed 1000 characters');
  }

  const updated = await Review.findByIdAndUpdate(id, { $set: { rating, title, comment, images } }, { new: true });
  return updated;
};

const deleteReview = async (id, userId) => {
  const review = await Review.findById(id);
  if (!review) throw new ApiError(httpStatus.NOT_FOUND, 'Review not found.');
  if (review.user.toString() !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only delete your own review.');
  }
  await Review.findByIdAndDelete(id);
  return review;
};

const approveReview = async (id, vendorId) => {
  const review = await Review.findById(id);
  if (!review) throw new ApiError(httpStatus.NOT_FOUND, 'Review not found.');
  const vendor = await Vendor.findById(review.vendor);
  if (!vendor || vendor._id.toString() !== vendorId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only the product vendor can moderate reviews.');
  }
  if (review.status === 'approved') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Review is already approved.');
  }
  const updated = await Review.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
  return updated;
};

const rejectReview = async (id, vendorId) => {
  const review = await Review.findById(id);
  if (!review) throw new ApiError(httpStatus.NOT_FOUND, 'Review not found.');
  const vendor = await Vendor.findById(review.vendor);
  if (!vendor || vendor._id.toString() !== vendorId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only the product vendor can moderate reviews.');
  }
  const updated = await Review.findByIdAndUpdate(id, { status: 'rejected' }, { new: true });
  return updated;
};

module.exports = {
  createReview,
  getReviewsByProduct,
  getReviewsByUser,
  getReview,
  updateReview,
  deleteReview,
  approveReview,
  rejectReview,
};