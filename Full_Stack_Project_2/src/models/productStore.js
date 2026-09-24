const crypto = require('crypto');
const { seedProducts, seedReviews } = require('../data/seedProducts');

class ProductStore {
  constructor() {
    this.reset();
  }

  /**
   * Reset store to initial seed data (useful for test isolation)
   */
  reset() {
    this.products = JSON.parse(JSON.stringify(seedProducts));
    this.reviews = JSON.parse(JSON.stringify(seedReviews));
  }

  /**
   * Retrieve all products with optional filters, search, sorting, and pagination
   * @param {object} options
   */
  findAll(options = {}) {
    const {
      category,
      minPrice,
      maxPrice,
      inStock,
      search,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10
    } = options;

    let result = [...this.products];

    // Filter by category
    if (category) {
      result = result.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by minPrice
    if (minPrice !== undefined && minPrice !== null) {
      const min = Number(minPrice);
      if (!Number.isNaN(min)) {
        result = result.filter((p) => p.price >= min);
      }
    }

    // Filter by maxPrice
    if (maxPrice !== undefined && maxPrice !== null) {
      const max = Number(maxPrice);
      if (!Number.isNaN(max)) {
        result = result.filter((p) => p.price <= max);
      }
    }

    // Filter by inStock
    if (inStock !== undefined && inStock !== null) {
      const inStockBool = inStock === 'true' || inStock === true;
      result = result.filter((p) => p.inStock === inStockBool);
    }

    // Search query
    if (search && typeof search === 'string' && search.trim() !== '') {
      const query = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query))
      );
    }

    // Sorting
    const sortField = ['price', 'name', 'createdAt', 'category'].includes(sortBy)
      ? sortBy
      : 'createdAt';
    const isAsc = order.toLowerCase() === 'asc';

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        return isAsc
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return isAsc ? valA - valB : valB - valA;
    });

    const total = result.length;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const totalPages = Math.ceil(total / limitNum) || 1;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedItems = result.slice(startIndex, startIndex + limitNum);

    return {
      data: JSON.parse(JSON.stringify(paginatedItems)),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    };
  }

  /**
   * Find product by ID
   * @param {string} id
   */
  findById(id) {
    const product = this.products.find((p) => p.id === id);
    return product ? JSON.parse(JSON.stringify(product)) : null;
  }

  /**
   * Find product by name (case-insensitive check for uniqueness)
   * @param {string} name
   * @param {string} [excludeId]
   */
  findByName(name, excludeId = null) {
    const normalized = name.trim().toLowerCase();
    const product = this.products.find(
      (p) => p.name.trim().toLowerCase() === normalized && p.id !== excludeId
    );
    return product ? JSON.parse(JSON.stringify(product)) : null;
  }

  /**
   * Create a new product
   * @param {object} productData
   */
  create(productData) {
    const now = new Date().toISOString();
    const newProduct = {
      id: `prod_${crypto.randomBytes(6).toString('hex')}`,
      name: productData.name.trim(),
      description: productData.description ? productData.description.trim() : '',
      price: Number(productData.price),
      category: productData.category.toLowerCase().trim(),
      inStock: productData.inStock !== undefined ? Boolean(productData.inStock) : true,
      createdAt: now,
      updatedAt: now
    };

    this.products.unshift(newProduct);
    return JSON.parse(JSON.stringify(newProduct));
  }

  /**
   * Update or replace an existing product
   * @param {string} id
   * @param {object} updateData
   */
  update(id, updateData) {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) {
      return null;
    }

    const existing = this.products[index];
    const now = new Date().toISOString();

    const updatedProduct = {
      id: existing.id,
      name: updateData.name !== undefined ? updateData.name.trim() : existing.name,
      description:
        updateData.description !== undefined
          ? updateData.description.trim()
          : existing.description,
      price:
        updateData.price !== undefined
          ? Number(updateData.price)
          : existing.price,
      category:
        updateData.category !== undefined
          ? updateData.category.toLowerCase().trim()
          : existing.category,
      inStock:
        updateData.inStock !== undefined
          ? Boolean(updateData.inStock)
          : existing.inStock,
      createdAt: existing.createdAt,
      updatedAt: now
    };

    this.products[index] = updatedProduct;
    return JSON.parse(JSON.stringify(updatedProduct));
  }

  /**
   * Delete product by ID
   * @param {string} id
   */
  delete(id) {
    const initialLength = this.products.length;
    this.products = this.products.filter((p) => p.id !== id);
    const deleted = this.products.length < initialLength;

    if (deleted) {
      // Also remove associated reviews
      this.reviews = this.reviews.filter((r) => r.productId !== id);
    }

    return deleted;
  }

  /**
   * Get reviews for a specific product
   * @param {string} productId
   */
  getReviewsByProductId(productId) {
    return JSON.parse(
      JSON.stringify(this.reviews.filter((r) => r.productId === productId))
    );
  }

  /**
   * Add a review for a product
   * @param {string} productId
   * @param {object} reviewData
   */
  addReview(productId, reviewData) {
    const newReview = {
      id: `rev_${crypto.randomBytes(6).toString('hex')}`,
      productId,
      rating: Number(reviewData.rating),
      author: reviewData.author ? reviewData.author.trim() : 'Anonymous',
      comment: reviewData.comment ? reviewData.comment.trim() : '',
      createdAt: new Date().toISOString()
    };

    this.reviews.push(newReview);
    return JSON.parse(JSON.stringify(newReview));
  }
}

// Export singleton instance
const productStore = new ProductStore();
module.exports = productStore;
