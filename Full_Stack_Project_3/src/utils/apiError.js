const HttpStatus = require('../constants/httpStatusCodes');

class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends ApiError {
  constructor(message = 'Bad Request', details = null) {
    super(HttpStatus.BAD_REQUEST, message, details);
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized: Authentication required') {
    super(HttpStatus.UNAUTHORIZED, message);
  }
}

class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden: Insufficient permissions to perform this action') {
    super(HttpStatus.FORBIDDEN, message);
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(HttpStatus.NOT_FOUND, message);
  }
}

class ConflictError extends ApiError {
  constructor(message = 'Resource conflict', details = null) {
    super(HttpStatus.CONFLICT, message, details);
  }
}

module.exports = {
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError
};
