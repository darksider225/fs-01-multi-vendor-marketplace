const ApiError = require('../../utils/apiError');
const { verifyToken } = require('../../utils/token');
const { findUserById } = require('../../services/auth.service');
const asyncHandler = require('../../utils/asyncHandler');
const httpStatus = require('../../constants/httpStatus');
const messages = require('../../constants/messages');

/**
 * Verifies the `Authorization: Bearer <token>` header, loads the user,
 * and attaches them to `req.user`. Guards: token missing/invalid, user
 * deleted, user disabled, and tokens issued before a password change.
 */
const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    throw new ApiError(httpStatus.UNAUTHORIZED, messages.AUTH.TOKEN_REQUIRED);
  }
  const token = header.split(' ')[1];

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, messages.AUTH.INVALID_TOKEN);
  }

  const user = await findUserById(decoded.sub);

  if (decoded.iat && user.isPasswordChangedAfter(decoded.iat)) {
    throw new ApiError(httpStatus.UNAUTHORIZED, messages.AUTH.PASSWORD_CHANGED);
  }

  req.user = user;
  next();
});

module.exports = { authenticate };
