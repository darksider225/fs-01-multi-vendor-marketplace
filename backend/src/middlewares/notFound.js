const httpStatus = require('../constants/httpStatus');
const ApiError = require('../utils/apiError');

const notFound = (req, _res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, `Route ${req.originalUrl} not found.`));
};

module.exports = notFound;
