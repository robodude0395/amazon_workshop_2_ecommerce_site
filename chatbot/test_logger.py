"""
Tests for the structured logging component.

Tests verify JSON formatting, log levels, and specialized logging methods
for HTTP requests, backend calls, and errors.
"""

import pytest
import json
import logging
from io import StringIO
from logger import StructuredLogger, JsonFormatter


class TestJsonFormatter:
    """Tests for the JsonFormatter class."""

    def test_format_basic_log(self):
        """Test basic log formatting to JSON."""
        formatter = JsonFormatter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="test.py",
            lineno=1,
            msg="Test message",
            args=(),
            exc_info=None
        )

        result = formatter.format(record)
        log_data = json.loads(result)

        assert log_data["level"] == "INFO"
        assert log_data["logger"] == "test"
        assert log_data["message"] == "Test message"
        assert "timestamp" in log_data
        # Timestamp should be in ISO format with timezone
        assert "+" in log_data["timestamp"] or log_data["timestamp"].endswith("Z")

    def test_format_with_extra_fields(self):
        """Test formatting with extra context fields."""
        formatter = JsonFormatter()
        record = logging.LogRecord(
            name="test",
            level=logging.ERROR,
            pathname="test.py",
            lineno=1,
            msg="Error occurred",
            args=(),
            exc_info=None
        )
        record.event_type = "error"
        record.error_type = "ValueError"
        record.context = {"user_id": 123}

        result = formatter.format(record)
        log_data = json.loads(result)

        assert log_data["event_type"] == "error"
        assert log_data["error_type"] == "ValueError"
        assert log_data["context"] == {"user_id": 123}

    def test_format_with_exception(self):
        """Test formatting with exception information."""
        formatter = JsonFormatter()

        try:
            raise ValueError("Test exception")
        except ValueError:
            import sys
            exc_info = sys.exc_info()

            record = logging.LogRecord(
                name="test",
                level=logging.ERROR,
                pathname="test.py",
                lineno=1,
                msg="Exception occurred",
                args=(),
                exc_info=exc_info
            )

            result = formatter.format(record)
            log_data = json.loads(result)

            assert "exception" in log_data
            assert "ValueError: Test exception" in log_data["exception"]


