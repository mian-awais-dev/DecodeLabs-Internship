const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

describe('System, Metadata & Error Handling', () => {
  it('should return 200 OK with health status on GET /health', async () => {
    const res = await request(app).get('/health');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'healthy');
    assert.ok(res.body.data.uptime >= 0);
    assert.ok(res.body.data.timestamp);
  });

  it('should return 200 OK with API documentation index on GET /', async () => {
    const res = await request(app).get('/');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.endpoints);
  });

  it('should return 200 OK with category list on GET /products/categories', async () => {
    const res = await request(app).get('/products/categories');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.includes('electronics'));
    assert.ok(res.body.data.includes('clothing'));
  });

  it('should return 404 Not Found in consistent JSON format for non-existent routes', async () => {
    const res = await request(app).get('/non-existent-api-route');

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error);
    assert.ok(res.body.error.includes('Endpoint does not exist'));
  });
});
