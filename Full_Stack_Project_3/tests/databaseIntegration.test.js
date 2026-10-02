const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const productStore = require('../src/models/productStore');
const reviewStore = require('../src/models/reviewStore');
const { query } = require('../src/config/db');

const ADMIN_TOKEN = 'admin-token-secret-123';

describe('Project 3: PostgreSQL Database Integration Tests', () => {
  beforeEach(async () => {
    await productStore.reset();
  });

  describe('1. Unique Constraint Enforcement (Postgres Error 23505 → 409 Conflict)', () => {
    it('should reject creating duplicate product in same category with 409 Conflict via API', async () => {
      const duplicatePayload = {
        name: 'Sony WH-1000XM5 Wireless Headphones',
        description: 'Duplicate electronics item',
        price: 299.99,
        category: 'electronics'
      };

      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .set('Content-Type', 'application/json')
        .send(duplicatePayload);

      assert.equal(res.status, 409);
      assert.equal(res.body.success, false);
      assert.ok(res.body.error.toLowerCase().includes('already exists'));
    });

    it('should trigger database unique constraint 23505 when inserting duplicate (name, category)', async () => {
      // Direct database insert to test schema constraint level
      let errorThrown = null;
      try {
        await query(
          'INSERT INTO products (id, name, description, price, category, in_stock) VALUES ($1, $2, $3, $4, $5, $6)',
          ['prod_dup_direct', 'Apple MacBook Air M3', 'Another MacBook', 899.0, 'electronics', true]
        );
      } catch (err) {
        errorThrown = err;
      }

      assert.ok(errorThrown, 'Expected database unique constraint violation to throw');
      assert.equal(errorThrown.code, '23505');
    });
  });

  describe('2. Cascade Delete Referential Integrity (ON DELETE CASCADE)', () => {
    it('should delete a product and automatically cascade-delete all its reviews', async () => {
      const targetProductId = 'prod_1001';

      // 1. Confirm product exists and has reviews
      const initialReviewsRes = await request(app).get(`/products/${targetProductId}/reviews`);
      assert.equal(initialReviewsRes.status, 200);
      assert.ok(initialReviewsRes.body.data.length >= 2, 'Should have initial reviews');

      // 2. Also check directly in DB
      const dbReviewsBefore = await query('SELECT count(*) FROM reviews WHERE product_id = $1', [targetProductId]);
      assert.ok(parseInt(dbReviewsBefore.rows[0].count, 10) >= 2);

      // 3. Delete the product via API
      const deleteRes = await request(app)
        .delete(`/products/${targetProductId}`)
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`);
      assert.equal(deleteRes.status, 204);

      // 4. Verify product no longer exists
      const getProdRes = await request(app).get(`/products/${targetProductId}`);
      assert.equal(getProdRes.status, 404);

      // 5. Verify reviews for this product were cascade-deleted from PostgreSQL reviews table
      const dbReviewsAfter = await query('SELECT count(*) FROM reviews WHERE product_id = $1', [targetProductId]);
      assert.equal(parseInt(dbReviewsAfter.rows[0].count, 10), 0, 'Reviews must be cascade-deleted');

      // 6. Verify reviews endpoint also returns 404
      const getReviewsRes = await request(app).get(`/products/${targetProductId}/reviews`);
      assert.equal(getReviewsRes.status, 404);
    });
  });

  describe('3. Foreign Key Constraint Enforcement (Postgres Error 23503 → 404/Error)', () => {
    it('should return 404 Not Found when attempting to post a review for non-existent product', async () => {
      const res = await request(app)
        .post('/products/prod_non_existent/reviews')
        .set('Content-Type', 'application/json')
        .send({
          rating: 5,
          comment: 'Outstanding quality and design',
          author: 'TestUser'
        });

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.ok(res.body.error.toLowerCase().includes('not found'));
    });

    it('should reject reviewStore.create with non-existent product_id via database foreign key', async () => {
      let errorThrown = null;
      try {
        await query(
          'INSERT INTO reviews (id, product_id, rating, comment, author) VALUES ($1, $2, $3, $4, $5)',
          ['rev_orphan', 'non_existent_product_id', 4, 'Test review for missing product', 'Tester']
        );
      } catch (err) {
        errorThrown = err;
      }

      assert.ok(errorThrown, 'Database should reject orphan review with foreign key violation');
      assert.ok(
        errorThrown.code === '23503' ||
          (errorThrown.message && errorThrown.message.toLowerCase().includes('foreign key'))
      );
    });
  });

  describe('4. SQL Injection Protection via Parameterized Queries', () => {
    it('should safely handle SQL injection payload in search query without leaking rows or erroring', async () => {
      // Classic SQL injection payloads
      const payloads = [
        "' OR 1=1 --",
        "'; DROP TABLE products; --",
        "electronics' UNION SELECT NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL --"
      ];

      for (const payload of payloads) {
        const res = await request(app).get(`/products?search=${encodeURIComponent(payload)}`);

        assert.equal(res.status, 200, `Payload '${payload}' should return 200 OK`);
        assert.equal(res.body.success, true);
        assert.ok(Array.isArray(res.body.data));
        // Parameterized query treats it as literal string substring, matching zero rows
        assert.equal(res.body.data.length, 0, `Payload '${payload}' must return 0 matching products`);
      }

      // Verify products table was not dropped
      const countRes = await query('SELECT count(*) FROM products');
      assert.ok(parseInt(countRes.rows[0].count, 10) > 0, 'Products table must remain intact');
    });

    it('should treat malicious category strings as literal parameter values in productStore.findAll', async () => {
      const maliciousCategory = "' OR 1=1 --";
      const result = await productStore.findAll({ category: maliciousCategory });

      assert.ok(Array.isArray(result.data));
      assert.equal(result.data.length, 0, 'Should not match any products with literal injection string');
      assert.equal(result.pagination.total, 0);
    });
  });
});
