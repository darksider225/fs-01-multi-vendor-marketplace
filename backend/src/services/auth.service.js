const { User } = require('../models');
const ApiError = require('../utils/apiError');
const { signToken } = require('../utils/token');
const httpStatus = require('../constants/httpStatus');
const messages = require('../constants/messages');

const buildAuthPayload = (user) => ({
  user: user.toJSON(),
  token: signToken({ sub: user._id.toString(), role: user.role }),
});

const registerUser = async ({ name, email, password, role = 'customer' }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(httpStatus.CONFLICT, 'An account with this email already exists.');
  }
  // Password hashing happens in User's pre('save') hook (bcrypt, 12 rounds)
  const user = await User.create({ name, email, password, role });
  return buildAuthPayload(user);
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, messages.AUTH.INVALID_CREDENTIALS);
  }
  if (!user.isActive) {
    throw new ApiError(httpStatus.FORBIDDEN, messages.AUTH.USER_DISABLED);
  }
  return buildAuthPayload(user);
};

const findUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, messages.AUTH.USER_NOT_FOUND);
  }
  if (!user.isActive) {
    throw new ApiError(httpStatus.UNAUTHORIZED, messages.AUTH.USER_DISABLED);
  }
  return user;
};

module.exports = { registerUser, loginUser, findUserById, buildAuthPayload };
