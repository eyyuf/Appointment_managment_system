const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

// Log slow queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    if (e.duration > 200) {
      logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
    }
  });
}

// Test connection
prisma.$connect()
  .then(() => logger.info('✅ PostgreSQL connected via Prisma'))
  .catch((err) => {
    logger.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });

module.exports = prisma;
