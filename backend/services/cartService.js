const db = require('../config/database');
const { productExists } = require('./productService');

/**
 * CartService
 * Handles shopping cart operations including item management and calculations
 */

/**
 * Get cart with all items and product details
 * @returns {Promise<Object>} Cart object with items array, total, and item_count
 */
async function getCart() {
  try {
    // Query cart items with JOIN to products table
    const items = await db.query(`
      SELECT
        ci.id,
        ci.product_id,
        ci.quantity,
        ci.created_at,
        ci.updated_at,
        p.part_number,
        p.description,
        p.price,
        (ci.quantity * p.price) as line_total
      FROM cart_items ci
      INNER JOIN products p ON ci.product_id = p.id
      ORDER BY ci.created_at DESC
    `);

    // Format items with nested product object
    const formattedItems = items.map(item => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      product: {
        id: item.product_id,
        part_number: item.part_number,
        description: item.description,
        price: item.price
      },
      line_total: parseFloat(item.line_total),
      created_at: item.created_at,
      updated_at: item.updated_at
    }));

    // Calculate totals
    const total = calculateCartTotal(formattedItems);
    const item_count = formattedItems.reduce((sum, item) => sum + item.quantity, 0);

    console.log(`[CartService] Retrieved cart with ${formattedItems.length} items, total: ${total}`);

    return {
      items: formattedItems,
      total,
      item_count
    };
  } catch (error) {
    console.error('[CartService] Failed to get cart:', error.message);

    // Check for connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      const dbError = new Error('Database connection failed');
      dbError.code = 'DATABASE_CONNECTION_FAILED';
      dbError.statusCode = 503;
      throw dbError;
    }

    const dbError = new Error('Failed to load cart');
    dbError.code = 'CART_LOAD_FAILED';
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Add item to cart or update quantity if already exists
 * @param {number} productId - Product ID
 * @param {number} quantity - Quantity to add
 * @returns {Promise<Object>} Created or updated cart item
 */
