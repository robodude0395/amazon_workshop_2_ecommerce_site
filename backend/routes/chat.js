/**
 * Chat API Routes
 *
 * Proxies chat requests from the frontend to the Python chatbot service.
 */

const express = require('express');
const router = express.Router();

// Get chatbot service URL from environment variable
const CHATBOT_SERVICE_URL = process.env.CHATBOT_SERVICE_URL || 'http://localhost:8000';

/**
 * POST /api/chat
 * Forward chat messages to the chatbot service
 */
router.post('/', async (req, res) => {
  try {
    const { session_id, message } = req.body;

    // Validate request
    if (!session_id || !message) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'session_id and message are required'
        }
      });
    }

    // Forward request to chatbot service
    const response = await fetch(`${CHATBOT_SERVICE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session_id, message }),
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });

    // Parse response
    const data = await response.json();

    // Forward response status and data
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data.error || { message: 'Chatbot service error' }
      });
    }

    res.json(data);

  } catch (error) {
    console.error('[CHAT PROXY ERROR]', error.message);

    // Handle specific error types
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return res.status(504).json({
        success: false,
        error: {
          code: 'GATEWAY_TIMEOUT',
          message: 'Chatbot service timeout'
        }
      });
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Chatbot service is not available'
        }
      });
    }

    // Generic error
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to communicate with chatbot service'
      }
    });
  }
});

/**
 * GET /api/chat/health
 * Check chatbot service health
 */
router.get('/health', async (req, res) => {
  try {
    const response = await fetch(`${CHATBOT_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(5000)
    });

    const data = await response.json();
    res.status(response.status).json(data);

  } catch (error) {
    console.error('[CHAT HEALTH CHECK ERROR]', error.message);

    res.status(503).json({
      status: 'unhealthy',
      error: 'Cannot reach chatbot service'
    });
  }
});

module.exports = router;
