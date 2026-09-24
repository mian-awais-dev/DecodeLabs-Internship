const productStore = require('../models/productStore');
const { ALLOWED_CATEGORIES } = require('../constants/categories');
const HttpStatus = require('../constants/httpStatusCodes');
const ApiResponse = require('../utils/apiResponse');
const { NotFoundError, ConflictError } = require('../utils/apiError');

/**
 * Controller handling Product CRUD and querying
 */
class ProductController {
  /**
   * GET /products
   * Retrieve all products with optional filters, search, and pagination
   * Safe & Idempotent
   */
  static async getAll(req, res, next) {
    try {
      const {
        category,
        minPrice,
        maxPrice,
        inStock,
        search,
        sortBy,
        order,
        page,
        limit
      } = req.query;

      const result = productStore.findAll({
        category,
        minPrice,
        maxPrice,
        inStock,
        search,
        sortBy,
        order,
        page,
        limit
      });

      return ApiResponse.success(res, result.data, HttpStatus.OK, {
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /products/categories
   * Retrieve list of supported product categories
   * Safe & Idempotent
   */
  static async getCategories(req, res, next) {
    try {
      return ApiResponse.success(res, ALLOWED_CATEGORIES, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /products/:id
   * Retrieve a single product by ID
   * Safe & Idempotent
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const product = productStore.findById(id);

      if (!product) {
        throw new NotFoundError(`Product with ID '${id}' not found`);
      }

      return ApiResponse.success(res, product, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /products
   * Create a new product
   * Unsafe & Non-idempotent
   * Requires AuthN & AuthZ (Admin)
   */
  static async create(req, res, next) {
    try {
      const { name, description, price, category, inStock } = req.body;

      // Semantic check: prevent duplicate product with exact same name in the same category
      const existing = productStore.findByName(name);
      if (existing && existing.category.toLowerCase() === category.toLowerCase().trim()) {
        throw new ConflictError(
          `A product named '${name}' already exists in category '${category}'`
        );
      }

      const newProduct = productStore.create({
        name,
        description,
        price,
        category,
        inStock
      });

      return ApiResponse.success(res, newProduct, HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /products/:id
   * Update or replace an existing product
   * Idempotent
   * Requires AuthN & AuthZ (Admin)
   */
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const existing = productStore.findById(id);

      if (!existing) {
        throw new NotFoundError(`Product with ID '${id}' not found`);
      }

      const { name, description, price, category, inStock } = req.body;

      // Check name uniqueness if name is changed
      if (name) {
        const duplicate = productStore.findByName(name, id);
        if (duplicate && duplicate.category.toLowerCase() === (category || existing.category).toLowerCase().trim()) {
          throw new ConflictError(
            `Another product named '${name}' already exists in category '${category || existing.category}'`
          );
        }
      }

      const updatedProduct = productStore.update(id, {
        name,
        description,
        price,
        category,
        inStock
      });

      return ApiResponse.success(res, updatedProduct, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /products/:id
   * Remove a product by ID
   * Idempotent
   * Requires AuthN & AuthZ (Admin)
   */
  static async remove(req, res, next) {
    try {
      const { id } = req.params;
      const existing = productStore.findById(id);

      if (!existing) {
        throw new NotFoundError(`Product with ID '${id}' not found`);
      }

      productStore.delete(id);
      return ApiResponse.noContent(res);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProductController;
