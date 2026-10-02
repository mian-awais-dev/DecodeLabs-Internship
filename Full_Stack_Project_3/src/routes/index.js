const { Router } = require('express');
const productRoutes = require('./productRoutes');
const ApiResponse = require('../utils/apiResponse');
const HttpStatus = require('../constants/httpStatusCodes');

const router = Router();

/**
 * @route   GET /health
 * @desc    API Health and status check
 * @access  Public
 */
router.get('/health', (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    memoryUsage: process.memoryUsage()
  };

  return ApiResponse.success(res, healthData, HttpStatus.OK);
});

/**
 * @route   GET /
 * @desc    Root API information
 * @access  Public
 */
router.get('/', (req, res) => {
  const apiInfo = {
    name: 'Products REST API',
    version: '1.0.0',
    description: 'Robust backend API for Project 2: Backend API Development',
    documentation: 'See README.md for complete endpoint specifications',
    endpoints: {
      health: 'GET /health',
      categories: 'GET /products/categories',
      listProducts: 'GET /products',
      getProduct: 'GET /products/:id',
      createProduct: 'POST /products (Admin)',
      updateProduct: 'PUT /products/:id (Admin)',
      deleteProduct: 'DELETE /products/:id (Admin)',
      getReviews: 'GET /products/:id/reviews',
      createReview: 'POST /products/:id/reviews'
    }
  };

  return ApiResponse.success(res, apiInfo, HttpStatus.OK);
});

// Mount /products routes
router.use('/products', productRoutes);

module.exports = router;
