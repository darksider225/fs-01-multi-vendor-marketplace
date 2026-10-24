const mongoose = require('mongoose');

const PAYMENT_METHODS = ['card', 'upi', 'netbanking', 'cod', 'wallet', 'paypal', 'stripe', 'razorpay'];
const PAYMENT_STATUS = ['pending', 'processing', 'succeeded', 'failed', 'refunded', 'chargeback'];
const REFUND_STATUS = ['none', 'partial', 'full'];

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order is required'],
      unique: true, // single payment record per order
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    }, // denormalized for payment history queries
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    method: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: { values: PAYMENT_METHODS, message: 'Invalid payment method' },
    },
    provider: { type: String, trim: true }, // e.g. stripe / razorpay
    transactionId: { type: String, sparse: true, unique: true, trim: true },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Payment amount cannot be negative'],
    },
    currency: { type: String, default: 'USD', uppercase: true, trim: true },
    status: {
      type: String,
      enum: { values: PAYMENT_STATUS, message: 'Invalid payment status' },
      default: 'pending',
    },
    refund: {
      amount: { type: Number, min: [0, 'Refund amount cannot be negative'] },
      reason: { type: String, trim: true },
      status: { type: String, enum: { values: REFUND_STATUS, message: 'Invalid refund status' }, default: 'none' },
      processedAt: Date,
    },
    metadata: { type: mongoose.Schema.Types.Mixed }, // gateway payload (webhooks, idempotency)
    paidAt: Date,
    failedAt: Date,
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
paymentSchema.index({ user: 1, status: 1 }); // customer payment history by status
paymentSchema.index({ status: 1, createdAt: 1 }); // settlements / reconciliation queues
paymentSchema.index({ vendor: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
