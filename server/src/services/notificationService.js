const prisma = require('../config/db');
const logger = require('../utils/logger');

const createNotification = async ({ userId, title, message, type = 'GENERAL', data = null }) => {
  try {
    return await prisma.notification.create({ data: { userId, title, message, type, data } });
  } catch (err) {
    logger.error(`Failed to create notification: ${err.message}`);
  }
};

const getUserNotifications = async (userId, { page = 1, limit = 30, unreadOnly = false } = {}) => {
  const skip = (page - 1) * limit;
  const where = { userId };
  if (unreadOnly === 'true' || unreadOnly === true) where.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);
  return { notifications, total, unreadCount, page: Number(page), limit: Number(limit) };
};

const markAsRead = async (notificationId, userId) => {
  const notif = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notif) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  if (notif.userId !== userId) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
  return prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });
};

const markAllAsRead = async (userId) => {
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
};

const deleteNotification = async (notificationId, userId) => {
  const notif = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notif) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  if (notif.userId !== userId) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
  await prisma.notification.delete({ where: { id: notificationId } });
};

module.exports = { createNotification, getUserNotifications, markAsRead, markAllAsRead, deleteNotification };
