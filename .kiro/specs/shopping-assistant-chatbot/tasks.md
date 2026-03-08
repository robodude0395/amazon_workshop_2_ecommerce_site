# Implementation Plan: Shopping Assistant Chatbot

## Overview

This plan implements a Python-based conversational AI service using Strands Agents SDK and AWS Bedrock Nova Pro. The chatbot operates as an independent microservice that integrates with the existing Node.js backend via HTTP APIs, providing intelligent shopping assistance through natural language conversations.

The implementation follows a layered architecture: HTTP interface (FastAPI), session management, Strands agent logic, and backend API integration. The service will be independently deployable and run on port 8000.

## Tasks

- [x] 1. Set up project structure and dependencies
  - Create `chatbot/` directory at project root
  - Create `requirements.txt` with dependencies: fastapi, uvicorn, strands-agents-sdk, boto3, requests, python-dotenv, pydantic
  - Create `.env.example` file documenting all environment variables
  - Create `README.md` with setup and running instructions
  - _Requirements: 13.4, 12.5_

- [x] 2. Implement configuration management
  - [x] 2.1 Create configuration module with Pydantic settings
    - Create `chatbot/config.py` with Settings class
    - Define all environment variables with validation
    - Implement validators for port ranges and log levels
    - Add default values for optional parameters
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 1.1, 1.2, 1.3, 3.6, 7.1_

  - [x] 2.2 Implement configuration loading and validation
    - Create `load_settings()` function with error handling
    - Log descriptive errors for missing required variables
    - Fail fast on configuration errors at startup
    - _Requirements: 12.3, 12.4, 1.4_

- [x] 3. Implement structured logging component
  - Create `chatbot/logger.py` with StructuredLogger class
  - Implement JSON formatter for log output
  - Add methods for logging requests, backend calls, and errors
  - Configure log level from environment variable
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 4. Implement backend API client
  - [x] 4.1 Create BackendAPIClient class with retry logic
    - Create `chatbot/backend_client.py`
    - Initialize requests session with retry strategy (1 retry, 5s timeout)
    - Implement custom exceptions: BackendAPIError, ProductNotFoundError, CartItemNotFoundError, InvalidRequestError
    - _Requirements: 7.1, 7.2, 7.5_

  - [x] 4.2 Implement product API methods
    - Implement `get_products()` method with error handling
    - Implement `get_product(product_id)` method with 404 handling
    - Log all API calls with endpoint and response time
    - _Requirements: 5.1, 7.3, 7.4, 8.3_

  - [x] 4.3 Implement cart API methods
    - Implement `get_cart()` method
    - Implement `add_to_cart(product_id, quantity)` method
    - Implement `update_cart_item(cart_item_id, quantity)` method
    - Implement `remove_cart_item(cart_item_id)` method
    - Handle HTTP 4xx and 5xx errors with specific exceptions
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.3, 7.4_

  - [x] 4.4 Implement health check method
    - Implement `health_check()` method with 2s timeout
    - Return boolean indicating backend reachability
    - _Requirements: 11.4_

- [x] 5. Checkpoint - Verify backend client functionality
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement session management
  - [x] 6.1 Create session data models
    - Create `chatbot/models.py` with Message and Session dataclasses
    - Implement `add_message()` method with 100-message limit
    - Track created_at and last_accessed timestamps
    - _Requirements: 4.3, 4.5_

  - [x] 6.2 Create SessionManager class
    - Implement in-memory session storage with dictionary
    - Implement `get_or_create_session(session_id)` method
    - Implement `cleanup_old_sessions(max_age_hours)` method
    - Add thread-safe access with locks
    - _Requirements: 4.1, 4.2, 4.4_

