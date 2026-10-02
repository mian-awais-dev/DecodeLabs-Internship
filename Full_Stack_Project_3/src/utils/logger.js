const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const logger = {
  info: (msg, meta = {}) => {
    if (!isTest) {
      console.log(`[INFO] [${new Date().toISOString()}] ${msg}`, Object.keys(meta).length ? meta : '');
    }
  },
  warn: (msg, meta = {}) => {
    if (!isTest) {
      console.warn(`[WARN] [${new Date().toISOString()}] ${msg}`, Object.keys(meta).length ? meta : '');
    }
  },
  error: (msg, meta = {}) => {
    if (!isTest) {
      console.error(`[ERROR] [${new Date().toISOString()}] ${msg}`, Object.keys(meta).length ? meta : '');
    }
  },
  debug: (msg, meta = {}) => {
    if (!isProduction && !isTest) {
      console.debug(`[DEBUG] [${new Date().toISOString()}] ${msg}`, Object.keys(meta).length ? meta : '');
    }
  }
};

module.exports = logger;
