const crypto = require('crypto');
const { query } = require('../config/db');
const reviewStore = require('./reviewStore');
const { seedProducts, seedReviews } = require('../data/seedProducts');

/**
 * Format a database row into a standardized Product domain object
 * @param {object} row
 * @returns {object|null}
 */
function mapProductRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: Number(row.price),
    category: row.category,
    inStock: Boolean(row.in_stock),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : new Date(row.updated_at).toISOString()
  };
}

class ProductStore {
  /**
   * Reset database tables to initial seed data (used for test isolation)
   */
  async reset() {
    await query('DELETE FROM reviews');
    await query('DELETE FROM products');

    for (const p of seedProducts) {
      await query(
        `INSERT INTO products (id, name, description, price, category, in_stock, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           price = EXCLUDED.price,
           category = EXCLUDED.category,
           in_stock = EXCLUDED.in_stock,
           updated_at = EXCLUDED.updated_at`,
        [p.id, p.name, p.description, p.price, p.category, p.inStock, p.createdAt, p.updatedAt]
      );
    }

    for (const r of seedReviews) {
      await query(
        `INSERT INTO reviews (id, product_id, rating, comment, author, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           product_id = EXCLUDED.product_id,
           rating = EXCLUDED.rating,
           comment = EXCLUDED.comment,
           author = EXCLUDED.author`,
        [r.id, r.productId, r.rating, r.comment, r.author, r.createdAt]
      );
    }
  }

  /**
   * Retrieve all products with optional filters, search, sorting, and pagination
   * Parameterized queries protect 100% against SQL injection
   * @param {object} options
   * @returns {Promise<{ data: Array, pagination: object }>}
   */
  async findAll(options = {}) {
    const {
      category,
      minPrice,
      maxPrice,
      inStock,
      search,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10
    } = options;

    const conditions = [];
    const params = [];

    // Filter by category
    if (category) {
      params.push(category.toLowerCase().trim());
      conditions.push(`LOWER(category) = $${params.length}`);
    }

    // Filter by minPrice
    if (minPrice !== undefined && minPrice !== null) {
      const min = Number(minPrice);
      if (!Number.isNaN(min)) {
        params.push(min);
        conditions.push(`price >= $${params.length}`);
      }
    }

    // Filter by maxPrice
    if (maxPrice !== undefined && maxPrice !== null) {
      const max = Number(maxPrice);
      if (!Number.isNaN(max)) {
        params.push(max);
        conditions.push(`price <= $${params.length}`);
      }
    }

    // Filter by inStock
    if (inStock !== undefined && inStock !== null) {
      const inStockBool = inStock === 'true' || inStock === true;
      params.push(inStockBool);
      conditions.push(`in_stock = $${params.length}`);
    }

    // Filter by search query (case-insensitive name and description match)
    if (search && typeof search === 'string' && search.trim() !== '') {
      params.push(`%${search.trim()}%`);
      const searchPlaceholder = `$${params.length}`;
      conditions.push(`(name ILIKE ${searchPlaceholder} OR (description IS NOT NULL AND description ILIKE ${searchPlaceholder}))`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matching items for pagination metadata
    const countSql = `SELECT COUNT(*) AS total FROM products ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].total, 10);

    // Sorting (whitelisted to prevent SQL injection in ORDER BY)
    const sortFieldMap = {
      price: 'price',
      name: 'name',
      createdAt: 'created_at',
      created_at: 'created_at',
      category: 'category'
    };
    const sortColumn = sortFieldMap[sortBy] || 'created_at';
    const isAsc = String(order).toLowerCase() === 'asc';
    const sortDirection = isAsc ? 'ASC' : 'DESC';

    // Pagination calculations
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const totalPages = Math.ceil(total / limitNum) || 1;
    const offset = (pageNum - 1) * limitNum;

    // Build SELECT query
    params.push(limitNum);
    const limitPlaceholder = `$${params.length}`;
    params.push(offset);
    const offsetPlaceholder = `$${params.length}`;

    const selectSql = `
      SELECT id, name, description, price, category, in_stock, created_at, updated_at
      FROM products
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}
    `;

    const result = await query(selectSql, params);

    return {
      data: result.rows.map(mapProductRow),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    };
  }

  /**
   * Find product by ID
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const sql = `
      SELECT id, name, description, price, category, in_stock, created_at, updated_at
      FROM products
      WHERE id = $1
    `;
    const result = await query(sql, [id]);
    return result.rows.length > 0 ? mapProductRow(result.rows[0]) : null;
  }

  /**
   * Find product by name (case-insensitive check for uniqueness)
   * @param {string} name
   * @param {string} [excludeId]
   * @returns {Promise<object|null>}
   */
  async findByName(name, excludeId = null) {
    let sql = `
      SELECT id, name, description, price, category, in_stock, created_at, updated_at
      FROM products
      WHERE LOWER(name) = LOWER($1)
    `;
    const params = [name.trim()];

    if (excludeId) {
      params.push(excludeId);
      sql += ` AND id != $${params.length}`;
    }

    const result = await query(sql, params);
    return result.rows.length > 0 ? mapProductRow(result.rows[0]) : null;
  }

  /**
   * Create a new product
   * @param {object} productData
   * @returns {Promise<object>}
   */
  async create(productData) {
    const id = productData.id || `prod_${crypto.randomBytes(6).toString('hex')}`;
    const name = productData.name.trim();
    const description = productData.description ? productData.description.trim() : '';
    const price = Number(productData.price);
    const category = productData.category.toLowerCase().trim();
    const inStock = productData.inStock !== undefined ? Boolean(productData.inStock) : true;

    const sql = `
      INSERT INTO products (id, name, description, price, category, in_stock, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, now(), now())
      RETURNING id, name, description, price, category, in_stock, created_at, updated_at
    `;
    const result = await query(sql, [id, name, description, price, category, inStock]);
    return mapProductRow(result.rows[0]);
  }

  /**
   * Update an existing product
   * @param {string} id
   * @param {object} updateData
   * @returns {Promise<object|null>}
   */
  async update(id, updateData) {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const name = updateData.name !== undefined ? updateData.name.trim() : existing.name;
    const description =
      updateData.description !== undefined
        ? updateData.description.trim()
        : existing.description;
    const price =
      updateData.price !== undefined
        ? Number(updateData.price)
        : existing.price;
    const category =
      updateData.category !== undefined
        ? updateData.category.toLowerCase().trim()
        : existing.category;
    const inStock =
      updateData.inStock !== undefined
        ? Boolean(updateData.inStock)
        : existing.inStock;

    const sql = `
      UPDATE products
      SET name = $1, description = $2, price = $3, category = $4, in_stock = $5, updated_at = now()
      WHERE id = $6
      RETURNING id, name, description, price, category, in_stock, created_at, updated_at
    `;
    const result = await query(sql, [name, description, price, category, inStock, id]);
    return result.rows.length > 0 ? mapProductRow(result.rows[0]) : null;
  }

  /**
   * Delete product by ID
   * Foreign key ON DELETE CASCADE automatically removes associated reviews in database
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const sql = 'DELETE FROM products WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rowCount > 0;
  }

  /**
   * Get reviews for a specific product
   * @param {string} productId
   * @returns {Promise<Array>}
   */
  async getReviewsByProductId(productId) {
    return reviewStore.findByProductId(productId);
  }

  /**
   * Add a review for a product
   * @param {string} productId
   * @param {object} reviewData
   * @returns {Promise<object>}
   */
  async addReview(productId, reviewData) {
    return reviewStore.create(productId, reviewData);
  }
}

// Export singleton instance
const productStore = new ProductStore();
module.exports = productStore;
