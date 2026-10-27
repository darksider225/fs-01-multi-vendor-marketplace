const ApiError = require('../../utils/apiError');
const httpStatus = require('../../constants/httpStatus');

/**
 * Role-based access control. Usage: authorize('admin') or authorize('admin', 'vendor').
 * Requires `authenticate` to have run first (req.user must exist).
 */
const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required.'));
  }
  if (!roles.includes(req.user.role)) {
    return next(
      new ApiError(httpStatus.FORBIDDEN, `Role '${req.user.role}' is not allowed to perform this action.`)
    );
  }
  return next();
};

module.exports = { authorize };
