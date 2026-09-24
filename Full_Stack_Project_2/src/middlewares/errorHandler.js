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
