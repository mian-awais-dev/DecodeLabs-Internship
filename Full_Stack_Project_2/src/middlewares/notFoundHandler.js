const HttpStatus = require('../constants/httpStatusCodes');
const ApiResponse = require('../utils/apiResponse');

/**
 * 404 Handler for undefined routes
 */
function notFoundHandler(req, res) {
  return ApiResponse.error(
    res,
    `Cannot ${req.method} ${req.originalUrl} - Endpoint does not exist`,
    HttpStatus.NOT_FOUND
  );
}

module.exports = notFoundHandler;
