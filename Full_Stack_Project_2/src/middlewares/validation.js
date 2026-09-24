const { ALLOWED_CATEGORIES } = require('../constants/categories');
const HttpStatus = require('../constants/httpStatusCodes');
const ApiResponse = require('../utils/apiResponse');

/**
 * Validates Content-Type header for requests that carry JSON payloads
 */
function validateContentType(req, res, next) {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return ApiResponse.error(
        res,
        'Invalid Content-Type header. Expected application/json',
        HttpStatus.BAD_REQUEST
      );
    }
  }
  next();
}

/**
 * Validate Product creation payload (Syntactic & Semantic)
 * Used by POST /products
 */
function validateCreateProduct(req, res, next) {
  const errors = [];
  const body = req.body;

  // Syntactic Layer 1: Body structure check
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return ApiResponse.error(
      res,
      'Invalid request payload. Request body must be a JSON object',
      HttpStatus.BAD_REQUEST
    );
  }

  // --- NAME VALIDATION ---
  // Syntactic: Required and string type
  if (body.name === undefined || body.name === null) {
    errors.push({ field: 'name', message: 'Name is required' });
  } else if (typeof body.name !== 'string') {
    errors.push({ field: 'name', message: 'Name must be a string' });
  } else {
    // Semantic: Length and content
    const trimmedName = body.name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      errors.push({
        field: 'name',
        message: 'Name must be between 2 and 100 characters in length'
      });
    }
  }

  // --- PRICE VALIDATION ---
  // Syntactic: Required and number type
  if (body.price === undefined || body.price === null) {
    errors.push({ field: 'price', message: 'Price is required' });
  } else if (typeof body.price !== 'number' || Number.isNaN(body.price)) {
    errors.push({ field: 'price', message: 'Price must be a valid number' });
  } else {
    // Semantic: Positive, finite, within reasonable business limits
    if (!Number.isFinite(body.price) || body.price <= 0) {
      errors.push({
        field: 'price',
        message: 'Price must be a positive number greater than 0'
      });
    } else if (body.price > 10000000) {
      errors.push({
        field: 'price',
        message: 'Price exceeds maximum allowable limit of 10,000,000'
      });
    }
  }

  // --- CATEGORY VALIDATION ---
  // Syntactic: Required and string type
  if (body.category === undefined || body.category === null) {
    errors.push({ field: 'category', message: 'Category is required' });
  } else if (typeof body.category !== 'string') {
    errors.push({ field: 'category', message: 'Category must be a string' });
  } else {
    // Semantic: Must match allowed category list
    const normalizedCategory = body.category.toLowerCase().trim();
    if (!ALLOWED_CATEGORIES.includes(normalizedCategory)) {
      errors.push({
        field: 'category',
        message: `Invalid category '${body.category}'. Allowed categories: ${ALLOWED_CATEGORIES.join(', ')}`
      });
    }
  }

  // --- DESCRIPTION VALIDATION (Optional) ---
  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string') {
      errors.push({ field: 'description', message: 'Description must be a string' });
    } else if (body.description.length > 500) {
      errors.push({
        field: 'description',
        message: 'Description must not exceed 500 characters'
      });
    }
  }

  // --- IN STOCK VALIDATION (Optional, default true) ---
  if (body.inStock !== undefined && body.inStock !== null) {
    if (typeof body.inStock !== 'boolean') {
      errors.push({ field: 'inStock', message: 'inStock must be a boolean (true or false)' });
    }
  }

  if (errors.length > 0) {
    return ApiResponse.error(res, 'Validation failed: Invalid product data', HttpStatus.BAD_REQUEST, errors);
  }

  next();
}

/**
 * Validate Product update payload (Syntactic & Semantic)
 * Used by PUT /products/:id
 */
function validateUpdateProduct(req, res, next) {
  const errors = [];
  const body = req.body;

  // Syntactic Layer 1: Body structure check
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return ApiResponse.error(
      res,
      'Invalid request payload. Request body must be a JSON object',
      HttpStatus.BAD_REQUEST
    );
  }

  // For PUT (full replacement/update), required fields must be supplied
  if (body.name === undefined || body.name === null) {
    errors.push({ field: 'name', message: 'Name is required' });
  } else if (typeof body.name !== 'string') {
    errors.push({ field: 'name', message: 'Name must be a string' });
  } else {
    const trimmedName = body.name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      errors.push({
        field: 'name',
        message: 'Name must be between 2 and 100 characters in length'
      });
    }
  }

  if (body.price === undefined || body.price === null) {
    errors.push({ field: 'price', message: 'Price is required' });
  } else if (typeof body.price !== 'number' || Number.isNaN(body.price)) {
    errors.push({ field: 'price', message: 'Price must be a valid number' });
  } else {
    if (!Number.isFinite(body.price) || body.price <= 0) {
      errors.push({
        field: 'price',
        message: 'Price must be a positive number greater than 0'
      });
    } else if (body.price > 10000000) {
      errors.push({
        field: 'price',
        message: 'Price exceeds maximum allowable limit of 10,000,000'
      });
    }
  }

  if (body.category === undefined || body.category === null) {
    errors.push({ field: 'category', message: 'Category is required' });
  } else if (typeof body.category !== 'string') {
    errors.push({ field: 'category', message: 'Category must be a string' });
  } else {
    const normalizedCategory = body.category.toLowerCase().trim();
    if (!ALLOWED_CATEGORIES.includes(normalizedCategory)) {
      errors.push({
        field: 'category',
        message: `Invalid category '${body.category}'. Allowed categories: ${ALLOWED_CATEGORIES.join(', ')}`
      });
    }
  }

  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string') {
      errors.push({ field: 'description', message: 'Description must be a string' });
    } else if (body.description.length > 500) {
      errors.push({
        field: 'description',
        message: 'Description must not exceed 500 characters'
      });
    }
  }

  if (body.inStock !== undefined && body.inStock !== null) {
    if (typeof body.inStock !== 'boolean') {
      errors.push({ field: 'inStock', message: 'inStock must be a boolean (true or false)' });
    }
  }

  if (errors.length > 0) {
    return ApiResponse.error(res, 'Validation failed: Invalid product data', HttpStatus.BAD_REQUEST, errors);
  }

  next();
}