class TestStructuredLogger:
    """Tests for the StructuredLogger class."""

    def setup_method(self):
        """Set up test fixtures."""
        # Create a logger with a string buffer to capture output
        self.log_stream = StringIO()
        self.logger = StructuredLogger(name="test_logger", level="DEBUG")

        # Replace the handler with one that writes to our buffer
        handler = logging.StreamHandler(self.log_stream)
        handler.setFormatter(JsonFormatter())
        self.logger.logger.handlers = [handler]

    def get_last_log(self):
        """Get the last log entry as a parsed JSON object."""
        logs = self.log_stream.getvalue().strip().split('\n')
        if logs and logs[-1]:
            return json.loads(logs[-1])
        return None

    def test_initialization_with_default_level(self):
        """Test logger initialization with default INFO level."""
        logger = StructuredLogger()
        assert logger.logger.level == logging.INFO

    def test_initialization_with_custom_level(self):
        """Test logger initialization with custom log level."""
        logger = StructuredLogger(level="DEBUG")
        assert logger.logger.level == logging.DEBUG

        logger = StructuredLogger(level="ERROR")
        assert logger.logger.level == logging.ERROR

    def test_log_request(self):
        """Test logging HTTP requests (Requirement 8.2)."""
        self.logger.log_request(
            method="POST",
            path="/api/chat",
            session_id="test-session-123"
        )

        log_data = self.get_last_log()
        assert log_data is not None
        assert log_data["level"] == "INFO"
        assert log_data["message"] == "HTTP request received"
        assert log_data["event_type"] == "http_request"
        assert log_data["method"] == "POST"
        assert log_data["path"] == "/api/chat"
        assert log_data["session_id"] == "test-session-123"

    def test_log_backend_call(self):
        """Test logging backend API calls (Requirement 8.3)."""
        self.logger.log_backend_call(
            endpoint="/api/products",
            status_code=200,
            response_time_ms=45.5
        )

        log_data = self.get_last_log()
        assert log_data is not None
        assert log_data["level"] == "INFO"
        assert log_data["message"] == "Backend API call"
        assert log_data["event_type"] == "backend_api_call"
        assert log_data["endpoint"] == "/api/products"
        assert log_data["status_code"] == 200
        assert log_data["response_time_ms"] == 45.5

    def test_log_error(self):
        """Test logging errors with context (Requirement 8.1)."""
        self.logger.log_error(
            error_type="ValidationError",
            message="Invalid input provided",
            context={"field": "message", "value": ""}
        )

        log_data = self.get_last_log()
        assert log_data is not None
        assert log_data["level"] == "ERROR"
        assert log_data["message"] == "Invalid input provided"
        assert log_data["event_type"] == "error"
        assert log_data["error_type"] == "ValidationError"
        assert log_data["context"]["field"] == "message"
        assert log_data["context"]["value"] == ""

    def test_log_error_without_context(self):
        """Test logging errors without context."""
        self.logger.log_error(
            error_type="RuntimeError",
            message="Something went wrong"
        )

        log_data = self.get_last_log()
        assert log_data is not None
        assert log_data["level"] == "ERROR"
        assert log_data["error_type"] == "RuntimeError"
        assert log_data["context"] == {}

    def test_log_nova_error(self):
        """Test logging Nova Pro errors (Requirement 8.4)."""
        error = ValueError("Invalid model configuration")
        self.logger.log_nova_error(
            error=error,
            session_id="session-456"
        )

        log_data = self.get_last_log()
        assert log_data is not None
        assert log_data["level"] == "ERROR"
        assert log_data["message"] == "Nova Pro API error"
        assert log_data["event_type"] == "nova_error"
        assert log_data["error"] == "Invalid model configuration"
        assert log_data["error_type"] == "ValueError"
        assert log_data["session_id"] == "session-456"

    def test_info_method(self):
        """Test generic info logging."""
        self.logger.info("Service started", port=8000, version="1.0.0")

        log_data = self.get_last_log()
        assert log_data is not None
        assert log_data["level"] == "INFO"
        assert log_data["message"] == "Service started"
        assert log_data["port"] == 8000
        assert log_data["version"] == "1.0.0"

    def test_debug_method(self):
        """Test debug logging."""
        self.logger.debug("Debug information", detail="test")

        log_data = self.get_last_log()
        assert log_data is not None
        assert log_data["level"] == "DEBUG"
        assert log_data["message"] == "Debug information"
        assert log_data["detail"] == "test"

    def test_warning_method(self):
        """Test warning logging."""
        self.logger.warning("Warning message", reason="test")

        log_data = self.get_last_log()
        assert log_data is not None
        assert log_data["level"] == "WARNING"
        assert log_data["message"] == "Warning message"
        assert log_data["reason"] == "test"

    def test_error_method(self):
        """Test generic error logging."""
        self.logger.error("Error message", code=500)

        log_data = self.get_last_log()
        assert log_data is not None
        assert log_data["level"] == "ERROR"
        assert log_data["message"] == "Error message"
        assert log_data["code"] == 500

    def test_critical_method(self):
        """Test critical logging."""
        self.logger.critical("Critical failure", system="database")

        log_data = self.get_last_log()
        assert log_data is not None
        assert log_data["level"] == "CRITICAL"
        assert log_data["message"] == "Critical failure"
        assert log_data["system"] == "database"

    def test_timestamp_format(self):
        """Test that timestamps are in ISO format with timezone."""
        self.logger.info("Test message")

        log_data = self.get_last_log()
        assert log_data is not None
        assert "timestamp" in log_data

        # Verify it's a valid ISO format timestamp
        from datetime import datetime
        timestamp_str = log_data["timestamp"]
        # Should be able to parse as ISO format
        datetime.fromisoformat(timestamp_str)  # Should not raise

    def test_log_level_filtering(self):
        """Test that log level filtering works (Requirement 8.5)."""
        # Create logger with WARNING level
        logger = StructuredLogger(name="test_filter", level="WARNING")
        log_stream = StringIO()
        handler = logging.StreamHandler(log_stream)
        handler.setFormatter(JsonFormatter())
        logger.logger.handlers = [handler]

        # These should not be logged
        logger.debug("Debug message")
        logger.info("Info message")

        # These should be logged
        logger.warning("Warning message")
        logger.error("Error message")

        logs = log_stream.getvalue().strip().split('\n')
        logs = [log for log in logs if log]  # Filter empty strings

        assert len(logs) == 2
        assert "Warning message" in logs[0]
        assert "Error message" in logs[1]

    def test_no_duplicate_logs(self):
        """Test that logger doesn't propagate to root logger."""
        logger = StructuredLogger(name="test_no_dup")
        assert logger.logger.propagate is False

    def test_json_output_is_valid(self):
        """Test that all log output is valid JSON."""
        self.logger.info("Test 1")
        self.logger.log_request("GET", "/health", "session-1")
        self.logger.log_backend_call("/api/products", 200, 50.0)
        self.logger.log_error("TestError", "Test error")

        logs = self.log_stream.getvalue().strip().split('\n')
        for log_line in logs:
            if log_line:
                # Should not raise JSONDecodeError
                json.loads(log_line)
