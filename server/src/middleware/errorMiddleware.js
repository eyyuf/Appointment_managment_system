const logger = require('../utils/logger');
const { error: errorResponse, notFound } = require('../utils/responseHandler');

const DEFAULT_ERROR_MESSAGE = 'Internal server error';

const mapKnownError = (err) => {
  if (!err) return null;

  if (err.code === 'P2002') {
    const targetFields = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'value';
    return { statusCode: 409, message: `A record with this ${targetFields} already exists.` };
  }

  if (err.code === 'P2025') {
    return { statusCode: 404, message: 'Record not found.' };
  }

  if (err.name === 'JsonWebTokenError') {
    return { statusCode: 401, message: 'Invalid token' };
  }

  if (err.name === 'TokenExpiredError') {
    return { statusCode: 401, message: 'Token expired' };
  }

  return null;
};

/**
 * Global error handling middleware. Register this after all routes.
 */
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const errorMessage = err?.message || DEFAULT_ERROR_MESSAGE;
  logger.error(`${errorMessage}\n${err?.stack || 'No stack trace'}`);

  const mapped = mapKnownError(err);
  if (mapped) {
    return errorResponse(res, mapped.message, mapped.statusCode);
  }

  const statusCode = Number.isInteger(err?.statusCode) ? err.statusCode : 500;
  const isProd = process.env.NODE_ENV === 'production';
  const message = isProd && statusCode >= 500 ? DEFAULT_ERROR_MESSAGE : errorMessage;

  return errorResponse(res, message, statusCode);
};

/**
 * 404 handler for unmatched routes.
 */
const notFoundHandler = (req, res) => {
  return notFound(res, `Route ${req.method} ${req.originalUrl} not found`);
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
