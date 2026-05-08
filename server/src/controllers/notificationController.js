const notificationService = require('../services/notificationService');
const { success } = require('../utils/responseHandler');

const getAll = async (req, res, next) => {
  try {
    const data = await notificationService.getUserNotifications(req.user.id, req.query);
    return success(res, data);
  } catch (err) { next(err); }
};

const markRead = async (req, res, next) => {
  try {
    const notif = await notificationService.markAsRead(req.params.id, req.user.id);
    return success(res, notif, 'Marked as read');
  } catch (err) { next(err); }
};

const markAllRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    return success(res, null, 'All notifications marked as read');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await notificationService.deleteNotification(req.params.id, req.user.id);
    return success(res, null, 'Notification deleted');
  } catch (err) { next(err); }
};

module.exports = { getAll, markRead, markAllRead, remove };
