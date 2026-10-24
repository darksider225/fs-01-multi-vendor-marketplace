const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, trim: true, maxlength: [500, 'Description cannot exceed 500 characters'] },
    image: String,
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null, // null = top-level category
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
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

categorySchema.pre('validate', function () {
  // Prevent a category from being its own parent
  if (this.parent && this.parent.toString() === this._id.toString()) {
    throw new Error('A category cannot be its own parent');
  }
});

// --- Indexes ---
categorySchema.index({ isActive: 1, parent: 1 }); // browse active children of a parent
categorySchema.index({ parent: 1 }); // category tree traversal

module.exports = mongoose.model('Category', categorySchema);
