/**
 * API Client
 *
 * Provides a centralized interface for making API requests to the backend.
 * Handles response parsing, error extraction, and provides user-friendly error messages.
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Generic API request wrapper
 *
 * @param {string} endpoint - API endpoint (e.g., '/api/products')
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<any>} - Parsed response data
 * @throws {Error} - User-friendly error message
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    // Parse JSON response
    const data = await response.json();

    // Check if request was successful
    if (!response.ok) {
      // Extract error message from response
      const errorMessage = data.error?.message || 'An error occurred';
      const error = new Error(errorMessage);
      error.statusCode = response.status;
      error.code = data.error?.code;
      throw error;
    }

    return data;
  } catch (error) {
    // Handle network errors
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to server. Please check your connection.');
    }

    // Re-throw API errors with user-friendly messages
    throw error;
  }
}

export default apiRequest;
