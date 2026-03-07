const express = require('express');
const router = express.Router();
const productService = require('../services/productService');

/**
 * GET /api/products
 * Retrieve all products from the catalog
 *
 * @returns {200} Success response with product array
 * @returns {503} Service unavailable (database connection failed)
 */
router.get('/', async (req, res, next) => {
  try {
    const products = await productService.getAllProducts();

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    // Pass error to error handler middleware
    next(error);
  }
});

/**
 * GET /api/products/:id
 * Retrieve a single product by ID
 *
 * @param {number} id - Product ID from URL parameter
 * @returns {200} Success response with product object
 * @returns {404} Product not found
 * @returns {503} Service unavailable (database connection failed)
 */
router.get('/:id', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);

    // Validate ID is a valid number
    if (isNaN(productId) || productId <= 0) {
      const error = new Error('Invalid product ID');
      error.code = 'INVALID_PRODUCT_ID';
      error.statusCode = 400;
      return next(error);
    }

    const product = await productService.getProductById(productId);

    // Return 404 if product not found
    if (!product) {
      const error = new Error(`Product with ID ${productId} not found`);
      error.code = 'PRODUCT_NOT_FOUND';
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    // Pass error to error handler middleware
    next(error);
  }
});

module.exports = router;
