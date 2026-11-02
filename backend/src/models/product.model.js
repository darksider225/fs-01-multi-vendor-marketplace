const mongoose = require('mongoose');

const { PRODUCT_STATUS_LIST } = require('../constants/statusCodes');

const productSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: [true, 'Vendor is required'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: [200, 'Product title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Product slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, trim: true, maxlength: [5000, 'Description cannot exceed 5000 characters'] },
    images: { type: [String], default: [] },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Product price cannot be negative'],
    },
    stock: { type: Number, required: true, default: 0, min: [0, 'Stock cannot be negative'] },
    sku: { type: String, sparse: true, unique: false },
    status: {
      type: String,
      enum: { values: PRODUCT_STATUS_LIST, message: 'Invalid product status' },
      default: 'published',
    },
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.isDeleted;
        delete ret.deletedAt;
      },
    },
  }
);

productSchema.pre('validate', async function () {
  if (this.isModified('title') && !this.slug) {
    const baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const timestamp = Date.now();
    this.slug = `${baseSlug}-${timestamp}`;
  }
});

productSchema.pre('save', async function () {
  if (this.isModified('slug') || this.isNew) {
    const existing = await this.constructor.findOne({ slug: this.slug, _id: { $ne: this._id } });
    if (existing) {
      const baseSlug = this.slug.replace(/-\d+$/, '');
      this.slug = `${baseSlug}-${Date.now()}`;
    }
  }
});

productSchema.index({ title: 'text' });
productSchema.index({ vendor: 1, category: 1 });
productSchema.index({ status: 1, category: 1 });
productSchema.index({ price: 1 });

// Vendor + sku compound index — unique per vendor, allows duplicates across vendors
productSchema.index({ vendor: 1, sku: 1 }, { sparse: true });

module.exports = mongoose.model('Product', productSchema);
