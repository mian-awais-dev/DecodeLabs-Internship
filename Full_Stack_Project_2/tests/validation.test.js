const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

const ADMIN_TOKEN = 'admin-token-secret-123';

describe('Validation Layer ("Never Trust the Client")', () => {
  describe('Syntactic Validation', () => {
    it('should reject request when Content-Type is not application/json on POST', async () => {
      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .set('Content-Type', 'text/plain')
        .send('plain text payload');

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.error.includes('Content-Type'));
    });

    it('should reject malformed JSON payload with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .set('Content-Type', 'application/json')
        .send('{"name": "Broken JSON", "price": 100,');

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.error.includes('Malformed JSON'));
    });

    it('should reject request missing required fields (name, price, category)', async () => {
      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .set('Content-Type', 'application/json')
        .send({});

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(Array.isArray(res.body.details));
      const fields = res.body.details.map((d) => d.field);
      assert.ok(fields.includes('name'));
      assert.ok(fields.includes('price'));
      assert.ok(fields.includes('category'));
    });

    it('should reject incorrect data types (price as string)', async () => {
      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .set('Content-Type', 'application/json')
        .send({
          name: 'USB Cable',
          price: 'ten dollars',
          category: 'electronics'
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.details.some((d) => d.field === 'price'));
    });

    it('should reject non-boolean inStock field', async () => {
      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .set('Content-Type', 'application/json')
        .send({
          name: 'Gaming Mouse',
          price: 59.99,
          category: 'electronics',
          inStock: 'yes'
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.details.some((d) => d.field === 'inStock'));
    });
  });

  describe('Semantic Validation', () => {
    it('should reject non-positive price (zero or negative)', async () => {
      const resZero = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .set('Content-Type', 'application/json')
        .send({
          name: 'Free Sample',
          price: 0,
          category: 'beauty'
        });

      assert.equal(resZero.status, 400);
      assert.equal(resZero.body.success, false);
      assert.ok(resZero.body.details.some((d) => d.field === 'price'));

      const resNegative = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .set('Content-Type', 'application/json')
        .send({
          name: 'Negative Price',
          price: -25.5,
          category: 'beauty'
        });

      assert.equal(resNegative.status, 400);
      assert.equal(resNegative.body.success, false);
    });

    it('should reject category outside the allowed whitelist', async () => {
      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .set('Content-Type', 'application/json')
        .send({
          name: 'Unobtainium Stone',
          price: 999.99,
          category: 'space-minerals'
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.details.some((d) => d.field === 'category'));
    });

    it('should reject name with length less than 2 characters or only whitespace', async () => {
      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .set('Content-Type', 'application/json')
        .send({
          name: '   ',
          price: 19.99,
          category: 'books'
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.details.some((d) => d.field === 'name'));
    });

    it('should reject query parameter minPrice > maxPrice', async () => {
      const res = await request(app).get('/products?minPrice=500&maxPrice=100');

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.details.some((d) => d.field === 'minPrice'));
    });

    it('should reject invalid category filter in query', async () => {
      const res = await request(app).get('/products?category=unsupported-cat');

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.details.some((d) => d.field === 'category'));
    });
  });
});
