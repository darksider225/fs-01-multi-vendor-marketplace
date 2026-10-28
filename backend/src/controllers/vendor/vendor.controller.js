const { Vendor, User } = require('../../models');
const ApiError = require('../../utils/apiError');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const httpStatus = require('../../constants/httpStatus');
const { ROLES } = require('../../constants/roles');

/**
 * POST /api/v1/vendor/apply
 * Customer applies to become a vendor. Creates a pending Vendor profile.
 */
const applyVendor = asyncHandler(async (req, res) => {
  const { storeName, slug, contactEmail, phone, description } = req.body;

  // Prevent duplicate vendor profiles
  const existingVendor = await Vendor.findOne({ user: req.user._id });
  if (existingVendor) {
    throw new ApiError(httpStatus.CONFLICT, 'Vendor profile already exists for this account.');
  }

  const vendor = await Vendor.create({
    user: req.user._id,
    storeName,
    slug,
    contactEmail,
    phone,
    description,
    status: 'pending',
  });

  return sendSuccess(res, httpStatus.CREATED, 'Vendor application submitted successfully.', {
    vendor: vendor.toJSON(),
  });
});

/**
 * GET /api/v1/vendor/profile
 * Vendor views own store profile.
 */
const getVendorProfile = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Vendor profile not found.');
  }
  return sendSuccess(res, httpStatus.OK, 'Vendor profile retrieved.', {
    vendor: vendor.toJSON(),
  });
});

/**
 * PUT /api/v1/vendor/profile
 * Vendor updates own store profile (cannot change status).
 */
const updateVendorProfile = asyncHandler(async (req, res) => {
  const { storeName, description, phone, address, logo, banner } = req.body;

  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Vendor profile not found.');
  }

  if (storeName) vendor.storeName = storeName;
  if (description !== undefined) vendor.description = description;
  if (phone !== undefined) vendor.phone = phone;
  if (address) vendor.address = address;
  if (logo !== undefined) vendor.logo = logo;
  if (banner !== undefined) vendor.banner = banner;

  await vendor.save();

  return sendSuccess(res, httpStatus.OK, 'Vendor profile updated.', {
    vendor: vendor.toJSON(),
  });
});

/**
 * PUT /api/v1/vendor/settings
 * Vendor updates payout settings.
 */
const updateVendorSettings = asyncHandler(async (req, res) => {
  const { payoutDetails } = req.body;

  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Vendor profile not found.');
  }

  if (payoutDetails) vendor.payoutDetails = payoutDetails;

  await vendor.save();

  return sendSuccess(res, httpStatus.OK, 'Vendor settings updated.', {
    vendor: vendor.toJSON(),
  });
});

module.exports = { applyVendor, getVendorProfile, updateVendorProfile, updateVendorSettings };
