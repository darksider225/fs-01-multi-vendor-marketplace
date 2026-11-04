const mongoose = require('mongoose');

// Hard cap to protect against unbounded cart growth / abuse.
const MAX_CART_ITEMS = 100;

/**
 * Cart item — stores only a product reference plus the price snapshot taken
 * when the item was added. Full product documents are never embedded.
 */
const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be an integer',
      },
    },
    priceAtAddTime: {
      type: Number,
      required: [true, 'Price snapshot is required'],
      min: [0, 'Price cannot be negative'],
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    // One cart per customer. Enforced by the unique index below.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    items: {
      type: [cartItemSchema],
      default: [],
      validate: {
        validator: (items) => {
          if (!Array.isArray(items) || items.length > MAX_CART_ITEMS) return false;
          // No duplicate products in the same cart.
          const ids = items.map((i) => i.product && i.product.toString());
          return new Set(ids).size === ids.length;
        },
        message: 'Cart items must be unique by product and cannot exceed the item limit',
      },
    },
    totalItems: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, default: 0, min: 0 },
    // Optional checkout helpers (kept nullable so the core schema stays minimal).
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
    discount: { type: Number, default: 0, min: 0 },
    // Null for registered-user carts; set for guest carts to enable TTL cleanup.
    expiresAt: { type: Date, default: null },
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

// Recompute derived totals on every validation/save so they can never drift.
cartSchema.pre('validate', function () {
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalAmount = this.items.reduce(
    (sum, item) => sum + item.priceAtAddTime * item.quantity,
    0
  );
  if (this.discount > this.totalAmount) this.discount = this.totalAmount;
});

// --- Indexes ---
// One cart per customer (also speeds up "get my cart").
cartSchema.index({ user: 1 }, { unique: true });
// Support product-based lookups (stock/existence checks, "carts containing product").
cartSchema.index({ 'items.product': 1 });
// Guest-cart TTL cleanup (expireAt is an absolute date; 0 = delete at that time).
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Admin/reporting: recently updated carts.
cartSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Cart', cartSchema);
