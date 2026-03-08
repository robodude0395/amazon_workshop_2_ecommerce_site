# Shopping Assistant Chatbot

A Python-based conversational AI service for the Smiths Detection E-Commerce Platform. Built using Strands Agents SDK and AWS Bedrock Nova Pro, this chatbot provides intelligent shopping assistance through natural language conversations.

## Overview

The chatbot service operates as an independent microservice that integrates with the existing Node.js backend via HTTP APIs. It provides:

- Natural language product search and recommendations
- Shopping cart management through conversation
- Session-based conversation context
- Real-time responses powered by AWS Bedrock Nova Pro

## Architecture

- **Framework**: FastAPI for HTTP API server
- **AI Engine**: Strands Agents SDK with AWS Bedrock Nova Pro
- **Integration**: HTTP-based communication with Node.js backend
- **Deployment**: Independent service running on port 8000

## Prerequisites

- Python 3.9 or higher
- AWS account with Bedrock access
- AWS credentials with permissions for Bedrock Nova Pro
- Running Node.js backend (on port 5000 by default)

## Installation

1. **Navigate to the chatbot directory**:
   ```bash
   cd chatbot
   ```

2. **Create a virtual environment** (recommended):
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set the required variables:
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
   - `BACKEND_API_URL`: URL of the Node.js backend (e.g., http://localhost:5000)

## Configuration

All configuration is managed through environment variables. See `.env.example` for a complete list of available options.

### Required Variables

- `AWS_ACCESS_KEY_ID`: AWS access key for Bedrock authentication
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for Bedrock authentication
- `BACKEND_API_URL`: Base URL of the Node.js backend API

### Optional Variables

- `AWS_SESSION_TOKEN`: AWS session token for temporary credentials
- `AWS_BEARER_TOKEN_BEDROCK`: Bearer token for alternative authentication
- `AWS_REGION`: AWS region (default: us-east-1)
- `CHATBOT_PORT`: Service port (default: 8000)
- `CHATBOT_HOST`: Host binding (default: 0.0.0.0)
- `LOG_LEVEL`: Logging level (default: INFO)
- `BACKEND_API_TIMEOUT`: Backend API timeout in seconds (default: 5)
- `CORS_ORIGINS`: Allowed CORS origins (default: http://localhost:3000)
- `SESSION_MAX_AGE_HOURS`: Session expiration time (default: 24)

## Running the Service

### Development Mode

```bash
# From the chatbot directory
python main.py
```

Or using uvicorn directly:

```bash
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

### Production Mode

```bash
# Using the startup script
chmod +x start.sh
./start.sh
```

Or using uvicorn with production settings:

```bash
uvicorn server:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

### POST /api/chat

Send a message to the chatbot and receive a response.

**Request**:
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "What X-ray scanners do you have?"
}
```

**Response** (200 OK):
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "response": "We have several X-ray scanners available...",
  "timestamp": "2024-01-20T15:30:00Z"
}
```

**Error Response** (400 Bad Request):
```json
{
  "error": "Invalid request",
  "details": "message field is required"
}
```

### GET /health

Check the health status of the chatbot service.

**Response** (200 OK - Healthy):
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime_seconds": 3600,
  "nova_pro_status": "connected",
  "backend_api_status": "connected"
}
```

**Response** (503 Service Unavailable - Unhealthy):
```json
{
  "status": "unhealthy",
  "version": "1.0.0",
  "uptime_seconds": 3600,
  "nova_pro_status": "disconnected",
  "backend_api_status": "connected"
}
```

**Response** (200 OK - Degraded):
```json
{
  "status": "degraded",
  "version": "1.0.0",
  "uptime_seconds": 3600,
  "nova_pro_status": "connected",
  "backend_api_status": "disconnected"
}
```

## Usage Examples

### Starting a Conversation

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "Hello, I need help finding a product"
  }'
```

### Searching for Products

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "Show me X-ray scanners for airport security"
  }'
```

### Adding to Cart

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "Add the SD-1000 to my cart"
  }'
```

