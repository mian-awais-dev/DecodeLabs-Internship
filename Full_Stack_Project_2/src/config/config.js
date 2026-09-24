require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100
  },
  auth: {
    tokens: {
      [process.env.ADMIN_TOKEN || 'admin-token-secret-123']: { role: 'admin', user: 'Admin User' },
      [process.env.VIEWER_TOKEN || 'viewer-token-secret-456']: { role: 'viewer', user: 'Viewer User' }
    },
    apiKeys: {
      [process.env.ADMIN_API_KEY || 'api-key-admin']: { role: 'admin', user: 'Admin User' },
      [process.env.VIEWER_API_KEY || 'api-key-viewer']: { role: 'viewer', user: 'Viewer User' }
    }
  }
};

module.exports = config;
