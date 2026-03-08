# Design Document: Shopping Assistant Chatbot

## Overview

The Shopping Assistant Chatbot is a Python-based conversational AI service that provides intelligent shopping assistance for the Smiths Detection E-Commerce Platform. Built using the Strands Agents SDK with AWS Bedrock Nova Pro as the underlying large language model, the chatbot enables users to discover products, get recommendations, and manage their shopping cart through natural language conversations.

The service operates as an independent microservice that communicates with the existing Node.js backend via HTTP APIs. It exposes its own HTTP API for the React frontend to consume, maintaining session-based conversation contexts and providing real-time responses to user queries.

### Key Design Goals

1. **Independence**: Run as a standalone Python service separate from the Node.js backend
2. **Integration**: Seamlessly integrate with existing backend APIs for product and cart operations
3. **Conversational AI**: Leverage Strands SDK and Nova Pro for natural language understanding and generation
4. **Scalability**: Support multiple concurrent user sessions with isolated conversation contexts
5. **Reliability**: Implement comprehensive error handling and graceful degradation
6. **Observability**: Provide health monitoring and detailed logging for operations

### Technology Stack

- **Language**: Python 3.9+
- **AI Framework**: Strands Agents SDK
- **LLM**: AWS Bedrock Nova Pro
- **HTTP Server**: Flask or FastAPI
- **HTTP Client**: requests library with retry logic
- **Configuration**: Environment variables via python-dotenv
- **Logging**: Python logging module with structured output

## Architecture

### System Context

```
┌─────────────────┐
│  React Frontend │
│  (Port 3000)    │
└────────┬────────┘
         │ HTTP POST /api/chat
         │ HTTP GET /health
         ▼
┌─────────────────────────────────────┐
│   Chatbot Service (Python)          │
│   ┌─────────────────────────────┐   │
│   │  HTTP Server (Flask/FastAPI)│   │
│   │  - /api/chat endpoint       │   │
│   │  - /health endpoint         │   │
│   └──────────┬──────────────────┘   │
│              │                       │
│   ┌──────────▼──────────────────┐   │
│   │  Session Manager            │   │
│   │  - In-memory session store  │   │
│   │  - Conversation history     │   │
│   └──────────┬──────────────────┘   │
│              │                       │
│   ┌──────────▼──────────────────┐   │
│   │  Strands Agent              │   │
│   │  - Intent recognition       │   │
│   │  - Response generation      │   │
│   │  - Tool orchestration       │   │
│   └──────────┬──────────────────┘   │
│              │                       │
│   ┌──────────▼──────────────────┐   │
│   │  Backend API Client         │   │
│   │  - Product queries          │   │
│   │  - Cart operations          │   │
│   │  - Retry logic              │   │
│   └─────────────────────────────┘   │
└──────────────┬──────────────────────┘
               │ HTTP API calls
               ▼
┌─────────────────────────────────────┐
│   Node.js Backend (Port 5000)       │
│   - GET /api/products               │
│   - GET /api/products/:id           │
│   - GET /api/cart                   │
│   - POST /api/cart                  │
└─────────────────────────────────────┘
```

### Component Architecture

The chatbot service follows a layered architecture:

**Layer 1: HTTP Interface**
- Handles incoming requests from the frontend
- Validates request payloads
- Manages CORS configuration
- Returns JSON responses

**Layer 2: Session Management**
- Creates and retrieves session contexts
- Maintains conversation history per session
- Implements message history limits
- Provides session isolation

**Layer 3: Agent Logic (Strands SDK)**
- Interprets user intent using Nova Pro
- Orchestrates tool calls for data retrieval
- Generates contextually appropriate responses
- Maintains conversation flow

**Layer 4: Integration**
- Communicates with backend API
- Handles HTTP errors and retries
- Transforms API responses for agent consumption
- Implements timeout and circuit breaker patterns

### Deployment Model

The chatbot service deploys as an independent process:

```
┌──────────────────────────────────────┐
│  Server Instance                     │
│                                      │
│  ┌────────────────┐                 │
│  │ Node.js Backend│ (Port 5000)     │
│  │ + MySQL DB     │                 │
│  └────────────────┘                 │
│                                      │
│  ┌────────────────┐                 │
│  │ Python Chatbot │ (Port 8000)     │
│  │ Service        │                 │
│  └────────────────┘                 │
│                                      │
│  ┌────────────────┐                 │
│  │ React Frontend │ (Port 3000)     │
│  │ (Dev Server)   │                 │
│  └────────────────┘                 │
└──────────────────────────────────────┘
```

