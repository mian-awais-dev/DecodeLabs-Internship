const { Router } = require('express');
const ProductController = require('../controllers/productController');
const ReviewController = require('../controllers/reviewController');
const { authenticate, authorize } = require('../middlewares/auth');
const {
  validateContentType,
  validateCreateProduct,
  validateUpdateProduct,
  validateProductQuery,
  validateProductIdParam,
  validateCreateReview
} = require('../middlewares/validation');

const router = Router();

/**
 * @route   GET /products/categories
 * @desc    Retrieve allowed product categories
 * @access  Public
 */
router.get('/categories', ProductController.getCategories);

/**
 * @route   GET /products
 * @desc    Retrieve all products with query filtering, sorting & pagination
 * @access  Public
 */
router.get('/', validateProductQuery, ProductController.getAll);

/**
 * @route   POST /products
 * @desc    Create a new product
 * @access  Protected (Admin only)
 */
router.post(
  '/',
  authenticate,
  authorize(['admin']),
  validateContentType,
  validateCreateProduct,
  ProductController.create
);

/**
 * @route   GET /products/:id
 * @desc    Retrieve single product by ID
 * @access  Public
 */
router.get('/:id', validateProductIdParam, ProductController.getById);

/**
 * @route   PUT /products/:id
 * @desc    Update/replace existing product
 * @access  Protected (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize(['admin']),
  validateProductIdParam,
  validateContentType,
  validateUpdateProduct,
  ProductController.update
);

/**
 * @route   DELETE /products/:id
 * @desc    Remove product by ID
 * @access  Protected (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  validateProductIdParam,
  ProductController.remove
);

/**
 * Nested Resources: Reviews
 * @route   GET /products/:id/reviews
 * @desc    Get all reviews for a product
 * @access  Public
 */
router.get(
  '/:id/reviews',
  validateProductIdParam,
  ReviewController.getReviews
);

/**
 * @route   POST /products/:id/reviews
 * @desc    Create a new review for a product
 * @access  Public (or authenticated)
 */
router.post(
  '/:id/reviews',
  validateProductIdParam,
  validateContentType,
  validateCreateReview,
  ReviewController.createReview
);

module.exports = router;
