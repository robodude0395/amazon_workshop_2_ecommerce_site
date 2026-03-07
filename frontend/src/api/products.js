/**
 * Products API
 *
 * Provides methods for interacting with product endpoints.
 */

import apiRequest from './client';

/**
 * Get all products
 *
 * @returns {Promise<Array>} - Array of product objects
 */
export async function getAll() {
  const response = await apiRequest('/api/products', {
    method: 'GET',
  });
  return response.data;
}

/**
 * Get product by ID
 *
 * @param {number} id - Product ID
 * @returns {Promise<object>} - Product object
 */
export async function getById(id) {
  const response = await apiRequest(`/api/products/${id}`, {
    method: 'GET',
  });
  return response.data;
}

const productsAPI = {
  getAll,
  getById,
};

export default productsAPI;
