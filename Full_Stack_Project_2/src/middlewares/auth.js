const config = require('../config/config');
const HttpStatus = require('../constants/httpStatusCodes');
const ApiResponse = require('../utils/apiResponse');

/**
 * Extract auth credentials from request headers
 * Checks Authorization header (Bearer <token>) and x-api-key header
 * @param {import('express').Request} req
 */
function extractCredentials(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token && config.auth.tokens[token]) {
      return config.auth.tokens[token];
    }
  }

  const apiKeyHeader = req.headers['x-api-key'];
  if (apiKeyHeader) {
    const key = apiKeyHeader.trim();
    if (key && config.auth.apiKeys[key]) {
      return config.auth.apiKeys[key];
    }
  }

  return null;
}

/**
 * Authentication Middleware (AuthN)
 * Verifies who the caller is. Rejects unauthenticated requests with 401 Unauthorized.
 */
function authenticate(req, res, next) {
  const user = extractCredentials(req);
  if (!user) {
    return ApiResponse.error(
      res,
      'Unauthorized: Missing or invalid authentication token or API key',
      HttpStatus.UNAUTHORIZED
    );
  }

  req.user = user;
  next();
}

/**
 * Optional Authentication Middleware
 * Attaches user to req if valid token is provided, but does not block if omitted.
 */
function optionalAuth(req, res, next) {
  const user = extractCredentials(req);
  if (user) {
    req.user = user;
  }
  next();
}

/**
 * Authorization Middleware Factory (AuthZ)
 * Verifies whether the authenticated user has one of the allowed roles.
 * Returns 403 Forbidden if the user's role is not authorized.
 * @param {string[]} allowedRoles
 */
function authorize(allowedRoles = ['admin']) {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(
        res,
        'Unauthorized: Authentication required before authorization',
        HttpStatus.UNAUTHORIZED
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.error(
        res,
        `Forbidden: Insufficient privileges. Required role(s): [${allowedRoles.join(', ')}]`,
        HttpStatus.FORBIDDEN
      );
    }

    next();
  };
}

module.exports = {
  authenticate,
  optionalAuth,
  authorize
};
