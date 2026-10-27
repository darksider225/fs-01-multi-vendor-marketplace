/**
 * Wraps async route handlers so rejected promises are forwarded
 * to the global error handler (Express 5 also does this natively,
 * but this keeps the handler signature explicit and predictable).
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
