/**
 * Operational error with an HTTP status code.
 * Passed to the global error handler via `next(new ApiError(...))`.
 */
class ApiError extends Error {
  constructor(statusCode, message, details = undefined, isOperational = true) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (details !== undefined) this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
