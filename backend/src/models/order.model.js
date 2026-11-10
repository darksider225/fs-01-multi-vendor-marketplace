const mongoose = require("mongoose");
const { ORDER_STATUS, PAYMENT_STATUS, ORDER_STATUS_LIST, PAYMENT_STATUS_LIST } = require("../constants/statusCodes");
const { v4: uuidv4 } = require("uuid");

function generateOrderNumber() {
  const date = new Date();
  const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = uuidv4().slice(0, 8).toUpperCase();
  return `ORD-${yyyymmdd}-${suffix}`;
}

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: [true, "Product reference is required"] },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: [true, "Vendor reference is required"] },
    title: { type: String, required: [true, "Product title snapshot is required"], trim: true, maxlength: [200, "Title cannot exceed 200 characters"] },
    sku: { type: String, trim: true },
    quantity: { type: Number, required: [true, "Quantity is required"], min: [1, "Quantity must be at least 1"], validate: { validator: Number.isInteger, message: "Quantity must be an integer" } },
    unitPrice: { type: Number, required: [true, "Unit price snapshot is required"], min: [0, "Unit price cannot be negative"] },
    totalPrice: { type: Number, required: [true, "Total price snapshot is required"], min: [0, "Total price cannot be negative"] },
    image: { type: String, trim: true },
  },
  { _id: false }
);

const vendorSplitSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: [true, "Vendor reference is required"] },
    vendorStoreName: { type: String, required: [true, "Vendor store name snapshot is required"], trim: true },
    subtotal: { type: Number, required: [true, "Vendor subtotal is required"], min: [0, "Subtotal cannot be negative"] },
    commissionAmount: { type: Number, required: [true, "Commission amount is required"], min: [0, "Commission cannot be negative"] },
    payoutAmount: { type: Number, required: [true, "Payout amount is required"], min: [0, "Payout amount cannot be negative"] },
    commissionRate: { type: Number, required: [true, "Commission rate snapshot is required"], min: [0, "Commission rate cannot be negative"], max: [1, "Commission rate cannot exceed 1"] },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: [true, "Full name is required"], trim: true },
    phone: { type: String, required: [true, "Phone is required"], trim: true, match: [/^[0-9+\-\s]{10,15}$/, "Please provide a valid phone number"] },
    line1: { type: String, required: [true, "Address line 1 is required"], trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: [true, "City is required"], trim: true },
    state: { type: String, required: [true, "State is required"], trim: true },
    pincode: { type: String, required: [true, "Pincode is required"], trim: true },
    country: { type: String, required: [true, "Country is required"], trim: true, default: "US" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: [true, "Order number is required"], trim: true, uppercase: true, default: generateOrderNumber },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: [true, "Customer is required"] },
    items: { type: [orderItemSchema], required: [true, "An order must contain at least one item"], validate: { validator: (items) => Array.isArray(items) && items.length > 0, message: "An order must contain at least one item" } },
    vendorSplits: { type: [vendorSplitSchema], default: [] },
    shippingAddress: { type: addressSchema, required: [true, "Shipping address is required"] },
    billingAddress: { type: addressSchema },
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", default: null },
    couponCode: { type: String, trim: true, uppercase: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', sparse: true },
    stripeCheckoutSessionId: { type: String, sparse: true, unique: true, trim: true },
    razorpayOrderId: { type: String, sparse: true, unique: true, trim: true },
    platformFeeAmount: { type: Number, min: [0, 'Platform fee cannot be negative'], default: 0 },
    subtotal: { type: Number, required: [true, "Subtotal is required"], min: [0, "Subtotal cannot be negative"] },
    taxAmount: { type: Number, default: 0, min: [0, "Tax cannot be negative"] },
    shippingFee: { type: Number, default: 0, min: [0, "Shipping fee cannot be negative"] },
    discountAmount: { type: Number, default: 0, min: [0, "Discount cannot be negative"] },
    totalAmount: { type: Number, required: [true, "Total amount is required"], min: [0, "Total amount cannot be negative"] },
    currency: { type: String, default: "USD", uppercase: true, trim: true },
    orderStatus: { type: String, enum: { values: ORDER_STATUS_LIST, message: "Invalid order status" }, default: "pending" },
    paymentStatus: { type: String, enum: { values: PAYMENT_STATUS_LIST, message: "Invalid payment status" }, default: "pending" },
    stripePaymentIntentId: { type: String, trim: true, sparse: true, unique: true },
    stripeClientSecret: { type: String, trim: true },
    invoiceNumber: { type: String, trim: true, sparse: true },
    invoiceUrl: { type: String, trim: true },
    invoiceGeneratedAt: Date,
    cancellation: { reason: { type: String, trim: true }, cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, cancelledAt: Date },
    shippedAt: Date,
    deliveredAt: Date,
    placedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform(_doc, ret) { ret.id = ret._id.toString(); delete ret._id; delete ret.__v; } },
  }
);

// --- Indexes ---
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ customer: 1, orderStatus: 1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ "items.vendor": 1, orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "items.product": 1 });
orderSchema.index({ placedAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