In production, Nginx can reverse proxy both services:
- `/api/chat` → Chatbot Service (Port 8000)
- `/api/products`, `/api/cart` → Backend (Port 5000)
- `/` → Frontend static files

## Components and Interfaces

### 1. HTTP Server Component

**Responsibility**: Expose HTTP endpoints for frontend communication

**Framework Choice**: FastAPI (recommended)
- Automatic request validation with Pydantic models
- Built-in async support for concurrent requests
- Auto-generated OpenAPI documentation
- Native CORS middleware

**Endpoints**:

```python
# POST /api/chat - Main chat endpoint
Request:
{
  "session_id": "uuid-string",
  "message": "What X-ray scanners do you have?"
}

Response (200 OK):
{
  "session_id": "uuid-string",
  "response": "We have several X-ray scanners available...",
  "timestamp": "2024-01-20T15:30:00Z"
}

Response (400 Bad Request):
{
  "error": "Invalid request",
  "details": "message field is required"
}

Response (500 Internal Server Error):
{
  "error": "Service error",
  "details": "Failed to generate response"
}

# GET /health - Health check endpoint
Response (200 OK):
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime_seconds": 3600,
  "nova_pro_status": "connected",
  "backend_api_status": "connected"
}

Response (503 Service Unavailable):
{
  "status": "unhealthy",
  "version": "1.0.0",
  "uptime_seconds": 3600,
  "nova_pro_status": "disconnected",
  "backend_api_status": "connected"
}

Response (200 OK - Degraded):
{
  "status": "degraded",
  "version": "1.0.0",
  "uptime_seconds": 3600,
  "nova_pro_status": "connected",
  "backend_api_status": "disconnected"
}
```

**CORS Configuration**:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend origin
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)
```

**Request Timeout**: 10 seconds maximum per request

### 2. Session Manager Component

**Responsibility**: Manage conversation contexts for multiple users

**Data Structure**:
```python
@dataclass
class Message:
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime

@dataclass
class Session:
    session_id: str
    messages: List[Message]
    created_at: datetime
    last_accessed: datetime

    def add_message(self, role: str, content: str):
        """Add message and enforce 100-message limit"""
        self.messages.append(Message(role, content, datetime.now()))
        if len(self.messages) > 100:
            self.messages = self.messages[-100:]
        self.last_accessed = datetime.now()

class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, Session] = {}

    def get_or_create_session(self, session_id: str) -> Session:
        """Retrieve existing session or create new one"""
        if session_id not in self.sessions:
            self.sessions[session_id] = Session(
                session_id=session_id,
                messages=[],
                created_at=datetime.now(),
                last_accessed=datetime.now()
            )
        return self.sessions[session_id]

    def cleanup_old_sessions(self, max_age_hours: int = 24):
        """Remove sessions older than max_age_hours"""
        cutoff = datetime.now() - timedelta(hours=max_age_hours)
        self.sessions = {
            sid: session for sid, session in self.sessions.items()
            if session.last_accessed > cutoff
        }
```

**Session Lifecycle**:
1. Frontend generates UUID for new conversations
2. First message creates session with empty history
3. Subsequent messages append to history
4. History limited to most recent 100 messages
5. Sessions expire after 24 hours of inactivity (cleanup task)

**Concurrency**: Thread-safe access using locks for session dictionary operations

### 3. Strands Agent Component

**Responsibility**: Natural language understanding and response generation

**Agent Configuration**:
```python
from strands import Agent, Tool
import boto3

# Initialize Bedrock client
bedrock = boto3.client(
    service_name='bedrock-runtime',
    region_name='us-east-1',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    aws_session_token=os.getenv('AWS_SESSION_TOKEN')  # Optional
)

# Create agent with Nova Pro
agent = Agent(
    model="amazon.nova-pro-v1:0",
    client=bedrock,
    system_prompt="""You are a helpful shopping assistant for Smiths Detection,
    a company specializing in detection equipment. Your role is to help customers
    find products, answer questions about features and specifications, and assist
    with cart management. Be professional, concise, and helpful.""",
    tools=[
        search_products_tool,
        get_product_details_tool,
        add_to_cart_tool,
        view_cart_tool,
        update_cart_tool,
        remove_from_cart_tool
    ]
)
```

**Tool Definitions**:

The agent has access to tools that wrap backend API calls:

```python
@tool
def search_products(query: str = None) -> dict:
    """
    Search for products in the catalog. If no query provided, returns all products.

    Args:
        query: Optional search term to filter products by description or part number

    Returns:
        List of products with id, part_number, description, and price
    """
    products = backend_client.get_products()
    if query:
        query_lower = query.lower()
        products = [
            p for p in products
            if query_lower in p['description'].lower()
            or query_lower in p['part_number'].lower()
        ]
    return {"products": products, "count": len(products)}

