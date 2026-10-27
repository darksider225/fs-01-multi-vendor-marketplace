const env = require('../config/env');
const httpStatus = require('../constants/httpStatus');
const ApiError = require('../utils/apiError');

const handleCastError = (err) =>
  new ApiError(httpStatus.BAD_REQUEST, `Invalid ${err.path}: ${err.value}.`);

const handleDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue || {})[0];
  return new ApiError(httpStatus.CONFLICT, `A record with this ${field} already exists.`);
};

const handleValidationError = (err) =>
  new ApiError(httpStatus.BAD_REQUEST, `Validation failed: ${err.message}`);

/**
 * Global error handler. Single JSON shape:
 *   { success: false, message, details?, stack? }
 */
const errorHandler = (err, _req, res, _next) => {
  let error = { ...err };
  error.message = err.message || 'Something went wrong.';
  error.statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;

  if (err.name === 'CastError') error = handleCastError(err);
  else if (err.code === 11000) error = handleDuplicateKey(err);
  else if (err.name === 'ValidationError') error = handleValidationError(err);
  else if (err.name === 'JsonWebTokenError') {
    error = new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token. Please log in again.');
  } else if (err.name === 'TokenExpiredError') {
    error = new ApiError(httpStatus.UNAUTHORIZED, 'Your token has expired. Please log in again.');
  } else if (!error.isOperational) {
    error.isOperational = false;
  }

  const body = { success: false, message: error.message };
  if (error.details) body.details = error.details;
  if (env.NODE_ENV === 'development') body.stack = err.stack;

  res.status(error.statusCode).json(body);
};

module.exports = errorHandler;
