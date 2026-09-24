const productStore = require('../models/productStore');
const HttpStatus = require('../constants/httpStatusCodes');
const ApiResponse = require('../utils/apiResponse');
const { NotFoundError } = require('../utils/apiError');

/**
 * Controller handling nested reviews for products
 * E.g., GET /products/:id/reviews, POST /products/:id/reviews
 */
class ReviewController {
  /**
   * GET /products/:id/reviews
   * Retrieve all reviews for a specific product
   * Safe & Idempotent
   */
  static async getReviews(req, res, next) {
    try {
      const { id } = req.params;
      const product = productStore.findById(id);

      if (!product) {
        throw new NotFoundError(`Product with ID '${id}' not found`);
      }

      const reviews = productStore.getReviewsByProductId(id);
      return ApiResponse.success(res, reviews, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /products/:id/reviews
   * Add a review for a specific product
   * Unsafe & Non-idempotent
   */
  static async createReview(req, res, next) {
    try {
      const { id } = req.params;
      const product = productStore.findById(id);

      if (!product) {
        throw new NotFoundError(`Product with ID '${id}' not found`);
      }

      const { rating, comment, author } = req.body;
      const review = productStore.addReview(id, { rating, comment, author });

      return ApiResponse.success(res, review, HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ReviewController;
