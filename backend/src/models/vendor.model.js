const mongoose = require('mongoose');

const VENDOR_STATUS = ['pending', 'approved', 'suspended', 'rejected'];

const vendorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor account is required'],
      unique: true, // one store profile per user
    },
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
      maxlength: [120, 'Store name cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Store slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    logo: String,
    banner: String,
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    contactEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid contact email'],
    },
    phone: { type: String, trim: true },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      pincode: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: { values: VENDOR_STATUS, message: 'Invalid vendor status' },
      default: 'pending',
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    commissionRate: {
      type: Number,
      default: 0.1, // 10% platform commission
      min: [0, 'Commission rate cannot be below 0'],
      max: [1, 'Commission rate cannot exceed 1'],
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalSales: { type: Number, default: 0, min: 0 },
    payoutDetails: {
      bankName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      ifsc: { type: String, trim: true },
      upiId: { type: String, trim: true },
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
vendorSchema.index({ storeName: 'text' }); // store search
vendorSchema.index({ status: 1, rating: -1 }); // admin listing + marketplace browsing

module.exports = mongoose.model('Vendor', vendorSchema);
