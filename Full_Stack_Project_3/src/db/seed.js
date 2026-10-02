const fs = require('fs');
const path = require('path');
const { getClient, closePool } = require('../config/db');
const logger = require('../utils/logger');

/**
 * Seed database with sample products and reviews
 */
async function runSeed() {
  const seedFile = path.resolve(__dirname, '../../migrations/seed.sql');
  if (!fs.existsSync(seedFile)) {
    throw new Error(`Seed file not found at ${seedFile}`);
  }

  const sql = fs.readFileSync(seedFile, 'utf8');
  const client = await getClient();

  try {
    logger.info('Starting database seed...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    const prodCountRes = await client.query('SELECT count(*) FROM products');
    const revCountRes = await client.query('SELECT count(*) FROM reviews');

    logger.info('Database seeded successfully!', {
      totalProducts: parseInt(prodCountRes.rows[0].count, 10),
      totalReviews: parseInt(revCountRes.rows[0].count, 10)
    });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Failed to seed database:', { message: err.message, stack: err.stack });
    throw err;
  } finally {
    client.release();
  }
}

// Run directly if called as CLI script
if (require.main === module) {
  runSeed()
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
        logger.error('Seed execution failed:', err);
      }
      await closePool();
      process.exit(1);
    });
}

module.exports = { runSeed };
