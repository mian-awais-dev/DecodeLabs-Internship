const rateLimit = require('express-rate-limit');
const config = require('../config/config');
const HttpStatus = require('../constants/httpStatusCodes');

const apiRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true, // Return standard RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  statusCode: HttpStatus.TOO_MANY_REQUESTS,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.'
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  }
});

module.exports = {
  apiRateLimiter
};
