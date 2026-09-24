const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const productStore = require('../src/models/productStore');

const ADMIN_TOKEN = 'admin-token-secret-123';
const VIEWER_TOKEN = 'viewer-token-secret-456';
const ADMIN_API_KEY = 'api-key-admin';
const VIEWER_API_KEY = 'api-key-viewer';

describe('Security Layer - Authentication & Authorization', () => {
  beforeEach(() => {
    productStore.reset();
  });

  const validPayload = {
    name: 'Wireless Mechanical Keyboard',
    description: 'Hot-swappable switches with RGB backlight.',
    price: 119.99,
    category: 'electronics'
  };

  describe('Authentication (AuthN) - 401 Unauthorized', () => {
    it('should reject POST /products with 401 when no auth header is provided', async () => {
      const res = await request(app)
        .post('/products')
        .set('Content-Type', 'application/json')
        .send(validPayload);

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.ok(res.body.error.includes('Unauthorized'));
    });

    it('should reject POST /products with 401 when invalid Bearer token is provided', async () => {
      const res = await request(app)
        .post('/products')
        .set('Authorization', 'Bearer invalid-token-xyz')
        .set('Content-Type', 'application/json')
        .send(validPayload);

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    it('should reject DELETE /products/:id with 401 when no credentials are provided', async () => {
      const res = await request(app).delete('/products/prod_1001');

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });
  });

  describe('Authorization (AuthZ) - 403 Forbidden', () => {
    it('should reject POST /products with 403 when authenticated as viewer (insufficient permissions)', async () => {
      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${VIEWER_TOKEN}`)
        .set('Content-Type', 'application/json')
        .send(validPayload);

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
      assert.ok(res.body.error.includes('Forbidden'));
    });

    it('should reject PUT /products/:id with 403 when authenticated as viewer via x-api-key', async () => {
      const res = await request(app)
        .put('/products/prod_1001')
        .set('x-api-key', VIEWER_API_KEY)
        .set('Content-Type', 'application/json')
        .send(validPayload);

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
      assert.ok(res.body.error.includes('Forbidden'));
    });

    it('should reject DELETE /products/:id with 403 when authenticated as viewer', async () => {
      const res = await request(app)
        .delete('/products/prod_1001')
        .set('Authorization', `Bearer ${VIEWER_TOKEN}`);

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
    });
  });

  describe('Successful Authorization with Admin credentials', () => {
    it('should succeed with 201 Created when using admin Bearer token', async () => {
      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .set('Content-Type', 'application/json')
        .send(validPayload);

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
    });

    it('should succeed with 201 Created when using admin x-api-key header', async () => {
      const res = await request(app)
        .post('/products')
        .set('x-api-key', ADMIN_API_KEY)
        .set('Content-Type', 'application/json')
        .send({
          ...validPayload,
          name: 'Unique Mechanical Keyboard'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
    });
  });
});
