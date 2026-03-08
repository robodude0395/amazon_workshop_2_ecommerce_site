/**
 * Chat API client for communicating with the chatbot service.
 */

import apiClient from './client';

/**
 * Send a message to the chatbot and get a response.
 *
 * @param {string} sessionId - Unique session identifier
 * @param {string} message - User's message
 * @returns {Promise<Object>} Response with session_id, response, and timestamp
 */
export const sendChatMessage = async (sessionId, message) => {
  const response = await apiClient.post('/api/chat', {
    session_id: sessionId,
    message: message
  });
  return response.data;
};

/**
 * Check chatbot service health.
 *
 * @returns {Promise<Object>} Health status
 */
export const getChatbotHealth = async () => {
  const response = await apiClient.get('/chatbot/health');
  return response.data;
};
