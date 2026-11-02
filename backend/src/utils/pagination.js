/**
 * Reusable pagination utility.
 * Returns { page, limit, skip, sort } for use across products, vendors, reviews, orders.
 *
 * @param {Object} query - Express request.query object
 * @param {Object} defaults - Default values { page, limit, sortBy, sortOrder }
 * @returns {Object} { page, limit, skip, sort }
 */
const paginate = (query, defaults = {}) => {
  const page = Math.max(parseInt(query.page, 10) || defaults.page || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(query.limit, 10) || defaults.limit || 10, 1),
    defaults.maxLimit || 100
  );
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || defaults.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : defaults.sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortOrder };

  return { page, limit, skip, sort };
};

module.exports = { paginate };
