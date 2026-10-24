const mongoose = require('mongoose');

const PRODUCT_STATUS = ['draft', 'published', 'unpublished', 'archived'];

const variantSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Variant name is required'], trim: true },
    sku: { type: String, sparse: true, unique: true, trim: true },
    price: {
      type: Number,
      required: [true, 'Variant price is required'],
      min: [0, 'Variant price cannot be negative'],
    },
    stock: { type: Number, default: 0, min: [0, 'Variant stock cannot be negative'] },
    attributes: { type: Map, of: String }, // e.g. { size: 'M', color: 'Red' }
  },
  { _id: false }
);

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
      alias: 'name', // required schema field; `name` stays as an alias for existing consumers (e.g. order snapshots)
    },
    slug: {
      type: String,
      required: [true, 'Product slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, trim: true, maxlength: [5000, 'Description cannot exceed 5000 characters'] },
    brand: { type: String, trim: true },
    images: { type: [String], default: [] },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Product price cannot be negative'],
    },
    compareAtPrice: { type: Number, min: [0, 'Compare-at price cannot be negative'] },
    costPrice: { type: Number, min: [0, 'Cost price cannot be negative'] }, // vendor-only analytics
    currency: { type: String, default: 'USD', uppercase: true, trim: true },
    stock: { type: Number, required: true, default: 0, min: [0, 'Stock cannot be negative'] },
    soldCount: { type: Number, default: 0, min: [0, 'Sold count cannot be negative'] },
    sku: { type: String, sparse: true, unique: true, trim: true },
    attributes: { type: Map, of: String },
    variants: { type: [variantSchema], default: [] },
    status: {
      type: String,
      enum: { values: PRODUCT_STATUS, message: 'Invalid product status' },
      default: 'published',
    },
    isActive: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    avgRating: { type: Number, default: 0, min: 0, max: 5 }, // denormalized from reviews
    ratingCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.costPrice; // never expose cost to customers
      },
    },
    toObject: { virtuals: true },
  }
);

productSchema.pre('validate', function () {
  if (!this.slug && this.title) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
});

// --- Indexes ---
productSchema.index({ title: 'text', brand: 'text' }); // product search
productSchema.index({ vendor: 1, category: 1 }); // vendor catalog by category
productSchema.index({ isActive: 1, category: 1 }); // marketplace browse
productSchema.index({ price: 1 }); // price sorting

module.exports = mongoose.model('Product', productSchema);
