const { registerUser, loginUser } = require('../../services/auth.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const httpStatus = require('../../constants/httpStatus');
const messages = require('../../constants/messages');

const register = asyncHandler(async (req, res) => {
  const data = await registerUser(req.body);
  return sendSuccess(res, httpStatus.CREATED, messages.AUTH.REGISTER_SUCCESS, data);
});

const login = asyncHandler(async (req, res) => {
  const data = await loginUser(req.body);
  return sendSuccess(res, httpStatus.OK, messages.AUTH.LOGIN_SUCCESS, data);
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return sendSuccess(res, httpStatus.OK, 'Authenticated.', { user: req.user.toJSON() });
});

module.exports = { register, login, getCurrentUser };
