const HttpStatus = require('../constants/httpStatusCodes');
const ApiResponse = require('../utils/apiResponse');
const { ApiError } = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Centralized Error-Handling Middleware
 * Ensures every error conforms to { success: false, error: "..." }
 */
function errorHandler(err, req, res, next) {
  // Handle JSON syntax error from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.warn(`Malformed JSON received from ${req.ip} on ${req.method} ${req.originalUrl}`);
    return ApiResponse.error(
      res,
      'Malformed JSON payload: Please verify JSON formatting and syntax',
      HttpStatus.BAD_REQUEST
    );
  }

  // Handle custom ApiError instances
  if (err instanceof ApiError) {
    logger.warn(`Handled ApiError [${err.statusCode}]: ${err.message} on ${req.method} ${req.originalUrl}`);
    return ApiResponse.error(res, err.message, err.statusCode, err.details);
  }

  // Handle PostgreSQL Error 23505: Unique violation (e.g. duplicate name & category)
  if (err.code === '23505') {
    logger.warn(`Database Unique Violation [23505] on ${req.method} ${req.originalUrl}: ${err.detail || err.message}`);
    return ApiResponse.error(
      res,
      'A product with this name already exists in this category',
      HttpStatus.CONFLICT
    );
  }

  // Handle PostgreSQL Error 23503: Foreign key violation
  if (err.code === '23503' || (err.message && err.message.toLowerCase().includes('foreign key'))) {
    logger.warn(`Database Foreign Key Violation [23503] on ${req.method} ${req.originalUrl}: ${err.detail || err.message}`);
    return ApiResponse.error(
      res,
      'Referenced resource does not exist',
      HttpStatus.NOT_FOUND
    );
  }

  // Handle PostgreSQL Error 23514: Check constraint violation
  if (err.code === '23514' || (err.message && err.message.toLowerCase().includes('check constraint'))) {
    logger.warn(`Database Check Constraint Violation [23514] on ${req.method} ${req.originalUrl}: ${err.detail || err.message}`);
    return ApiResponse.error(
      res,
      'Invalid data: value violates database check constraint',
      HttpStatus.BAD_REQUEST
    );
  }

  // Handle PostgreSQL Connection Failures (ECONNREFUSED, 08001, 08006, 28P01, etc.)
  if (
    err.code === 'ECONNREFUSED' ||
    err.code === '08001' ||
    err.code === '08006' ||
    err.code === '28P01' ||
    err.code === '57P01' ||
    (err.message && err.message.toLowerCase().includes('connect econrefused'))
  ) {
    logger.error(`Database Connection Failure on ${req.method} ${req.originalUrl}:`, {
      code: err.code,
      message: err.message
    });
    // Never leak raw database connection details to the client
    return ApiResponse.error(
      res,
      'Database connection failure: service is temporarily unavailable',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  // Handle unexpected internal server errors
  logger.error(`Unhandled Server Error on ${req.method} ${req.originalUrl}:`, {
    message: err.message,
    stack: err.stack
  });

  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected internal server error occurred'
      : err.message || 'An unexpected internal server error occurred';

  return ApiResponse.error(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
}

module.exports = errorHandler;