/**
 * Validate Query parameters for GET /products
 */
function validateProductQuery(req, res, next) {
  const errors = [];
  const { minPrice, maxPrice, category, inStock, page, limit, sortBy, order } = req.query;

  let minVal;
  let maxVal;

  if (minPrice !== undefined) {
    minVal = Number(minPrice);
    if (Number.isNaN(minVal) || minVal < 0) {
      errors.push({ field: 'minPrice', message: 'minPrice must be a positive number or zero' });
    }
  }

  if (maxPrice !== undefined) {
    maxVal = Number(maxPrice);
    if (Number.isNaN(maxVal) || maxVal < 0) {
      errors.push({ field: 'maxPrice', message: 'maxPrice must be a positive number or zero' });
    }
  }

  if (minVal !== undefined && maxVal !== undefined && !Number.isNaN(minVal) && !Number.isNaN(maxVal)) {
    if (minVal > maxVal) {
      errors.push({ field: 'minPrice', message: 'minPrice cannot be greater than maxPrice' });
    }
  }

  if (category !== undefined) {
    const normalizedCategory = category.toLowerCase().trim();
    if (!ALLOWED_CATEGORIES.includes(normalizedCategory)) {
      errors.push({
        field: 'category',
        message: `Invalid category filter '${category}'. Allowed: ${ALLOWED_CATEGORIES.join(', ')}`
      });
    }
  }

  if (inStock !== undefined) {
    if (inStock !== 'true' && inStock !== 'false') {
      errors.push({ field: 'inStock', message: "inStock filter must be 'true' or 'false'" });
    }
  }

  if (page !== undefined) {
    const p = parseInt(page, 10);
    if (Number.isNaN(p) || p < 1) {
      errors.push({ field: 'page', message: 'page must be an integer greater than or equal to 1' });
    }
  }

  if (limit !== undefined) {
    const l = parseInt(limit, 10);
    if (Number.isNaN(l) || l < 1 || l > 100) {
      errors.push({ field: 'limit', message: 'limit must be an integer between 1 and 100' });
    }
  }

  if (sortBy !== undefined) {
    const allowedSort = ['price', 'name', 'createdAt', 'category'];
    if (!allowedSort.includes(sortBy)) {
      errors.push({ field: 'sortBy', message: `sortBy must be one of: ${allowedSort.join(', ')}` });
    }
  }

  if (order !== undefined) {
    if (!['asc', 'desc'].includes(order.toLowerCase())) {
      errors.push({ field: 'order', message: "order must be either 'asc' or 'desc'" });
    }
  }

  if (errors.length > 0) {
    return ApiResponse.error(res, 'Invalid query parameters', HttpStatus.BAD_REQUEST, errors);
  }

  next();
}

/**
 * Validate Product ID path parameter
 */
function validateProductIdParam(req, res, next) {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || id.trim() === '') {
    return ApiResponse.error(res, 'Product ID path parameter is required', HttpStatus.BAD_REQUEST);
  }
  next();
}

/**
 * Validate review creation payload
 * Used by POST /products/:id/reviews
 */
function validateCreateReview(req, res, next) {
  const errors = [];
  const body = req.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return ApiResponse.error(
      res,
      'Invalid request payload. Request body must be a JSON object',
      HttpStatus.BAD_REQUEST
    );
  }

  // rating validation
  if (body.rating === undefined || body.rating === null) {
    errors.push({ field: 'rating', message: 'Rating is required' });
  } else if (typeof body.rating !== 'number' || !Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
    errors.push({ field: 'rating', message: 'Rating must be an integer between 1 and 5' });
  }

  // comment validation
  if (body.comment === undefined || body.comment === null) {
    errors.push({ field: 'comment', message: 'Comment is required' });
  } else if (typeof body.comment !== 'string' || body.comment.trim().length === 0) {
    errors.push({ field: 'comment', message: 'Comment must be a non-empty string' });
  } else if (body.comment.length > 500) {
    errors.push({ field: 'comment', message: 'Comment must not exceed 500 characters' });
  }

  // author validation (optional)
  if (body.author !== undefined && body.author !== null) {
    if (typeof body.author !== 'string') {
      errors.push({ field: 'author', message: 'Author must be a string' });
    } else if (body.author.length > 50) {
      errors.push({ field: 'author', message: 'Author must not exceed 50 characters' });
    }
  }

  if (errors.length > 0) {
    return ApiResponse.error(res, 'Validation failed: Invalid review data', HttpStatus.BAD_REQUEST, errors);
  }

  next();
}

module.exports = {
  validateContentType,
  validateCreateProduct,
  validateUpdateProduct,
  validateProductQuery,
  validateProductIdParam,
  validateCreateReview
};
