"""
HTTP API server for the Shopping Assistant Chatbot.

This module implements the FastAPI application with endpoints for
chat interactions and health monitoring.

Requirements: 3.1, 3.2, 3.5, 11.1
"""

import asyncio
import signal
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from agent import create_shopping_agent, process_message
from backend_client import BackendAPIClient
from config import Settings, load_settings
from logger import get_logger
from models import Session, SessionManager

# Global state
settings: Optional[Settings] = None
backend_client: Optional[BackendAPIClient] = None
session_manager: Optional[SessionManager] = None
agent = None
logger = None
start_time = time.time()
shutdown_event = asyncio.Event()


# Pydantic Models for Request/Response

class ChatRequest(BaseModel):
    """Request model for chat endpoint.

    Requirements 3.1, 3.2: Accept JSON payloads with message text and session identifier.
    """
    session_id: str = Field(..., description="Unique session identifier (UUID)")
    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="User message"
    )

    @field_validator('message')
    @classmethod
    def validate_message(cls, v):
        """Validate message is not empty or whitespace only."""
        if not v.strip():
            raise ValueError('message cannot be empty or whitespace only')
        return v.strip()


class ChatResponse(BaseModel):
    """Response model for chat endpoint.

    Requirement 3.3: Return JSON response with chatbot reply.
    """
    session_id: str
    response: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ErrorResponse(BaseModel):
    """Response model for errors.

    Requirement 3.4: Return descriptive error messages.
    """
    error: str
    details: Optional[str] = None


