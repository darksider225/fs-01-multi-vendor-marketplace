const mongoose = require('mongoose');

const CART_TTL_SECONDS = 7 * 24 * 60 * 60; // guest carts auto-expire after 7 days

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
      default: 1,
    },
    price: {
      type: Number,
      required: [true, 'Price snapshot is required'],
      min: [0, 'Price cannot be negative'],
    }, // snapshot of the product price when added
    selected: { type: Boolean, default: true },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      unique: true, // one active cart per registered user
    },
    items: { type: [cartItemSchema], default: [] },
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
    subTotal: { type: Number, default: 0, min: 0 },
    totalItems: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date }, // TTL: guest carts expire (null for registered users)
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

// Keep totals consistent whenever the cart is validated/saved
cartSchema.pre('validate', function () {
  this.subTotal = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// --- Indexes ---
cartSchema.index({ 'items.product': 1 }); // resolve product existence / stock checks
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: CART_TTL_SECONDS });

module.exports = mongoose.model('Cart', cartSchema);
