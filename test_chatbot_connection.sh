#!/bin/bash

# Test script to verify chatbot service connectivity
# Usage: ./test_chatbot_connection.sh <chatbot_url>
# Example: ./test_chatbot_connection.sh http://192.168.1.100:8000

CHATBOT_URL=${1:-"http://localhost:8000"}

echo "Testing chatbot service at: $CHATBOT_URL"
echo "=========================================="
echo ""

# Test 1: Health check
echo "1. Testing health endpoint..."
curl -s -w "\nHTTP Status: %{http_code}\n" "${CHATBOT_URL}/health" || echo "Failed to connect"
echo ""
echo "=========================================="
echo ""

# Test 2: Chat endpoint
echo "2. Testing chat endpoint..."
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X POST "${CHATBOT_URL}/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session-123",
    "message": "Hello, can you help me?"
  }' || echo "Failed to connect"
echo ""
echo "=========================================="
echo ""

echo "Test complete!"
echo ""
echo "If you see HTTP Status: 200 for both tests, the chatbot is working."
echo "If you see connection errors, check:"
echo "  - Is the chatbot service running?"
echo "  - Is the URL correct?"
echo "  - Can your network reach the chatbot server?"
echo "  - Are there any firewall rules blocking the connection?"
