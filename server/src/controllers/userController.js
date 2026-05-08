const userService = require('../services/userService');
const { success } = require('../utils/responseHandler');

const getAll = async (req, res, next) => {
  try {
    const data = await userService.getAllUsers(req.query);
    return success(res, data);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return success(res, user);
  } catch (err) { next(err); }
};

const getLeaders = async (req, res, next) => {
  try {
    const leaders = await userService.getLeaders();
    return success(res, leaders);
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.user.id, req.body);
    return success(res, user, 'Profile updated');
  } catch (err) { next(err); }
};

const toggleActive = async (req, res, next) => {
  try {
    const user = await userService.toggleUserActive(req.params.id);
    return success(res, user, `User ${user.isActive ? 'activated' : 'deactivated'}`);
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, getLeaders, updateProfile, toggleActive };
