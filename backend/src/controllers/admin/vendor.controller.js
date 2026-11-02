const { paginate } = require('../../utils/pagination');
const { Vendor, User } = require('../../models');
const ApiError = require('../../utils/apiError');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const httpStatus = require('../../constants/httpStatus');
const { VENDOR_APPROVAL_STATUS } = require('../../constants/statusCodes');

/**
 * GET /api/v1/admin/vendors
 * Admin lists all vendors with optional status filter and pagination.
 */
const listVendors = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = paginate(req.query);
  const status = req.query.status;

  const filter = {};
  if (status) filter.approvalStatus = status;

  const vendors = await Vendor.find(filter)
    .populate('user', 'name email role isActive')
    .skip(skip)
    .limit(limit)
    .sort(sort);

  const total = await Vendor.countDocuments(filter);

  return sendSuccess(res, httpStatus.OK, 'Vendors retrieved.', {
    vendors,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

/**
 * GET /api/v1/admin/vendors/:id
 * Admin views a single vendor's details.
 */
const getVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id)
    .populate('user', 'name email role isActive');
  if (!vendor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Vendor not found.');
  }
  return sendSuccess(res, httpStatus.OK, 'Vendor retrieved.', {
    vendor: vendor.toJSON(),
  });
});

/**
 * PUT /api/v1/admin/vendors/:id/approve
 * Admin approves or rejects a vendor application.
 * When approved, the linked User.role is upgraded to 'vendor'.
 */
const approveVendor = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Status must be approved or rejected.');
  }

  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Vendor not found.');
  }

  vendor.approvalStatus = status;
  vendor.approvedBy = req.user._id;
  vendor.approvedAt = new Date();

  await vendor.save();

  // Promote user role to 'vendor' when approved
  if (status === 'approved') {
    await User.findByIdAndUpdate(vendor.user, { role: 'vendor' });
  }

  return sendSuccess(res, httpStatus.OK, `Vendor ${status} successfully.`, {
    vendor: vendor.toJSON(),
  });
});

module.exports = { listVendors, getVendor, approveVendor };
