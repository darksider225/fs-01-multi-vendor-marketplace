const mongoose = require('mongoose');

const ORDER_STATUS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const PAYMENT_STATUS = ['pending', 'paid', 'failed', 'refunded'];

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: [true, 'Vendor reference is required'],
    },
    name: { type: String, required: [true, 'Product name is required'] }, // snapshot
    price: { type: Number, required: [true, 'Price is required'], min: 0 }, // snapshot
    quantity: { type: Number, required: [true, 'Quantity is required'], min: 1 },
    image: String, // snapshot
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: [true, 'Full name is required'], trim: true },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
      match: [/^[0-9+\-\s]{10,15}$/, 'Please provide a valid phone number'],
    },
    line1: { type: String, required: [true, 'Address line 1 is required'], trim: true },
    city: { type: String, required: [true, 'City is required'], trim: true },
    state: { type: String, required: [true, 'State is required'], trim: true },
    pincode: { type: String, required: [true, 'Pincode is required'], trim: true },
    country: { type: String, required: [true, 'Country is required'], trim: true, default: 'US' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: [true, 'Order number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      alias: 'customer', // required schema field; same stored path as `user`
    },
    items: {
      type: [orderItemSchema],
      required: [true, 'An order must contain at least one item'],
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'An order must contain at least one item',
      },
      alias: 'products', // required schema field; same stored path as `items`
    },
    shippingAddress: {
      type: addressSchema,
      required: [true, 'Shipping address is required'],
    },
    billingAddress: { type: addressSchema },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
    itemsTotal: { type: Number, required: [true, 'Items total is required'], min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: [true, 'Grand total is required'], min: 0, alias: 'amount' },
    currency: { type: String, default: 'USD', uppercase: true, trim: true },
    status: {
      type: String,
      enum: { values: ORDER_STATUS, message: 'Invalid order status' },
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: { values: PAYMENT_STATUS, message: 'Invalid payment status' },
      default: 'pending',
    },
    cancellation: {
      reason: { type: String, trim: true },
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      cancelledAt: Date,
    },
    shippedAt: Date,
    deliveredAt: Date,
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
orderSchema.index({ user: 1, status: 1 }); // customer order history filtered by status
orderSchema.index({ status: 1 }); // vendor/admin status queues
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 }); // "recent orders" lists & reporting
orderSchema.index({ 'items.vendor': 1 }); // vendor order queries (multi-vendor split)

module.exports = mongoose.model('Order', orderSchema);
