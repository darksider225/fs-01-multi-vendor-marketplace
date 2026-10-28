const ApiError = require('../../utils/apiError');
const httpStatus = require('../../constants/httpStatus');
const { ROLES } = require('../../constants/roles');

/**
 * Role-based access control (RBAC). Usage:
 *
 *   // Only Vendor ➜ Create Product
 *   router.post('/products', authenticate, authorize(ROLES.VENDOR), vendorProductCtrl.create);
 *
 *   // Only Admin ➜ Approve Vendor
 *   router.post('/vendors/:id/approve', authenticate, authorize(ROLES.ADMIN), adminVendorCtrl.approve);
 *
 *   // Only Customer ➜ Place Order
 *   router.post('/orders', authenticate, authorize(ROLES.CUSTOMER), customerOrderCtrl.create);
 *
 *   // Multi-role (either role passes)
 *   router.get('/reports', authenticate, authorize(ROLES.ADMIN, ROLES.VENDOR), ctrl.report);
 *
 * Requires `authenticate` to have run first, so `req.user` is the DB-loaded user.
 * The role is trusted from the database, never from the JWT claim.
 */
const authorize = (...roles) => (req, _res, next) => {
  // Fail closed: authorize() with no roles must never accidentally allow.
  if (!roles.length) {
    return next(new ApiError(httpStatus.FORBIDDEN, 'Route is missing role restrictions.'));
  }

  if (!req.user) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required.'));
  }

  if (!roles.includes(req.user.role)) {
    return next(
      new ApiError(
        httpStatus.FORBIDDEN,
        `Role '${req.user.role}' is not allowed to perform this action.`
      )
    );
  }

  return next();
};

// Convenience wrappers for single-role routes
const isAdmin = authorize(ROLES.ADMIN);
const isVendor = authorize(ROLES.VENDOR);
const isCustomer = authorize(ROLES.CUSTOMER);

module.exports = { authorize, isAdmin, isVendor, isCustomer };
