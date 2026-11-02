const { Product, Vendor } = require('../../models');
const ApiError = require('../../utils/apiError');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const httpStatus = require('../../constants/httpStatus');
const { paginate } = require('../../utils/pagination');

/**
 * GET /api/v1/products
 * Public marketplace endpoint - list active products from approved vendors.
 * No authentication required.
 */
const listPublicProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = paginate(req.query);

  const filter = {
    isDeleted: false,
    status: 'published',
  };

  // Only products from approved vendors
  const approvedVendors = await Vendor.find({ approvalStatus: 'approved' }).select('_id');
  const approvedVendorIds = approvedVendors.map((v) => v._id);
  filter.vendor = { $in: approvedVendorIds };

  // Category filter
  if (req.query.category) filter.category = req.query.category;

  // Price range filter
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
  }

  // Text search
  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }

  const products = await Product.find(filter)
    .populate('category', 'name slug')
    .populate('vendor', 'storeName slug')
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
 * GET /api/v1/products/:id
 * Public marketplace endpoint - view a single active product from an approved vendor.
 * No authentication required.
 */
const getPublicProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    isDeleted: false,
    status: 'published',
  })
    .populate('category', 'name slug')
    .populate('vendor', 'storeName slug contactEmail');

  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found.');
  }

  // Verify vendor is approved
  const vendor = await Vendor.findById(product.vendor._id);
  if (!vendor || vendor.approvalStatus !== 'approved') {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found.');
  }

  return sendSuccess(res, httpStatus.OK, 'Product retrieved.', {
    product: product.toJSON(),
  });
});

module.exports = { listPublicProducts, getPublicProduct };