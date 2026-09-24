const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const productStore = require('../src/models/productStore');

describe('Nested Resource - Product Reviews', () => {
  beforeEach(() => {
    productStore.reset();
  });

  describe('GET /products/:id/reviews', () => {
    it('should retrieve existing reviews for a product with 200 OK', async () => {
      const res = await request(app).get('/products/prod_1001/reviews');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.length >= 2);
      for (const rev of res.body.data) {
        assert.equal(rev.productId, 'prod_1001');
      }
    });

    it('should return 404 Not Found when product ID does not exist', async () => {
      const res = await request(app).get('/products/prod_non_existent/reviews');

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.ok(res.body.error.includes('not found'));
    });
  });

  describe('POST /products/:id/reviews', () => {
    it('should create a new review with 201 Created', async () => {
      const reviewPayload = {
        rating: 5,
        comment: 'Absolutely sensational sound stage and clarity!',
        author: 'AudiophileTester'
      };

      const res = await request(app)
        .post('/products/prod_1001/reviews')
        .set('Content-Type', 'application/json')
        .send(reviewPayload);

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.id);
      assert.equal(res.body.data.productId, 'prod_1001');
      assert.equal(res.body.data.rating, 5);
      assert.equal(res.body.data.author, 'AudiophileTester');
      assert.ok(res.body.data.createdAt);
    });

    it('should reject invalid rating (e.g. rating = 6) with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/products/prod_1001/reviews')
        .set('Content-Type', 'application/json')
        .send({
          rating: 6,
          comment: 'Invalid rating test'
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.details.some((d) => d.field === 'rating'));
    });

    it('should return 404 Not Found when posting review for non-existent product', async () => {
      const res = await request(app)
        .post('/products/prod_non_existent/reviews')
        .set('Content-Type', 'application/json')
        .send({
          rating: 4,
          comment: 'Nice product'
        });

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
    });
  });
});
