/**
 * Uniform JSON success envelope: { success, message, data }.
 */
const sendSuccess = (res, statusCode, message, data = null) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  return res.status(statusCode).json(body);
};

module.exports = { sendSuccess };
