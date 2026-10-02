const fs = require('fs');
const path = require('path');
const { getClient, closePool } = require('../config/db');
const logger = require('../utils/logger');

/**
 * Migration runner
 * Discovers and applies all migration SQL files in alphabetical order
 */
async function runMigrations() {
  const migrationsDir = path.resolve(__dirname, '../../migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql') && !file.includes('seed'))
    .sort();

  logger.info(`Found ${files.length} migration files in ${migrationsDir}`);

  const client = await getClient();

  try {
    // Create migrations tracker table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // Fetch already applied migrations
    const appliedRes = await client.query('SELECT filename FROM schema_migrations');
    const appliedSet = new Set(appliedRes.rows.map((r) => r.filename));

    for (const file of files) {
      if (appliedSet.has(file)) {
        logger.info(`Migration already applied: ${file} (skipping)`);
        continue;
      }

      logger.info(`Applying migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        logger.info(`Successfully applied migration: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        logger.error(`Failed to apply migration ${file}:`, { message: err.message, stack: err.stack });
        throw err;
      }
    }

    logger.info('All migrations completed successfully.');
  } finally {
    client.release();
  }
}

// Run directly if called as CLI script
if (require.main === module) {
  runMigrations()
    .then(async () => {
      await closePool();
      process.exit(0);
    })
    .catch(async (err) => {
      if (err.code === 'ECONNREFUSED' || (err.message && err.message.includes('ECONNREFUSED'))) {
        logger.error(
          `Could not connect to PostgreSQL at ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}. Please ensure PostgreSQL is installed and running.`
        );
      } else {
        logger.error('Migration execution failed:', err);
      }
      await closePool();
      process.exit(1);
    });
}

module.exports = { runMigrations };
