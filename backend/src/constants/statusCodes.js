/**
 * Centralized constants for the multi-vendor marketplace.
 * Single source of truth for enums used across models, validators, and controllers.
 */

// --- User Roles ---
const USER_ROLES = Object.freeze({
  ADMIN: 'admin',
  VENDOR: 'vendor',
  CUSTOMER: 'customer',
});

const USER_ROLES_LIST = Object.freeze(Object.values(USER_ROLES));

// --- Vendor Approval Status ---
const VENDOR_APPROVAL_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

const VENDOR_APPROVAL_STATUS_LIST = Object.freeze(Object.values(VENDOR_APPROVAL_STATUS));

// --- Product Status ---
const PRODUCT_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  UNPUBLISHED: 'unpublished',
  ARCHIVED: 'archived',
});

const PRODUCT_STATUS_LIST = Object.freeze(Object.values(PRODUCT_STATUS));

// --- Order Status ---
const ORDER_STATUS = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
});

const ORDER_STATUS_LIST = Object.freeze(Object.values(ORDER_STATUS));

// --- Payment Status ---
const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
});

const PAYMENT_STATUS_LIST = Object.freeze(Object.values(PAYMENT_STATUS));

module.exports = {
  ROLES: USER_ROLES,
  USER_ROLES,
  USER_ROLES_LIST,
  VENDOR_APPROVAL_STATUS,
  VENDOR_APPROVAL_STATUS_LIST,
  PRODUCT_STATUS,
  PRODUCT_STATUS_LIST,
  ORDER_STATUS,
  ORDER_STATUS_LIST,
  PAYMENT_STATUS,
  PAYMENT_STATUS_LIST,
};
