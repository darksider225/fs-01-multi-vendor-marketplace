const { Vendor, User } = require('../../models');
const ApiError = require('../../utils/apiError');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const httpStatus = require('../../constants/httpStatus');
const { VENDOR_APPROVAL_STATUS, ROLES } = require('../../constants/statusCodes');

/**
 * POST /api/v1/vendor/apply
 * Customer applies to become a vendor. Creates a pending Vendor profile.
 */
const applyVendor = asyncHandler(async (req, res) => {
  const { storeName, slug, contactEmail, phone, description } = req.body;

  // Check for existing vendor profile for this user
  const existingVendor = await Vendor.findOne({ user: req.user._id });

  if (existingVendor) {
    if (existingVendor.approvalStatus === 'pending') {
      throw new ApiError(httpStatus.CONFLICT, 'A vendor application is already pending.');
    }
    if (existingVendor.approvalStatus === 'approved') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'You are already an approved vendor.');
    }
    if (existingVendor.approvalStatus === 'rejected') {
      // Allow resubmission by updating existing profile to pending
      existingVendor.storeName = storeName;
      existingVendor.slug = slug;
      existingVendor.contactEmail = contactEmail;
      existingVendor.phone = phone;
      existingVendor.description = description;
      existingVendor.approvalStatus = 'pending';
      existingVendor.approvedBy = undefined;
      existingVendor.approvedAt = undefined;
      await existingVendor.save();

      return sendSuccess(res, httpStatus.CREATED, 'Vendor application resubmitted successfully.', {
        vendor: existingVendor.toJSON(),
      });
    }
  }

  const vendor = await Vendor.create({
    user: req.user._id,
    storeName,
    slug,
    contactEmail,
    phone,
    description,
    approvalStatus: 'pending',
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
