const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const productStore = require('../src/models/productStore');

const ADMIN_TOKEN = 'admin-token-secret-123';

describe('Products API - CRUD Operations & Querying', () => {
  beforeEach(() => {
    productStore.reset();
  });

  describe('GET /products', () => {
    it('should return all products with 200 OK and pagination metadata', async () => {
      const res = await request(app).get('/products');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.pagination);
      assert.equal(res.body.pagination.page, 1);
      assert.ok(res.body.data.length > 0);
    });

    it('should filter products by category', async () => {
      const res = await request(app).get('/products?category=electronics');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.length > 0);
      for (const prod of res.body.data) {
        assert.equal(prod.category, 'electronics');
      }
    });

    it('should filter products by minPrice and maxPrice range', async () => {
      const min = 50;
      const max = 300;
      const res = await request(app).get(`/products?minPrice=${min}&maxPrice=${max}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      for (const prod of res.body.data) {
        assert.ok(prod.price >= min && prod.price <= max);
      }
    });

    it('should filter products by inStock status', async () => {
      const res = await request(app).get('/products?inStock=false');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      for (const prod of res.body.data) {
        assert.equal(prod.inStock, false);
      }
    });

    it('should search products by text query matching name or description', async () => {
      const res = await request(app).get('/products?search=MacBook');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.length >= 1);
      assert.ok(res.body.data[0].name.toLowerCase().includes('macbook'));
    });

    it('should paginate results with page and limit parameters', async () => {
      const res = await request(app).get('/products?page=1&limit=2');

      assert.equal(res.status, 200);
      assert.equal(res.body.data.length, 2);
      assert.equal(res.body.pagination.page, 1);
      assert.equal(res.body.pagination.limit, 2);
    });

    it('should sort products by price ascending', async () => {
      const res = await request(app).get('/products?sortBy=price&order=asc');

      assert.equal(res.status, 200);
      const prices = res.body.data.map((p) => p.price);
      for (let i = 0; i < prices.length - 1; i++) {
        assert.ok(prices[i] <= prices[i + 1]);
      }
    });
  });

  describe('GET /products/:id', () => {
    it('should return a single product with 200 OK when found', async () => {
      const res = await request(app).get('/products/prod_1001');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.id, 'prod_1001');
      assert.equal(res.body.data.name, 'Sony WH-1000XM5 Wireless Headphones');
    });

    it('should return 404 Not Found when product ID does not exist', async () => {
      const res = await request(app).get('/products/prod_non_existent');

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.ok(res.body.error.includes('not found'));
    });
  });

  describe('POST /products', () => {
    it('should create a new product with 201 Created when authenticated as admin', async () => {
      const newProductPayload = {
        name: 'Logitech MX Master 3S Mouse',
        description: 'Quiet clicks and 8K DPI any-surface tracking.',
        price: 99.99,
        category: 'electronics',
        inStock: true
      };

      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .set('Content-Type', 'application/json')
        .send(newProductPayload);

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.id);
      assert.equal(res.body.data.name, newProductPayload.name);
      assert.equal(res.body.data.price, newProductPayload.price);
      assert.equal(res.body.data.category, newProductPayload.category);
      assert.ok(res.body.data.createdAt);
      assert.ok(res.body.data.updatedAt);
    });

    it('should return 409 Conflict if duplicate product is created in same category', async () => {
      const duplicatePayload = {
        name: 'Sony WH-1000XM5 Wireless Headphones',
        description: 'Duplicate product',
        price: 350.00,
        category: 'electronics'
      };

      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .set('Content-Type', 'application/json')
        .send(duplicatePayload);

      assert.equal(res.status, 409);
      assert.equal(res.body.success, false);
      assert.ok(res.body.error.includes('already exists'));
    });
  });

  describe('PUT /products/:id', () => {
    it('should update an existing product with 200 OK when authenticated as admin', async () => {
      const updatePayload = {
        name: 'Sony WH-1000XM5 Wireless Headphones (Silver)',
        description: 'Updated edition with silver finish.',
        price: 349.99,
        category: 'electronics',
        inStock: false
      };

      const res = await request(app)
        .put('/products/prod_1001')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .set('Content-Type', 'application/json')
        .send(updatePayload);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.id, 'prod_1001');
      assert.equal(res.body.data.name, updatePayload.name);
      assert.equal(res.body.data.price, updatePayload.price);
      assert.equal(res.body.data.inStock, false);
    });

    it('should return 404 Not Found when updating non-existent product', async () => {
      const updatePayload = {
        name: 'Non-existent item',
        price: 199.99,
        category: 'electronics'
      };

      const res = await request(app)
        .put('/products/prod_non_existent')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .set('Content-Type', 'application/json')
        .send(updatePayload);

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
    });
  });

  describe('DELETE /products/:id', () => {
    it('should delete an existing product with 204 No Content when authenticated as admin', async () => {
      const res = await request(app)
        .delete('/products/prod_1001')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

      assert.equal(res.status, 204);
      assert.equal(res.text, '');

      // Verify it is gone
      const verifyRes = await request(app).get('/products/prod_1001');
      assert.equal(verifyRes.status, 404);
    });

    it('should return 404 Not Found when deleting non-existent product', async () => {
      const res = await request(app)
        .delete('/products/prod_non_existent')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
    });
  });
});
