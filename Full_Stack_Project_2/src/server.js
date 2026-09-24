const app = require('./app');
const config = require('./config/config');
const logger = require('./utils/logger');

const server = app.listen(config.port, () => {
  logger.info(`Server successfully started and listening on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`API Base URL: http://localhost:${config.port}`);
  logger.info(`Health Check: http://localhost:${config.port}/health`);
  logger.info(`Products Endpoint: http://localhost:${config.port}/products`);
});

/**
 * Handle unhandled Promise rejections (Circuit Breaker / Resilience)
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection detected:', {
    reason: reason instanceof Error ? reason.stack : reason,
    promise
  });
  // Do not crash immediately in non-production; in production, consider graceful exit
});

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown:', {
    message: error.message,
    stack: error.stack
  });

  // Gracefully terminate after unrecoverable error
  gracefulShutdown('uncaughtException');
});

/**
 * Graceful shutdown handler
 * @param {string} signal
 */
function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Shutting down HTTP server gracefully...`);

  server.close(() => {
    logger.info('HTTP server closed. Exiting process.');
    process.exit(signal === 'uncaughtException' ? 1 : 0);
  });

  // Force close if graceful shutdown takes too long (10 seconds timeout)
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = server;
