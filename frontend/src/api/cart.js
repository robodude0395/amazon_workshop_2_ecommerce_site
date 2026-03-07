/**
 * Cart API
 *
 * Provides methods for interacting with cart endpoints.
 */

import apiRequest from './client';

/**
 * Get cart contents
 *
 * @returns {Promise<object>} - Cart object with items, total, and item_count
 */
export async function get() {
  const response = await apiRequest('/api/cart', {
    method: 'GET',
  });
  return response.data;
}

/**
 * Add item to cart
 *
 * @param {number} productId - Product ID to add
 * @param {number} quantity - Quantity to add
 * @returns {Promise<object>} - Created/updated cart item
 */
export async function add(productId, quantity) {
  const response = await apiRequest('/api/cart', {
    method: 'POST',
    body: JSON.stringify({
      product_id: productId,
      quantity: quantity,
    }),
  });
  return response.data;
}

/**
 * Update cart item quantity
 *
 * @param {number} itemId - Cart item ID
 * @param {number} quantity - New quantity (0 to remove)
 * @returns {Promise<object|null>} - Updated cart item or null if removed
 */
export async function update(itemId, quantity) {
  const response = await apiRequest(`/api/cart/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify({
      quantity: quantity,
    }),
  });

  // If quantity was 0, item was removed (204 No Content)
  if (response === null || response === undefined) {
    return null;
  }

  return response.data;
}

/**
 * Remove item from cart
 *
 * @param {number} itemId - Cart item ID
 * @returns {Promise<void>}
 */
export async function remove(itemId) {
  await apiRequest(`/api/cart/${itemId}`, {
    method: 'DELETE',
  });
}

const cartAPI = {
  get,
  add,
  update,
  remove,
};

export default cartAPI;
