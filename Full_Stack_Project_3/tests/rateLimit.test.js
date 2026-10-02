const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const express = require('express');
const rateLimit = require('express-rate-limit');
const HttpStatus = require('../src/constants/httpStatusCodes');

describe('Security & Resilience - Rate Limiter (429 Too Many Requests)', () => {
  it('should return 429 Too Many Requests when rate limit threshold is exceeded', async () => {
    // Create dedicated app instance with strict limit of 2 requests for testing
    const testApp = express();
    const testLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: 2,
      standardHeaders: true,
      legacyHeaders: false,
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      message: {
        success: false,
        error: 'Too many requests. Please try again later.'
      },
      handler: (req, res, next, options) => {
        res.status(options.statusCode).json(options.message);
      }
    });

    testApp.use(testLimiter);
    testApp.get('/test-limit', (req, res) => res.json({ success: true, message: 'ok' }));

    // Request 1: OK
    const res1 = await request(testApp).get('/test-limit');
    assert.equal(res1.status, 200);

    // Request 2: OK
    const res2 = await request(testApp).get('/test-limit');
    assert.equal(res2.status, 200);

    // Request 3: 429 Too Many Requests
    const res3 = await request(testApp).get('/test-limit');
    assert.equal(res3.status, 429);
    assert.equal(res3.body.success, false);
    assert.equal(res3.body.error, 'Too many requests. Please try again later.');
    assert.ok(res3.headers['ratelimit-limit']);
  });
});
