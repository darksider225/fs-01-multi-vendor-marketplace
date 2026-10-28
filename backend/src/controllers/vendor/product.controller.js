const { Product, Vendor } = require('../../models');
const ApiError = require('../../utils/apiError');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const httpStatus = require('../../constants/httpStatus');

/**
 * POST /api/v1/vendor/products
 * Only an authenticated user with an approved Vendor profile may create products.
 * Role gate (`authorize('vendor')`) runs before this controller.
 */
const createProduct = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });

  if (!vendor) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Vendor profile not found for this account.');
  }
  if (vendor.status !== 'approved') {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      `Vendor account is ${vendor.status}; only approved vendors can create products.`
    );
  }

  const product = await Product.create({
    vendor: vendor._id,
    category: req.body.category,
    title: req.body.title,
    description: req.body.description,
    brand: req.body.brand,
    images: req.body.images || [],
    price: req.body.price,
    compareAtPrice: req.body.compareAtPrice,
    currency: req.body.currency || 'USD',
    stock: req.body.stock ?? 0,
    status: req.body.status || 'published',
  });

  return sendSuccess(res, httpStatus.CREATED, 'Product created.', {
    product: product.toJSON(),
  });
});

module.exports = { createProduct };
