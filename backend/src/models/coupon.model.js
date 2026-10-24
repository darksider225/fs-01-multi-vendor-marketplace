const mongoose = require('mongoose');

const COUPON_TYPES = ['percentage', 'fixed'];
const COUPON_SCOPE = ['all', 'category', 'product', 'vendor'];

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [50, 'Coupon code cannot exceed 50 characters'],
    },
    type: {
      type: String,
      required: [true, 'Coupon type is required'],
      enum: { values: COUPON_TYPES, message: 'Coupon type must be percentage or fixed' },
    },
    value: {
      type: Number,
      required: [true, 'Coupon value is required'],
      min: [0, 'Coupon value cannot be negative'],
    }, // percentage (0-100) or fixed amount
    minOrderAmount: { type: Number, default: 0, min: [0, 'Minimum order amount cannot be negative'] },
    maxDiscount: { type: Number, min: [0, 'Max discount cannot be negative'] }, // cap for percentage coupons
    usageLimit: { type: Number, min: [0, 'Usage limit cannot be negative'] }, // total max uses; null = unlimited
    usedCount: { type: Number, default: 0, min: [0, 'Used count cannot be negative'] },
    perUserLimit: { type: Number, default: 1, min: [1, 'Per-user limit must be at least 1'] },
    applicableTo: {
      type: String,
      enum: { values: COUPON_SCOPE, message: 'Invalid coupon scope' },
      default: 'all',
    },
    applicableCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    applicableProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    applicableVendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    startDate: { type: Date, required: [true, 'Coupon start date is required'] },
    endDate: { type: Date, required: [true, 'Coupon end date is required'] },
    isActive: { type: Boolean, default: true },
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

couponSchema.pre('validate', function () {
  if (this.endDate && this.startDate && this.endDate <= this.startDate) {
    throw new Error('Coupon endDate must be after startDate');
  }

  // Ensure the scope reference matches the declared scope
  if (this.applicableTo === 'category' && !this.applicableCategory) {
    throw new Error('applicableCategory is required when applicableTo is "category"');
  }
  if (this.applicableTo === 'product' && !this.applicableProduct) {
    throw new Error('applicableProduct is required when applicableTo is "product"');
  }
  if (this.applicableTo === 'vendor' && !this.applicableVendor) {
    throw new Error('applicableVendor is required when applicableTo is "vendor"');
  }
  if (this.type === 'percentage' && this.value > 100) {
    // percentage value above 100 is almost certainly a mistake
    throw new Error('Percentage coupon value cannot exceed 100');
  }
});

// --- Indexes ---
couponSchema.index({ isActive: 1, startDate: 1, endDate: 1 }); // find live coupons by code lookup window
couponSchema.index({ applicableProduct: 1 }); // product-scoped coupon validation
couponSchema.index({ applicableCategory: 1 });
couponSchema.index({ applicableVendor: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
