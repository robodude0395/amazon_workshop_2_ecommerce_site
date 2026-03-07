const express = require('express');
const router = express.Router();
const cartService = require('../services/cartService');

/**
 * GET /api/cart
 * Retrieve cart contents with product details and totals
 *
 * @returns {200} OK - Cart data with items, total, and item_count
 * @returns {503} Service unavailable (database connection failed)
 */
router.get('/', async (req, res, next) => {
  try {
    // Call CartService.getCart()
    const cart = await cartService.getCart();

    // Return cart items with product details, line totals, and cart total
    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    // Pass error to error handler middleware
    // CartService already throws properly formatted errors with statusCode
    next(error);
  }
});

/**
 * POST /api/cart
 * Add item to cart or update quantity if already exists
 *
 * @body {number} product_id - Product ID to add
 * @body {number} quantity - Quantity to add
 * @returns {201} Created - Item added to cart successfully
 * @returns {400} Bad Request - Invalid product_id or quantity
 * @returns {404} Not Found - Product doesn't exist
 * @returns {503} Service unavailable (database connection failed)
 */
router.post('/', async (req, res, next) => {
  try {
    const { product_id, quantity } = req.body;

    // Validate request body
    if (!product_id || !Number.isInteger(product_id) || product_id <= 0) {
      const error = new Error('Product ID is required and must be a positive integer');
      error.code = 'INVALID_PRODUCT_ID';
      error.statusCode = 400;
      return next(error);
    }

    if (!quantity || !Number.isInteger(quantity) || quantity <= 0) {
      const error = new Error('Quantity must be a positive integer');
      error.code = 'INVALID_QUANTITY';
      error.statusCode = 400;
      return next(error);
    }

    // Call CartService.addItem()
    const cartItem = await cartService.addItem(product_id, quantity);

    // Return 201 Created with cart item data
    res.status(201).json({
      success: true,
      data: cartItem,
      message: 'Item added to cart successfully'
    });
  } catch (error) {
    // Pass error to error handler middleware
    // CartService already throws properly formatted errors with statusCode
    next(error);
  }
});

module.exports = router;

/**
 * PUT /api/cart/:id
 * Update cart item quantity
 *
 * @param {number} id - Cart item ID
 * @body {number} quantity - New quantity (0 to remove item)
 * @returns {200} OK - Item updated successfully
 * @returns {204} No Content - Item removed (quantity was 0)
 * @returns {400} Bad Request - Invalid quantity
 * @returns {404} Not Found - Cart item doesn't exist
 * @returns {503} Service unavailable (database connection failed)
 */
router.put('/:id', async (req, res, next) => {
  try {
    const itemId = parseInt(req.params.id, 10);
    const { quantity } = req.body;

    // Validate item ID
    if (!itemId || itemId <= 0) {
      const error = new Error('Cart item ID must be a positive integer');
      error.code = 'INVALID_CART_ITEM_ID';
      error.statusCode = 400;
      return next(error);
    }

    // Validate quantity (allow 0 for removal)
    if (quantity === undefined || quantity === null || !Number.isInteger(quantity) || quantity < 0) {
      const error = new Error('Quantity must be a non-negative integer');
      error.code = 'INVALID_QUANTITY';
      error.statusCode = 400;
      return next(error);
    }

    // Call CartService.updateItemQuantity()
    const result = await cartService.updateItemQuantity(itemId, quantity);

    // If quantity was 0, item was removed - return 204 No Content
    if (result === null) {
      return res.status(204).send();
    }

    // Return 200 OK with updated item
    res.status(200).json({
      success: true,
      data: result,
      message: 'Cart item updated successfully'
    });
  } catch (error) {
    // Pass error to error handler middleware
    next(error);
  }
});

/**
 * DELETE /api/cart/:id
 * Remove item from cart
 *
 * @param {number} id - Cart item ID
 * @returns {204} No Content - Item removed successfully
 * @returns {404} Not Found - Cart item doesn't exist
 * @returns {503} Service unavailable (database connection failed)
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const itemId = parseInt(req.params.id, 10);

    // Validate item ID
    if (!itemId || itemId <= 0) {
      const error = new Error('Cart item ID must be a positive integer');
      error.code = 'INVALID_CART_ITEM_ID';
      error.statusCode = 400;
      return next(error);
    }

    // Call CartService.removeItem()
    await cartService.removeItem(itemId);

    // Return 204 No Content on success
    res.status(204).send();
  } catch (error) {
    // Pass error to error handler middleware
    next(error);
  }
});