@tool
def get_product_details(product_id: int) -> dict:
    """
    Get detailed information about a specific product.

    Args:
        product_id: The unique identifier of the product

    Returns:
        Product details including id, part_number, description, price, created_at
    """
    return backend_client.get_product(product_id)

@tool
def add_to_cart(product_id: int, quantity: int = 1) -> dict:
    """
    Add a product to the shopping cart.

    Args:
        product_id: The unique identifier of the product to add
        quantity: Number of units to add (default: 1)

    Returns:
        Confirmation with cart item details
    """
    return backend_client.add_to_cart(product_id, quantity)

@tool
def view_cart() -> dict:
    """
    View current shopping cart contents.

    Returns:
        Cart items with product details, quantities, line totals, and cart total
    """
    return backend_client.get_cart()

@tool
def update_cart_item(cart_item_id: int, quantity: int) -> dict:
    """
    Update the quantity of an item in the cart.

    Args:
        cart_item_id: The cart item ID (not product ID)
        quantity: New quantity (0 to remove)

    Returns:
        Updated cart item details
    """
    return backend_client.update_cart_item(cart_item_id, quantity)

@tool
def remove_from_cart(cart_item_id: int) -> dict:
    """
    Remove an item from the shopping cart.

    Args:
        cart_item_id: The cart item ID to remove

    Returns:
        Confirmation of removal
    """
    return backend_client.remove_cart_item(cart_item_id)
```

**Intent Recognition**:

Nova Pro handles intent recognition through the agent's natural language understanding. The system prompt and tool descriptions guide the model to:

1. **Product Inquiry Intents**:
   - Search requests: "Show me X-ray scanners"
   - Comparison requests: "Compare these two detectors"
   - Recommendation requests: "What's best for airport security?"
   - Specification questions: "What's the price of SD-1000?"

2. **Cart Operation Intents**:
   - Add: "Add this to my cart", "I'll take two of these"
   - View: "What's in my cart?", "Show my cart"
   - Update: "Change quantity to 5", "I want 3 instead"
   - Remove: "Remove this item", "Delete from cart"

3. **General Assistance Intents**:
   - Greetings: "Hello", "Hi there"
   - Help: "What can you help me with?"
   - Clarification: "What do you mean?"
   - Farewell: "Thanks, goodbye"

**Response Generation**:

The agent generates responses by:
1. Analyzing user message in context of conversation history
2. Determining if tool calls are needed
3. Executing tool calls to fetch data
4. Synthesizing information into natural language response
5. Maintaining conversational tone and context

**Response Constraints**:
- Maximum 500 words per response
- Professional and helpful tone
- Specific product information when available
- Clear formatting for multiple products
- Clarifying questions when intent is ambiguous

### 4. Backend API Client Component

**Responsibility**: HTTP communication with Node.js backend

**Implementation**:
```python
import requests
from typing import Optional, Dict, List
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