async function addItem(productId, quantity) {
  // Validate inputs
  if (!productId || !Number.isInteger(productId) || productId <= 0) {
    const error = new Error('Product ID is required and must be a positive integer');
    error.code = 'INVALID_PRODUCT_ID';
    error.statusCode = 400;
    throw error;
  }

  if (!quantity || !Number.isInteger(quantity) || quantity <= 0) {
    const error = new Error('Quantity must be a positive integer');
    error.code = 'INVALID_QUANTITY';
    error.statusCode = 400;
    throw error;
  }

  try {
    // Check if product exists
    const exists = await productExists(productId);
    if (!exists) {
      const error = new Error(`Product with ID ${productId} not found`);
      error.code = 'PRODUCT_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    // Check if item already exists in cart
    const existingItems = await db.query(
      'SELECT id, quantity FROM cart_items WHERE product_id = ?',
      [productId]
    );

    if (existingItems.length > 0) {
      // Item exists - increment quantity
      const existingItem = existingItems[0];
      const newQuantity = existingItem.quantity + quantity;

      await db.query(
        'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newQuantity, existingItem.id]
      );

      console.log(`[CartService] Updated cart item ${existingItem.id}: quantity ${existingItem.quantity} -> ${newQuantity}`);

      // Return updated item
      const updatedItems = await db.query(
        'SELECT id, product_id, quantity, created_at, updated_at FROM cart_items WHERE id = ?',
        [existingItem.id]
      );

      return updatedItems[0];
    } else {
      // Item doesn't exist - create new
      const result = await db.query(
        'INSERT INTO cart_items (product_id, quantity) VALUES (?, ?)',
        [productId, quantity]
      );

      console.log(`[CartService] Created cart item ${result.insertId} for product ${productId}, quantity ${quantity}`);

      // Return created item
      const createdItems = await db.query(
        'SELECT id, product_id, quantity, created_at, updated_at FROM cart_items WHERE id = ?',
        [result.insertId]
      );

      return createdItems[0];
    }
  } catch (error) {
    // Re-throw if already formatted
    if (error.code && error.statusCode) {
      throw error;
    }

    console.error('[CartService] Failed to add item to cart:', error.message);

    // Check for connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      const dbError = new Error('Database connection failed');
      dbError.code = 'DATABASE_CONNECTION_FAILED';
      dbError.statusCode = 503;
      throw dbError;
    }

    const dbError = new Error('Failed to add item to cart');
    dbError.code = 'CART_UPDATE_FAILED';
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Update cart item quantity (removes item if quantity is 0)
 * @param {number} itemId - Cart item ID
 * @param {number} quantity - New quantity (0 to remove)
 * @returns {Promise<Object|null>} Updated cart item or null if removed
 */
async function updateItemQuantity(itemId, quantity) {
  // Validate inputs
  if (!itemId || !Number.isInteger(itemId) || itemId <= 0) {
    const error = new Error('Item ID is required and must be a positive integer');
    error.code = 'INVALID_ITEM_ID';
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isInteger(quantity) || quantity < 0) {
    const error = new Error('Quantity must be a non-negative integer');
    error.code = 'INVALID_QUANTITY';
    error.statusCode = 400;
    throw error;
  }

  try {
    // Check if item exists
    const existingItems = await db.query(
      'SELECT id FROM cart_items WHERE id = ?',
      [itemId]
    );

    if (existingItems.length === 0) {
      const error = new Error(`Cart item with ID ${itemId} not found`);
      error.code = 'CART_ITEM_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    // If quantity is 0, remove the item
    if (quantity === 0) {
      await db.query('DELETE FROM cart_items WHERE id = ?', [itemId]);
      console.log(`[CartService] Removed cart item ${itemId} (quantity set to 0)`);
      return null;
    }

    // Update quantity
    await db.query(
      'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [quantity, itemId]
    );

    console.log(`[CartService] Updated cart item ${itemId} quantity to ${quantity}`);

    // Return updated item
    const updatedItems = await db.query(
      'SELECT id, product_id, quantity, created_at, updated_at FROM cart_items WHERE id = ?',
      [itemId]
    );

    return updatedItems[0];
  } catch (error) {
    // Re-throw if already formatted
    if (error.code && error.statusCode) {
      throw error;
    }

    console.error('[CartService] Failed to update item quantity:', error.message);

    // Check for connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      const dbError = new Error('Database connection failed');
      dbError.code = 'DATABASE_CONNECTION_FAILED';
      dbError.statusCode = 503;
      throw dbError;
    }

    const dbError = new Error('Failed to update cart item');
    dbError.code = 'CART_UPDATE_FAILED';
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Remove item from cart
 * @param {number} itemId - Cart item ID
 * @returns {Promise<void>}
 */
async function removeItem(itemId) {
  // Validate input
  if (!itemId || !Number.isInteger(itemId) || itemId <= 0) {
    const error = new Error('Item ID is required and must be a positive integer');
    error.code = 'INVALID_ITEM_ID';
    error.statusCode = 400;
    throw error;
  }

  try {
    // Check if item exists
    const existingItems = await db.query(
      'SELECT id FROM cart_items WHERE id = ?',
      [itemId]
    );

    if (existingItems.length === 0) {
      const error = new Error(`Cart item with ID ${itemId} not found`);
      error.code = 'CART_ITEM_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    // Delete item
    await db.query('DELETE FROM cart_items WHERE id = ?', [itemId]);

    console.log(`[CartService] Removed cart item ${itemId}`);
  } catch (error) {
    // Re-throw if already formatted
    if (error.code && error.statusCode) {
      throw error;
    }

    console.error('[CartService] Failed to remove item:', error.message);

    // Check for connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      const dbError = new Error('Database connection failed');
      dbError.code = 'DATABASE_CONNECTION_FAILED';
      dbError.statusCode = 503;
      throw dbError;
    }

    const dbError = new Error('Failed to remove cart item');
    dbError.code = 'CART_UPDATE_FAILED';
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Calculate total cost of cart items
 * @param {Array} items - Array of cart items with line_total
 * @returns {number} Total cost
 */
function calculateCartTotal(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return 0;
  }

  const total = items.reduce((sum, item) => sum + (item.line_total || 0), 0);
  return parseFloat(total.toFixed(2));
}

/**
 * Get total count of items in cart
 * @returns {Promise<number>} Total quantity across all items
 */
async function getCartItemCount() {
  try {
    const result = await db.query(
      'SELECT COALESCE(SUM(quantity), 0) as total_count FROM cart_items'
    );

    const count = parseInt(result[0].total_count, 10);
    console.log(`[CartService] Total cart item count: ${count}`);

    return count;
  } catch (error) {
    console.error('[CartService] Failed to get cart item count:', error.message);

    // Check for connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      const dbError = new Error('Database connection failed');
      dbError.code = 'DATABASE_CONNECTION_FAILED';
      dbError.statusCode = 503;
      throw dbError;
    }

    const dbError = new Error('Failed to get cart item count');
    dbError.code = 'CART_LOAD_FAILED';
    dbError.statusCode = 500;
    throw dbError;
  }
}

module.exports = {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  calculateCartTotal,
  getCartItemCount
};
