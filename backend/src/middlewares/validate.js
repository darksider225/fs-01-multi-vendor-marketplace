const { validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');
const httpStatus = require('../constants/httpStatus');

/**
 * Runs after the express-validator chains and forwards the first
 * validation error (with full details) to the error handler.
 */
const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(httpStatus.BAD_REQUEST, errors.array()[0].msg, errors.array()));
  }
  return next();
};

module.exports = validate;
