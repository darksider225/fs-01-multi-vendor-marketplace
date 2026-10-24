const mongoose = require('mongoose');

const REVIEW_STATUS = ['pending', 'approved', 'rejected'];

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: [true, 'Vendor is required'],
    }, // denormalized for vendor-wide aggregations & moderation
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null }, // proves purchase
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    title: { type: String, trim: true, maxlength: [150, 'Title cannot exceed 150 characters'] },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    images: { type: [String], default: [] },
    isVerifiedPurchase: { type: Boolean, default: false },
    status: {
      type: String,
      enum: { values: REVIEW_STATUS, message: 'Invalid review status' },
      default: 'approved',
    },
    helpfulCount: { type: Number, default: 0, min: 0 },
    response: {
      vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
      comment: { type: String, trim: true, maxlength: [1000, 'Response cannot exceed 1000 characters'] },
      respondedAt: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

// --- Indexes ---
reviewSchema.index({ product: 1, user: 1 }, { unique: true }); // one review per customer per product
reviewSchema.index({ product: 1, status: 1 }); // approved reviews visible, pending hidden
reviewSchema.index({ vendor: 1, status: 1 }); // vendor moderation queue
reviewSchema.index({ rating: 1 }); // rating filters

module.exports = mongoose.model('Review', reviewSchema);