### Checking Health

```bash
curl http://localhost:8000/health
```

## Features

### Natural Language Understanding

The chatbot uses AWS Bedrock Nova Pro to understand user intent and provide contextually relevant responses. It can handle:

- Product searches and recommendations
- Product comparisons and specifications
- Shopping cart operations (add, view, update, remove)
- General assistance and help requests

### Session Management

Each conversation is tracked by a unique session ID. The chatbot maintains conversation history for context, storing up to 100 messages per session. Sessions expire after 24 hours of inactivity.

### Backend Integration

The chatbot communicates with the Node.js backend via HTTP APIs to:

- Retrieve product catalog information
- Fetch product details and specifications
- Manage shopping cart operations
- Access real-time inventory data

### Error Handling

The service implements comprehensive error handling:

- Graceful degradation when backend is unavailable
- User-friendly error messages
- Automatic retry logic for transient failures
- Detailed logging for troubleshooting

## Logging

The service uses structured JSON logging for observability. Logs include:

- HTTP requests (method, path, session ID)
- Backend API calls (endpoint, status, response time)
- Nova Pro API interactions
- Errors with context and stack traces

Configure log level via the `LOG_LEVEL` environment variable.

## Troubleshooting

### Service Won't Start

1. **Check AWS credentials**: Ensure `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set correctly
2. **Verify Bedrock access**: Confirm your AWS account has access to Bedrock Nova Pro
3. **Check port availability**: Ensure port 8000 is not already in use
4. **Review logs**: Check console output for specific error messages

### Backend Connection Issues

1. **Verify backend is running**: Ensure Node.js backend is running on the configured port
2. **Check BACKEND_API_URL**: Confirm the URL is correct and accessible
3. **Test connectivity**: Use curl to test backend endpoints directly
4. **Review firewall rules**: Ensure no firewall is blocking connections

### Nova Pro Errors

1. **Check AWS region**: Ensure `AWS_REGION` is set to a region with Bedrock access
2. **Verify credentials**: Test AWS credentials using AWS CLI
3. **Check quotas**: Ensure you haven't exceeded Bedrock API quotas
4. **Review IAM permissions**: Confirm IAM user/role has bedrock:InvokeModel permission

## Development

### Project Structure

```
chatbot/
├── config.py           # Configuration management
├── logger.py           # Structured logging
├── models.py           # Data models
├── backend_client.py   # Backend API client
├── agent.py            # Strands agent logic
├── server.py           # FastAPI application
├── main.py             # Entry point
├── requirements.txt    # Python dependencies
├── .env.example        # Environment template
├── .env                # Local configuration (gitignored)
└── README.md           # This file
```

### Adding New Features

1. Define new tools in `agent.py` for additional capabilities
2. Update the system prompt to guide the agent's behavior
3. Add corresponding backend API methods in `backend_client.py`
4. Update tests to cover new functionality

## Deployment

### Single Server Deployment

The chatbot service can run on the same server as the Node.js backend:

1. Install Python 3.9+ on the server
2. Clone the repository and navigate to `chatbot/`
3. Install dependencies: `pip install -r requirements.txt`
4. Configure environment variables in `.env`
5. Run the service: `./start.sh`

### Reverse Proxy Configuration (Nginx)

```nginx
# Chatbot service
location /api/chat {
    proxy_pass http://localhost:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

location /health {
    proxy_pass http://localhost:8000;
}

# Backend API
location /api/ {
    proxy_pass http://localhost:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### Process Management

Use a process manager like systemd or supervisor to ensure the service stays running:

**systemd service file** (`/etc/systemd/system/chatbot.service`):

```ini
[Unit]
Description=Shopping Assistant Chatbot
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/chatbot
Environment="PATH=/path/to/.venv/bin"
ExecStart=/path/to/.venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable chatbot
sudo systemctl start chatbot
```

## License

Part of the Smiths Detection E-Commerce Platform.

## Support

For issues or questions, please refer to the main project documentation or contact the development team.
