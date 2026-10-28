/**
 * Single source of truth for user roles, shared by the User model
 * and the authorization middleware.
 */
const ROLES = Object.freeze({
  ADMIN: 'admin',
  VENDOR: 'vendor',
  CUSTOMER: 'customer',
});

const ROLES_LIST = Object.freeze(Object.values(ROLES));

module.exports = { ROLES, ROLES_LIST };
