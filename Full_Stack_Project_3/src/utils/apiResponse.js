const HttpStatus = require('../constants/httpStatusCodes');

class ApiResponse {
  /**
   * Send a successful JSON response
   * @param {import('express').Response} res
   * @param {*} data
   * @param {number} [statusCode=200]
   * @param {object} [meta=null]
   */
  static success(res, data, statusCode = HttpStatus.OK, meta = null) {
    const payload = {
      success: true,
      data
    };

    if (meta && typeof meta === 'object') {
      Object.assign(payload, meta);
    }

    return res.status(statusCode).json(payload);
  }

  /**
   * Send 204 No Content response
   * @param {import('express').Response} res
   */
  static noContent(res) {
    return res.status(HttpStatus.NO_CONTENT).send();
  }

  /**
   * Send an error JSON response
   * @param {import('express').Response} res
   * @param {string} message
   * @param {number} [statusCode=500]
   * @param {*} [details=null]
   */
  static error(res, message, statusCode = HttpStatus.INTERNAL_SERVER_ERROR, details = null) {
    const payload = {
      success: false,
      error: message
    };

    if (details !== null && details !== undefined) {
      payload.details = details;
    }

    return res.status(statusCode).json(payload);
  }
}

module.exports = ApiResponse;
