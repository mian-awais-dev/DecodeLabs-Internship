const { Pool, types } = require('pg');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
require('dotenv').config();

// Ensure PostgreSQL NUMERIC (type 1700) is parsed as float in JS instead of string
types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'products_api_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_TIMEOUT_MS, 10) || 5000
};

let pool = null;
let isInMemoryFallback = false;

/**
 * Initialize in-memory PostgreSQL instance for tests or local testing without Postgres daemon
 */
function initInMemoryPool() {
  const { newDb, DataType } = require('pg-mem');
  const db = newDb();

  db.public.registerFunction({
    name: 'trim',
    args: [DataType.text],
    returns: DataType.text,
    implementation: (x) => (x ? x.trim() : '')
  });

  db.public.registerFunction({
    name: 'length',
    args: [DataType.text],
    returns: DataType.integer,
    implementation: (x) => (x ? x.length : 0)
  });

  const migrationsDir = path.resolve(__dirname, '../../migrations');
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql') && !f.includes('seed'))
    .sort();

  for (const file of migrationFiles) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    db.public.none(sql);
  }

  // Also apply seed data
  const seedFile = path.join(migrationsDir, '003_seed_data.sql');
  if (fs.existsSync(seedFile)) {
    db.public.none(fs.readFileSync(seedFile, 'utf8'));
  }

  const pg = db.adapters.createPg();
  const memPool = new pg.Pool();
  isInMemoryFallback = true;
  return memPool;
}

/**
 * Get active connection pool
 */
function getPool() {
  if (!pool) {
    const isTestMode =
      process.env.NODE_ENV === 'test' ||
      process.execArgv.includes('--test') ||
      process.argv.some((arg) => arg.includes('test'));

    const shouldUseMemory =
      process.env.USE_IN_MEMORY_DB === 'true' ||
      (isTestMode && process.env.USE_REAL_DB !== 'true');

    if (shouldUseMemory) {
      pool = initInMemoryPool();
    } else {
      pool = new Pool(dbConfig);
      pool.on('error', (err) => {
        logger.error('Unexpected error on idle PostgreSQL client:', {
          message: err.message,
          stack: err.stack
        });
      });
    }
  }
  return pool;
}

/**
 * Execute a parameterized SQL query
 * @param {string} text - SQL statement with parameter placeholders ($1, $2, etc.)
 * @param {Array} params - Array of parameter values
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params = []) {
  const start = Date.now();
  const activePool = getPool();
  try {
    const res = await activePool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.DEBUG_SQL === 'true') {
      logger.info('SQL query executed', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Database query error:', {
      text,
      params,
      duration,
      message: error.message,
      code: error.code
    });
    throw error;
  }
}

/**
 * Acquire a single client from the pool (e.g. for transactions)
 */
async function getClient() {
  const activePool = getPool();
  return activePool.connect();
}

/**
 * Test database connection on startup
 * Logs and exits if DB is unreachable in production/dev
 */
async function testConnection() {
  try {
    const activePool = getPool();
    const res = await activePool.query('SELECT 1 as connected');
    if (res && res.rows && res.rows.length > 0) {
      logger.info(
        `PostgreSQL connected successfully [${isInMemoryFallback ? 'in-memory-adapter' : `${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`}]`
      );
      return true;
    }
    return false;
  } catch (err) {
    logger.error(`Database connection failed: ${err.message}`, {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user
    });
    return false;
  }
}

/**
 * Close database pool gracefully
 */
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Allow explicitly switching or injecting the pool (useful for tests)
 */
function setPool(customPool) {
  pool = customPool;
}

module.exports = {
  query,
  getClient,
  getPool,
  setPool,
  testConnection,
  closePool,
  initInMemoryPool,
  dbConfig
};
