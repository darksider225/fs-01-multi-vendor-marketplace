const { Product, Vendor } = require('../../models');
const ApiError = require('../../utils/apiError');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const httpStatus = require('../../constants/httpStatus');
const { paginate } = require('../../utils/pagination');

/**
 * POST /api/v1/vendor/products
 * Only an authenticated user with an approved Vendor profile may create products.
 */
const createProduct = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });

  if (!vendor) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Vendor profile not found for this account.');
  }
  if (vendor.approvalStatus !== 'approved') {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      `Vendor account is ${vendor.approvalStatus}; only approved vendors can create products.`
    );
  }

  // Verify category exists
  const Category = require('../../models/category.model');
  const categoryExists = await Category.findById(req.body.category);
  if (!categoryExists) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found.');
  }

  const product = await Product.create({
    vendor: vendor._id,
    category: req.body.category,
    title: req.body.title,
    description: req.body.description,
    images: req.body.images || [],
    price: req.body.price,
    stock: req.body.stock ?? 0,
    status: req.body.status || 'published',
  });

  return sendSuccess(res, httpStatus.CREATED, 'Product created.', {
    product: product.toJSON(),
  });
});

/**
 * GET /api/v1/vendor/products
 * List vendor's own products with pagination, optional filters.
 */
const listProducts = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Vendor profile not found for this account.');
  }

  const { page, limit, skip, sort } = paginate(req.query);

  const filter = { vendor: vendor._id, isDeleted: false };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const products = await Product.find(filter)
    .populate('category', 'name slug')
    .skip(skip)
    .limit(limit)
    .sort(sort);

  const total = await Product.countDocuments(filter);

  return sendSuccess(res, httpStatus.OK, 'Products retrieved.', {
    products,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

/**
 * GET /api/v1/vendor/products/:id
 * View a single product owned by the vendor.
 */
const getProduct = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Vendor profile not found for this account.');
  }

  const product = await Product.findOne({ _id: req.params.id, vendor: vendor._id, isDeleted: false })
    .populate('category', 'name slug');
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found.');
  }

  return sendSuccess(res, httpStatus.OK, 'Product retrieved.', {
    product: product.toJSON(),
  });
});

/**
 * PUT /api/v1/vendor/products/:id
 * Update a product owned by the vendor.
 */
const updateProduct = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Vendor profile not found for this account.');
  }

  const product = await Product.findOne({ _id: req.params.id, vendor: vendor._id, isDeleted: false });
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found.');
  }

  const allowedFields = [
    'title', 'category', 'description', 'images',
    'price', 'stock', 'status',
  ];

  // Verify category exists if being updated
  if (req.body.category !== undefined) {
    const Category = require('../../models/category.model');
    const categoryExists = await Category.findById(req.body.category);
    if (!categoryExists) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Category not found.');
    }
  }

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  await product.save();
  await product.populate('category', 'name slug');

  return sendSuccess(res, httpStatus.OK, 'Product updated.', {
    product: product.toJSON(),
  });
});

/**
 * DELETE /api/v1/vendor/products/:id
 * Delete (soft delete) a product owned by the vendor.
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Vendor profile not found for this account.');
  }

  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, vendor: vendor._id, isDeleted: false },
    { $set: { isDeleted: true, deletedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found.');
  }

  return sendSuccess(res, httpStatus.OK, 'Product deleted.', {
    productId: product._id,
  });
});

module.exports = { createProduct, listProducts, getProduct, updateProduct, deleteProduct };