class BackendAPIClient:
    def __init__(self, base_url: str, timeout: int = 5):
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout

        # Configure session with retry logic
        self.session = requests.Session()
        retry_strategy = Retry(
            total=1,  # Retry once
            backoff_factor=0.5,
            status_forcelist=[500, 502, 503, 504],
            allowed_methods=["GET", "POST", "PUT", "DELETE"]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

    def get_products(self) -> List[Dict]:
        """Fetch all products from catalog"""
        try:
            response = self.session.get(
                f"{self.base_url}/api/products",
                timeout=self.timeout
            )
            response.raise_for_status()
            data = response.json()
            return data.get('data', [])
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch products: {e}")
            raise BackendAPIError(f"Could not retrieve products: {str(e)}")

    def get_product(self, product_id: int) -> Dict:
        """Fetch specific product details"""
        try:
            response = self.session.get(
                f"{self.base_url}/api/products/{product_id}",
                timeout=self.timeout
            )
            response.raise_for_status()
            data = response.json()
            return data.get('data', {})
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                raise ProductNotFoundError(f"Product {product_id} not found")
            raise BackendAPIError(f"Could not retrieve product: {str(e)}")
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch product {product_id}: {e}")
            raise BackendAPIError(f"Could not retrieve product: {str(e)}")

    def get_cart(self) -> Dict:
        """Fetch current cart contents"""
        try:
            response = self.session.get(
                f"{self.base_url}/api/cart",
                timeout=self.timeout
            )
            response.raise_for_status()
            data = response.json()
            return data.get('data', {})
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch cart: {e}")
            raise BackendAPIError(f"Could not retrieve cart: {str(e)}")

    def add_to_cart(self, product_id: int, quantity: int) -> Dict:
        """Add item to cart"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/cart",
                json={"product_id": product_id, "quantity": quantity},
                timeout=self.timeout
            )
            response.raise_for_status()
            data = response.json()
            return data.get('data', {})
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                raise ProductNotFoundError(f"Product {product_id} not found")
            elif e.response.status_code == 400:
                error_data = e.response.json()
                raise InvalidRequestError(error_data.get('error', {}).get('message', 'Invalid request'))
            raise BackendAPIError(f"Could not add to cart: {str(e)}")
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to add to cart: {e}")
            raise BackendAPIError(f"Could not add to cart: {str(e)}")

    def update_cart_item(self, cart_item_id: int, quantity: int) -> Dict:
        """Update cart item quantity"""
        try:
            response = self.session.put(
                f"{self.base_url}/api/cart/{cart_item_id}",
                json={"quantity": quantity},
                timeout=self.timeout
            )
            response.raise_for_status()
            if response.status_code == 204:
                return {"message": "Item removed from cart"}
            data = response.json()
            return data.get('data', {})
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                raise CartItemNotFoundError(f"Cart item {cart_item_id} not found")
            raise BackendAPIError(f"Could not update cart: {str(e)}")
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to update cart item {cart_item_id}: {e}")
            raise BackendAPIError(f"Could not update cart: {str(e)}")

    def remove_cart_item(self, cart_item_id: int) -> Dict:
        """Remove item from cart"""
        try:
            response = self.session.delete(
                f"{self.base_url}/api/cart/{cart_item_id}",
                timeout=self.timeout
            )
            response.raise_for_status()
            return {"message": "Item removed from cart"}
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                raise CartItemNotFoundError(f"Cart item {cart_item_id} not found")
            raise BackendAPIError(f"Could not remove from cart: {str(e)}")
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to remove cart item {cart_item_id}: {e}")
            raise BackendAPIError(f"Could not remove from cart: {str(e)}")

    def health_check(self) -> bool:
        """Check if backend API is reachable"""
        try:
            response = self.session.get(
                f"{self.base_url}/api/products",
                timeout=2
            )
            return response.status_code == 200
        except:
            return False

class BackendAPIError(Exception):
    """Base exception for backend API errors"""
    pass

class ProductNotFoundError(BackendAPIError):
    """Product does not exist"""
    pass

class CartItemNotFoundError(BackendAPIError):
    """Cart item does not exist"""
    pass

class InvalidRequestError(BackendAPIError):
    """Invalid request parameters"""
    pass
```

**Error Handling Strategy**:
- Retry once on 5xx errors with 0.5s backoff
- Raise specific exceptions for 404 (not found) and 400 (bad request)
- Log all errors with context
- Propagate user-friendly error messages to agent

**Timeout Configuration**:
- Default: 5 seconds per request
- Health check: 2 seconds
- Configurable via environment variable

### 5. Configuration Component

**Responsibility**: Load and validate environment configuration

**Configuration Schema**:
```python
from pydantic import BaseSettings, validator
from typing import Optional

class Settings(BaseSettings):
    # AWS Credentials
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_session_token: Optional[str] = None
    aws_bearer_token_bedrock: Optional[str] = None
    aws_region: str = "us-east-1"

    # Backend API
    backend_api_url: str
    backend_api_timeout: int = 5

    # HTTP Server
    chatbot_port: int = 8000
    chatbot_host: str = "0.0.0.0"

    # Logging
    log_level: str = "INFO"

    # Service
    service_version: str = "1.0.0"
    max_response_words: int = 500
    session_max_age_hours: int = 24

    # CORS
    cors_origins: str = "http://localhost:3000"

    @validator('log_level')
    def validate_log_level(cls, v):
        valid_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        if v.upper() not in valid_levels:
            raise ValueError(f'log_level must be one of {valid_levels}')
        return v.upper()

    @validator('chatbot_port')
    def validate_port(cls, v):
        if not 1024 <= v <= 65535:
            raise ValueError('chatbot_port must be between 1024 and 65535')
        return v

    class Config:
        env_file = '.env'
        case_sensitive = False

def load_settings() -> Settings:
    """Load and validate settings from environment"""
    try:
        settings = Settings()
        return settings
    except Exception as e:
        logger.error(f"Configuration error: {e}")
        raise ConfigurationError(f"Failed to load configuration: {e}")
```

**Environment Variables**:

Required:
- `AWS_ACCESS_KEY_ID`: AWS access key for Bedrock authentication
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for Bedrock authentication
- `BACKEND_API_URL`: Base URL of Node.js backend (e.g., http://localhost:5000)

Optional:
- `AWS_SESSION_TOKEN`: AWS session token for temporary credentials
- `AWS_BEARER_TOKEN_BEDROCK`: Bearer token for alternative authentication
- `AWS_REGION`: AWS region for Bedrock (default: us-east-1)
- `CHATBOT_PORT`: Port for HTTP server (default: 8000)
- `CHATBOT_HOST`: Host binding (default: 0.0.0.0)
- `LOG_LEVEL`: Logging level (default: INFO)
- `BACKEND_API_TIMEOUT`: Timeout for backend calls in seconds (default: 5)
- `CORS_ORIGINS`: Allowed CORS origins (default: http://localhost:3000)
- `SESSION_MAX_AGE_HOURS`: Session expiration time (default: 24)

**Validation**:
- Check required variables at startup
- Validate port ranges and log levels
- Fail fast with descriptive error messages

### 6. Logging Component

**Responsibility**: Structured logging for observability

**Logger Configuration**:
```python
import logging
import json
from datetime import datetime

class StructuredLogger:
    def __init__(self, name: str, level: str = "INFO"):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(getattr(logging, level))

        # Console handler with JSON formatting
        handler = logging.StreamHandler()
        handler.setFormatter(JsonFormatter())
        self.logger.addHandler(handler)

    def log_request(self, method: str, path: str, session_id: str):
        """Log incoming HTTP request"""
        self.logger.info("HTTP request received", extra={
            "event_type": "http_request",
            "method": method,
            "path": path,
            "session_id": session_id
        })

    def log_backend_call(self, endpoint: str, status_code: int, response_time_ms: float):
        """Log backend API call"""
        self.logger.info("Backend API call", extra={
            "event_type": "backend_api_call",
            "endpoint": endpoint,
            "status_code": status_code,
            "response_time_ms": response_time_ms
        })

    def log_error(self, error_type: str, message: str, context: dict = None):
        """Log error with context"""
        self.logger.error(message, extra={
            "event_type": "error",
            "error_type": error_type,
            "context": context or {}
        })

    def log_nova_error(self, error: Exception, session_id: str):
        """Log Nova Pro API error"""
        self.logger.error("Nova Pro API error", extra={
            "event_type": "nova_error",
            "error": str(error),
            "session_id": session_id
        })

class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Add extra fields
        if hasattr(record, 'event_type'):
            log_data.update({
                k: v for k, v in record.__dict__.items()
                if k not in ['name', 'msg', 'args', 'created', 'filename',
                            'funcName', 'levelname', 'levelno', 'lineno',
                            'module', 'msecs', 'message', 'pathname',
                            'process', 'processName', 'relativeCreated',
                            'thread', 'threadName', 'exc_info', 'exc_text',
                            'stack_info']
            })

        return json.dumps(log_data)
```

**Logging Events**:
1. Service startup/shutdown
2. HTTP requests (method, path, session_id)
3. Backend API calls (endpoint, status, response time)
4. Nova Pro errors (error details, session_id)
5. Configuration errors
6. Session creation/cleanup
7. Tool executions

## Data Models

### Request/Response Models

```python
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime

class ChatRequest(BaseModel):
    session_id: str = Field(..., description="Unique session identifier (UUID)")
    message: str = Field(..., min_length=1, max_length=2000, description="User message")

    @validator('message')
    def validate_message(cls, v):
        if not v.strip():
            raise ValueError('message cannot be empty or whitespace only')
        return v.strip()

class ChatResponse(BaseModel):
    session_id: str
    response: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ErrorResponse(BaseModel):
    error: str
    details: Optional[str] = None

class HealthResponse(BaseModel):
    status: str  # "healthy", "degraded", "unhealthy"
    version: str
    uptime_seconds: int
    nova_pro_status: str  # "connected", "disconnected"
    backend_api_status: str  # "connected", "disconnected"
```

### Internal Models

```python
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional

@dataclass
class Message:
    """Single message in conversation"""
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime

@dataclass
class Session:
    """Conversation session"""
    session_id: str
    messages: List[Message]
    created_at: datetime
    last_accessed: datetime

@dataclass
class Product:
    """Product information from backend"""
    id: int
    part_number: str
    description: str
    price: float
    created_at: Optional[str] = None

@dataclass
class CartItem:
    """Cart item with product details"""
    id: int
    product_id: int
    quantity: int
    product: Product
    line_total: float
    created_at: str
    updated_at: str

@dataclass
class Cart:
    """Shopping cart"""
    items: List[CartItem]
    total: float
    item_count: int
```