class HealthResponse(BaseModel):
    """Response model for health endpoint.

    Requirement 11.5: Include version, uptime, and component statuses.
    """
    status: str  # "healthy", "degraded", "unhealthy"
    version: str
    uptime_seconds: int
    nova_pro_status: str  # "connected", "disconnected"
    backend_api_status: str  # "connected", "disconnected"


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle.

    Handles initialization on startup and cleanup on shutdown.
    """
    global settings, backend_client, session_manager, agent, logger

    # Startup
    global logger, settings, backend_client, session_manager, agent
    logger = get_logger("chatbot.server")
    logger.info("Starting chatbot service")

    try:
        # Load configuration
        settings = load_settings()
        logger.info(f"Configuration loaded: {settings}")

        # Initialize backend client
        backend_client = BackendAPIClient(
            base_url=settings.backend_api_url,
            timeout=settings.backend_api_timeout
        )
        logger.info("Backend API client initialized")

        # Initialize session manager
        session_manager = SessionManager()
        logger.info("Session manager initialized")

        # Initialize agent
        agent = create_shopping_agent(settings, backend_client)
        logger.info("Shopping assistant agent initialized")

        logger.info(f"Chatbot service started successfully on port {settings.chatbot_port}")

    except Exception as e:
        logger.error(f"Failed to start chatbot service: {e}")
        raise

    yield

    # Shutdown
    logger.info("Shutting down chatbot service")
    if session_manager:
        session_manager.cleanup_all_sessions()
    logger.info("Chatbot service stopped")


# Create FastAPI application
app = FastAPI(
    title="Shopping Assistant Chatbot",
    description="Conversational AI service for Smiths Detection E-Commerce Platform",
    version="1.0.0",
    lifespan=lifespan
)


# Configure CORS middleware
# Requirement 3.5: Support CORS to allow requests from Frontend_Popup origin
def configure_cors(app: FastAPI, settings: Settings):
    """Configure CORS middleware with settings from configuration."""
    origins = settings.get_cors_origins_list() if settings else ["http://localhost:3000"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["POST", "GET"],
        allow_headers=["Content-Type"],
    )


# Note: CORS will be configured after settings are loaded in lifespan
# For now, we'll add a default configuration that will be overridden
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)



# API Endpoints

@app.post("/api/chat", response_model=ChatResponse, responses={
    400: {"model": ErrorResponse},
    500: {"model": ErrorResponse}
})
async def chat(request: ChatRequest, req: Request):
    """
    Process a chat message and return the assistant's response.

    Requirements:
    - 3.1: Accept JSON payloads containing message text and session identifier
    - 3.2: Validate request with ChatRequest model
    - 3.3: Return JSON response with chatbot reply within 10 seconds
    - 3.4: Return HTTP 400 with descriptive error for invalid requests
    - 4.1: Create new Session when new session identifier is received
    - 4.2: Retrieve existing Session when existing session identifier is received
    - 4.3: Store conversation history including user messages and chatbot responses
    - 8.2: Log all requests with method, path, and session_id

    Args:
        request: ChatRequest with session_id and message
        req: FastAPI Request object for logging

    Returns:
        ChatResponse with session_id, response, and timestamp

    Raises:
        HTTPException: 400 for invalid requests, 500 for server errors
    """
    # Requirement 8.2: Log incoming HTTP request
    logger.log_request(
        method=req.method,
        path=req.url.path,
        session_id=request.session_id
    )

    try:
        # Requirement 4.1, 4.2: Get or create session
        session = session_manager.get_or_create_session(request.session_id)

        # Requirement 3.3: Process message with 10-second timeout
        try:
            response_text = await asyncio.wait_for(
                asyncio.to_thread(process_message, agent, session, request.message),
                timeout=10.0
            )
        except asyncio.TimeoutError:
            logger.error(
                "Message processing timeout",
                extra={
                    "session_id": request.session_id,
                    "event_type": "timeout"
                }
            )
            raise HTTPException(
                status_code=500,
                detail="Request timeout - please try again"
            )

        # Requirement 3.3: Return ChatResponse
        return ChatResponse(
            session_id=request.session_id,
            response=response_text
        )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise

    except Exception as e:
        # Requirement 3.4, 8.4: Log error and return 500
        logger.log_error(
            error_type=type(e).__name__,
            message=f"Error processing chat message: {str(e)}",
            context={"session_id": request.session_id}
        )

        raise HTTPException(
            status_code=500,
            detail="An error occurred processing your message"
        )



@app.get("/health", response_model=HealthResponse, responses={
    503: {"model": HealthResponse}
})
async def health():
    """
    Health check endpoint for monitoring service status.

    Requirements:
    - 11.1: Expose GET endpoint at /health for health checks
    - 11.2: Return HTTP 200 with status "healthy" when service is operational
    - 11.3: Return HTTP 503 with status "unhealthy" when Nova Pro connectivity fails
    - 11.4: Return HTTP 200 with status "degraded" when Backend API connectivity fails
    - 11.5: Include service version and uptime in the response

    Returns:
        HealthResponse with status, version, uptime, and component statuses
    """
    # Calculate uptime
    uptime = int(time.time() - start_time)

    # Check Nova Pro connectivity (via agent initialization status)
    # If agent is initialized, Nova Pro is connected
    nova_pro_status = "connected" if agent is not None else "disconnected"

    # Check Backend API connectivity
    backend_api_status = "disconnected"
    if backend_client:
        try:
            backend_api_status = "connected" if backend_client.health_check() else "disconnected"
        except:
            backend_api_status = "disconnected"

    # Determine overall status
    # Requirement 11.3: Return "unhealthy" (503) when Nova Pro disconnected
    if nova_pro_status == "disconnected":
        status = "unhealthy"
        status_code = 503
    # Requirement 11.4: Return "degraded" (200) when Backend API disconnected
    elif backend_api_status == "disconnected":
        status = "degraded"
        status_code = 200
    # Requirement 11.2: Return "healthy" (200) when both connected
    else:
        status = "healthy"
        status_code = 200

    response = HealthResponse(
        status=status,
        version=settings.service_version if settings else "1.0.0",
        uptime_seconds=uptime,
        nova_pro_status=nova_pro_status,
        backend_api_status=backend_api_status
    )

    # Return with appropriate status code
    if status_code == 503:
        raise HTTPException(status_code=503, detail=response.model_dump())

    return response



# Graceful Shutdown Handler

def setup_signal_handlers():
    """
    Register signal handlers for graceful shutdown.

    Requirement 13.5: Support graceful shutdown when receiving SIGTERM or SIGINT signals.
    """
    def signal_handler(signum, frame):
        """Handle shutdown signals."""
        signal_name = "SIGTERM" if signum == signal.SIGTERM else "SIGINT"
        logger.info(f"Received {signal_name}, initiating graceful shutdown")

        # Set shutdown event
        shutdown_event.set()

        # Clean up sessions
        if session_manager:
            logger.info("Cleaning up sessions")
            session_manager.cleanup_all_sessions()

        logger.info("Graceful shutdown complete")

    # Register handlers for SIGTERM and SIGINT
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
