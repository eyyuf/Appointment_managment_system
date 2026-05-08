const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/generateToken');
const logger = require('../utils/logger');

let io;

const setupSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || '*', methods: ['GET', 'POST'] },
  });

  // JWT auth for sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = verifyAccessToken(token);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    logger.info(`Socket connected: ${userId}`);

    // Join personal room for targeted notifications
    socket.join(`user:${userId}`);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${userId}`);
    });
  });

  logger.info('✅ Socket.IO initialized');
  return io;
};

/**
 * Emit a real-time notification to a specific user
 */
const emitToUser = (userId, event, data) => {
  if (io) io.to(`user:${userId}`).emit(event, data);
};

module.exports = { setupSocket, emitToUser };
