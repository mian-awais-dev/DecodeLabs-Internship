const { getClient, closePool } = require('../config/db');
const { runMigrations } = require('./migrate');
const { runSeed } = require('./seed');
const logger = require('../utils/logger');

/**
 * Reset database (for development and test isolation)
 * Drops all application tables, runs all migrations, and re-seeds.
 */
async function resetDatabase() {
  const client = await getClient();

  try {
    logger.warn('Resetting database: dropping existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS reviews CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS schema_migrations CASCADE;
    `);
    logger.info('Tables dropped successfully.');
  } finally {
    client.release();
  }

  // Re-run migrations
  await runMigrations();

  // Re-seed data
  await runSeed();

  logger.info('Database reset completed successfully.');
}

// Run directly if called as CLI script
if (require.main === module) {
  resetDatabase()
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
        logger.error('Reset execution failed:', err);
      }
      await closePool();
      process.exit(1);
    });
}

module.exports = { resetDatabase };
