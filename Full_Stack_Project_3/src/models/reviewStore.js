const crypto = require('crypto');
const { query } = require('../config/db');

/**
 * Format a database row into a standardized Review domain object
 * @param {object} row
 * @returns {object|null}
 */
function mapReviewRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    productId: row.product_id,
    rating: Number(row.rating),
    author: row.author || 'Anonymous',
    comment: row.comment,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString()
  };
}

class ReviewStore {
  /**
   * Find all reviews for a specific product
   * @param {string} productId
   * @returns {Promise<Array>}
   */
  async findByProductId(productId) {
    const sql = `
      SELECT id, product_id, rating, comment, author, created_at
      FROM reviews
      WHERE product_id = $1
      ORDER BY created_at ASC
    `;
    const result = await query(sql, [productId]);
    return result.rows.map(mapReviewRow);
  }

  /**
   * Find a single review by ID
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const sql = `
      SELECT id, product_id, rating, comment, author, created_at
      FROM reviews
      WHERE id = $1
    `;
    const result = await query(sql, [id]);
    return result.rows.length > 0 ? mapReviewRow(result.rows[0]) : null;
  }

  /**
   * Create a new review for a product
   * @param {string} productId
   * @param {object} reviewData
   * @returns {Promise<object>}
   */
  async create(productId, reviewData) {
    const id = reviewData.id || `rev_${crypto.randomBytes(6).toString('hex')}`;
    const rating = Number(reviewData.rating);
    const author = reviewData.author ? reviewData.author.trim() : 'Anonymous';
    const comment = reviewData.comment ? reviewData.comment.trim() : '';

    const sql = `
      INSERT INTO reviews (id, product_id, rating, comment, author, created_at)
      VALUES ($1, $2, $3, $4, $5, now())
      RETURNING id, product_id, rating, comment, author, created_at
    `;
    const result = await query(sql, [id, productId, rating, comment, author]);
    return mapReviewRow(result.rows[0]);
  }

  /**
   * Delete review by ID
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const sql = 'DELETE FROM reviews WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rowCount > 0;
  }

  /**
   * Delete all reviews for a product (Postgres FK cascade also handles this)
   * @param {string} productId
   * @returns {Promise<number>}
   */
  async deleteByProductId(productId) {
    const sql = 'DELETE FROM reviews WHERE product_id = $1';
    const result = await query(sql, [productId]);
    return result.rowCount;
  }
}

const reviewStore = new ReviewStore();
module.exports = reviewStore;
