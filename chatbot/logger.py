"""
Structured logging component for the Shopping Assistant Chatbot service.

This module provides JSON-formatted logging for observability, including:
- HTTP request logging
- Backend API call logging
- Error logging with context
- Nova Pro error logging

Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
"""

import logging
import json
from datetime import datetime
from typing import Optional, Dict, Any


class JsonFormatter(logging.Formatter):
    """
    Custom JSON formatter for structured log output.

    Formats log records as JSON objects with timestamp, level, logger name,
    message, and any additional context fields.
    """

    def format(self, record: logging.LogRecord) -> str:
        """
        Format a log record as a JSON string.

        Args:
            record: The log record to format

        Returns:
            JSON-formatted log string
        """
        from datetime import timezone
        log_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Add extra fields from the record
        # These are fields added via the 'extra' parameter in logging calls
        # Extract all custom fields (those not part of standard LogRecord)
        standard_fields = {
            'name', 'msg', 'args', 'created', 'filename', 'funcName',
            'levelname', 'levelno', 'lineno', 'module', 'msecs',
            'message', 'pathname', 'process', 'processName',
            'relativeCreated', 'thread', 'threadName', 'exc_info',
            'exc_text', 'stack_info', 'getMessage', 'asctime'
        }

        for key, value in record.__dict__.items():
            if key not in standard_fields:
                log_data[key] = value

        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)

        return json.dumps(log_data)


class StructuredLogger:
    """
    Structured logger with JSON output for observability.

    Provides methods for logging different types of events with structured
    context information. All logs are output in JSON format for easy parsing
    by log aggregation systems.

    Requirements:
    - 8.1: Log errors with timestamp, error type, and context
    - 8.2: Log all incoming HTTP requests
    - 8.3: Log all Backend API calls
    - 8.4: Log Nova Pro API call failures
    - 8.5: Support configurable log levels
    """

    def __init__(self, name: str = "chatbot", level: str = "INFO"):
        """
        Initialize the structured logger.

        Args:
            name: Logger name (default: "chatbot")
            level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)

        Requirement 8.5: Support configurable log levels through environment variable
        """
        self.logger = logging.getLogger(name)
        self.logger.setLevel(getattr(logging, level.upper()))

        # Remove any existing handlers to avoid duplicates
        self.logger.handlers.clear()

        # Console handler with JSON formatting
        handler = logging.StreamHandler()
        handler.setFormatter(JsonFormatter())
        self.logger.addHandler(handler)

        # Prevent propagation to root logger to avoid duplicate logs
        self.logger.propagate = False

    def log_request(self, method: str, path: str, session_id: str) -> None:
        """
        Log an incoming HTTP request.

        Requirement 8.2: Log all incoming HTTP requests with method, path,
        and session identifier.

        Args:
            method: HTTP method (GET, POST, etc.)
            path: Request path
            session_id: Session identifier from the request
        """
        self.logger.info(
            "HTTP request received",
            extra={
                "event_type": "http_request",
                "method": method,
                "path": path,
                "session_id": session_id
            }
        )

    def log_backend_call(
        self,
        endpoint: str,
        status_code: int,
        response_time_ms: float
    ) -> None:
        """
        Log a backend API call.

        Requirement 8.3: Log all Backend API calls with endpoint, status code,
        and response time.

        Args:
            endpoint: Backend API endpoint called
            status_code: HTTP status code returned
            response_time_ms: Response time in milliseconds
        """
        self.logger.info(
            "Backend API call",
            extra={
                "event_type": "backend_api_call",
                "endpoint": endpoint,
                "status_code": status_code,
                "response_time_ms": response_time_ms
            }
        )

    def log_error(
        self,
        error_type: str,
        message: str,
        context: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Log an error with context information.

        Requirement 8.1: When an error occurs, log the error with timestamp,
        error type, and context information.

        Args:
            error_type: Type/category of the error
            message: Error message
            context: Additional context information (optional)
        """
        self.logger.error(
            message,
            extra={
                "event_type": "error",
                "error_type": error_type,
                "context": context or {}
            }
        )

    def log_nova_error(self, error: Exception, session_id: str) -> None:
        """
        Log a Nova Pro API error.

        Requirement 8.4: When Nova Pro API calls fail, log the error details
        and return a user-friendly message.

        Args:
            error: The exception that occurred
            session_id: Session identifier for context
        """
        self.logger.error(
            "Nova Pro API error",
            extra={
                "event_type": "nova_error",
                "error": str(error),
                "error_type": type(error).__name__,
                "session_id": session_id
            }
        )

    def info(self, message: str, **kwargs) -> None:
        """
        Log an info-level message with optional context.

        Args:
            message: Log message
            **kwargs: Additional context fields
        """
        if kwargs:
            self.logger.info(message, extra=kwargs)
        else:
            self.logger.info(message)

    def debug(self, message: str, **kwargs) -> None:
        """
        Log a debug-level message with optional context.

        Args:
            message: Log message
            **kwargs: Additional context fields
        """
        if kwargs:
            self.logger.debug(message, extra=kwargs)
        else:
            self.logger.debug(message)

    def warning(self, message: str, **kwargs) -> None:
        """
        Log a warning-level message with optional context.

        Args:
            message: Log message
            **kwargs: Additional context fields
        """
        if kwargs:
            self.logger.warning(message, extra=kwargs)
        else:
            self.logger.warning(message)

    def error(self, message: str, **kwargs) -> None:
        """
        Log an error-level message with optional context.

        Args:
            message: Log message
            **kwargs: Additional context fields
        """
        if kwargs:
            self.logger.error(message, extra=kwargs)
        else:
            self.logger.error(message)

    def critical(self, message: str, **kwargs) -> None:
        """
        Log a critical-level message with optional context.

        Args:
            message: Log message
            **kwargs: Additional context fields
        """
        if kwargs:
            self.logger.critical(message, extra=kwargs)
        else:
            self.logger.critical(message)


# Global logger instance cache
_loggers = {}


def get_logger(name: str = "chatbot", level: str = "INFO") -> StructuredLogger:
    """
    Get or create a StructuredLogger instance.

    This function maintains a cache of logger instances to avoid creating
    duplicate loggers for the same name.

    Args:
        name: Logger name (default: "chatbot")
        level: Log level (default: "INFO")

    Returns:
        StructuredLogger instance
    """
    if name not in _loggers:
        _loggers[name] = StructuredLogger(name=name, level=level)
    return _loggers[name]
