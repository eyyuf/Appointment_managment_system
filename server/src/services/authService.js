const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { generateTokenPair } = require('../utils/generateToken');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Register a new user
 */
const register = async ({ fullName, email, password, role, phone, department }) => {
  // Check email uniqueness
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, config.bcrypt.rounds);

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      password: hashedPassword,
      role: role || 'STUDENT',
      phone,
      department,
    },
    select: {
      id: true, fullName: true, email: true, role: true,
      phone: true, department: true, createdAt: true,
    },
  });

  const tokens = generateTokenPair(user);
  logger.info(`New user registered: ${email} [${user.role}]`);
  return { user, ...tokens };
};

/**
 * Login user
 */
const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error('Account is deactivated. Contact admin.');
    err.statusCode = 403;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const safeUser = {
    id: user.id, fullName: user.fullName, email: user.email,
    role: user.role, phone: user.phone, department: user.department,
  };

  const tokens = generateTokenPair(safeUser);
  logger.info(`User logged in: ${email}`);
  return { user: safeUser, ...tokens };
};

/**
 * Change password
 */
const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw Object.assign(new Error('Current password is incorrect'), { statusCode: 400 });

  const hashed = await bcrypt.hash(newPassword, config.bcrypt.rounds);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  logger.info(`Password changed for user: ${userId}`);
};

/**
 * Update FCM token for push notifications
 */
const updateFcmToken = async (userId, fcmToken) => {
  await prisma.user.update({ where: { id: userId }, data: { fcmToken } });
};

module.exports = { register, login, changePassword, updateFcmToken };
