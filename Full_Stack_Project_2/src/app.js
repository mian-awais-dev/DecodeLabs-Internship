const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const notFoundHandler = require('./middlewares/notFoundHandler');
const { apiRateLimiter } = require('./middlewares/rateLimiter');

const app = express();

// Disable 'X-Powered-By: Express' header for security
app.disable('x-powered-by');

// Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false, // API only, no HTML pages served
    crossOriginEmbedderPolicy: false
  })
);

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    maxAge: 86400
  })
);

// Rate Limiting to prevent brute-force and DoS
app.use(apiRateLimiter);

// JSON body parser with strict size limit (Never trust client payload size)
app.use(
  express.json({
    limit: '1mb',
    strict: true
  })
);

// URL-encoded body parser
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Mount API routes (both at root level e.g. /products and /api/v1/products for versioning support)
app.use('/', routes);
app.use('/api/v1', routes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Centralized error-handling middleware (must be registered last)
app.use(errorHandler);

module.exports = app;