- [x] 7. Implement Strands agent with Nova Pro
  - [x] 7.1 Initialize AWS Bedrock client
    - Create `chatbot/agent.py`
    - Initialize boto3 Bedrock client with credentials from config
    - Support both access key and bearer token authentication
    - Handle authentication failures with descriptive errors
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 7.2 Define agent tools for product operations
    - Implement `search_products(query)` tool wrapping backend client
    - Implement `get_product_details(product_id)` tool
    - Add tool docstrings for agent understanding
    - Handle BackendAPIError exceptions and return user-friendly messages
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 2.4_

  - [x] 7.3 Define agent tools for cart operations
    - Implement `add_to_cart(product_id, quantity)` tool
    - Implement `view_cart()` tool
    - Implement `update_cart_item(cart_item_id, quantity)` tool
    - Implement `remove_from_cart(cart_item_id)` tool
    - Handle errors and provide confirmation messages
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 7.4 Create Strands agent with system prompt
    - Initialize Agent with Nova Pro model (amazon.nova-pro-v1:0)
    - Configure system prompt for shopping assistant role
    - Register all tools with the agent
    - Handle Strands SDK initialization failures
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 9.1, 9.2, 9.3, 9.4_

  - [x] 7.5 Implement conversation processing
    - Create `process_message(session, user_message)` function
    - Pass conversation history to agent for context
    - Generate response with Nova Pro (max 500 words)
    - Handle ambiguous intents with clarifying questions
    - Log Nova Pro API errors
    - _Requirements: 9.1, 9.5, 10.1, 10.2, 10.3, 10.4, 10.5, 8.4_

- [x] 8. Checkpoint - Verify agent functionality
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement HTTP API server
  - [x] 9.1 Create FastAPI application with CORS
    - Create `chatbot/server.py` with FastAPI app
    - Configure CORS middleware for frontend origin
    - Define Pydantic models: ChatRequest, ChatResponse, ErrorResponse, HealthResponse
    - _Requirements: 3.5, 3.1, 3.2_

  - [x] 9.2 Implement POST /api/chat endpoint
    - Validate request with ChatRequest model
    - Get or create session from SessionManager
    - Process message through Strands agent
    - Add user message and assistant response to session history
    - Return ChatResponse with session_id, response, and timestamp
    - Handle errors and return appropriate HTTP status codes (400, 500)
    - Log all requests with method, path, and session_id
    - Implement 10-second timeout
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 8.2_

  - [x] 9.3 Implement GET /health endpoint
    - Check Nova Pro connectivity (via agent initialization status)
    - Check backend API connectivity (via health_check method)
    - Return "healthy" (200) when both connected
    - Return "unhealthy" (503) when Nova Pro disconnected
    - Return "degraded" (200) when backend disconnected
    - Include version, uptime, and component statuses
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 9.4 Implement graceful shutdown handler
    - Register signal handlers for SIGTERM and SIGINT
    - Clean up sessions and close connections on shutdown
    - _Requirements: 13.5_

  - [x] 9.5 Create main entry point
    - Create `chatbot/main.py` to run uvicorn server
    - Load configuration and initialize components
    - Start background task for session cleanup
    - Run server on configured host and port
    - _Requirements: 3.6, 13.1_

- [x] 10. Integration and deployment preparation
  - [x] 10.1 Create startup script
    - Create `chatbot/start.sh` script to run the service
    - Source environment variables from .env file
    - Start uvicorn with proper host and port
    - _Requirements: 13.1_

  - [x] 10.2 Update project documentation
    - Update main README.md with chatbot service information
    - Document environment variables in .env.example
    - Add API endpoint documentation
    - Include deployment instructions
    - _Requirements: 12.5, 13.1, 13.2, 13.3_

  - [x] 10.3 Verify independent deployment
    - Test service starts without Node.js backend running
    - Verify service communicates only via HTTP (no direct DB access)
    - Confirm service runs on separate port (8000)
    - _Requirements: 13.1, 13.2, 13.3_

- [x] 11. Final checkpoint - End-to-end verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- The chatbot service is completely independent from the Node.js backend
- All communication with backend happens via HTTP APIs (no direct database access)
- Service runs on port 8000 by default (configurable via CHATBOT_PORT)
- AWS credentials required for Bedrock Nova Pro access
- Session data stored in memory (will be lost on service restart)
- Each task references specific requirements for traceability
