const authService = require('../services/authService');
const { success, created, error } = require('../utils/responseHandler');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return created(res, result, 'Registration successful');
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return success(res, result, 'Login successful');
  } catch (err) { next(err); }
};

const logout = async (req, res) => {
  return success(res, null, 'Logged out successfully');
};

const getMe = async (req, res) => {
  return success(res, req.user, 'Profile fetched');
};

const changePassword = async (req, res, next) => {
  try {
    await authService.changePassword(req.user.id, req.body);
    return success(res, null, 'Password changed successfully');
  } catch (err) { next(err); }
};

const updateFcmToken = async (req, res, next) => {
  try {
    await authService.updateFcmToken(req.user.id, req.body.fcmToken);
    return success(res, null, 'FCM token updated');
  } catch (err) { next(err); }
};

module.exports = { register, login, logout, getMe, changePassword, updateFcmToken };
