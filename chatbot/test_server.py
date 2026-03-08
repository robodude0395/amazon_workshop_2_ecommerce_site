"""
Tests for the HTTP API server.

This module tests the FastAPI endpoints and server functionality.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

from server import app, ChatRequest, ChatResponse, HealthResponse


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def mock_components():
    """Mock the global components used by the server."""
    with patch('server.settings') as mock_settings, \
         patch('server.backend_client') as mock_backend, \
         patch('server.session_manager') as mock_session_mgr, \
         patch('server.agent') as mock_agent, \
         patch('server.logger') as mock_logger:

        # Configure mock settings
        mock_settings.service_version = "1.0.0"
        mock_settings.backend_api_url = "http://localhost:5000"
        mock_settings.chatbot_port = 8000

        yield {
            'settings': mock_settings,
            'backend_client': mock_backend,
            'session_manager': mock_session_mgr,
            'agent': mock_agent,
            'logger': mock_logger
        }


class TestChatRequest:
    """Tests for ChatRequest model validation."""

    def test_valid_chat_request(self):
        """Test that valid chat request is accepted."""
        request = ChatRequest(
            session_id="test-session-123",
            message="Hello, what products do you have?"
        )
        assert request.session_id == "test-session-123"
        assert request.message == "Hello, what products do you have?"

    def test_empty_message_rejected(self):
        """Test that empty message is rejected."""
        with pytest.raises(ValueError):
            ChatRequest(
                session_id="test-session-123",
                message=""
            )

    def test_whitespace_only_message_rejected(self):
        """Test that whitespace-only message is rejected."""
        with pytest.raises(ValueError):
            ChatRequest(
                session_id="test-session-123",
                message="   "
            )

    def test_message_trimmed(self):
        """Test that message is trimmed of whitespace."""
        request = ChatRequest(
            session_id="test-session-123",
            message="  Hello  "
        )
        assert request.message == "Hello"


class TestHealthEndpoint:
    """Tests for the /health endpoint."""

    def test_health_endpoint_exists(self, client):
        """Test that health endpoint is accessible."""
        response = client.get("/health")
        # Should return some response (may be error if components not initialized)
        assert response.status_code in [200, 503]

    def test_health_response_structure(self, client, mock_components):
        """Test that health response has correct structure."""
        # Mock backend health check
        mock_components['backend_client'].health_check.return_value = True

        response = client.get("/health")
        data = response.json()

        # Check response structure
        assert 'status' in data
        assert 'version' in data
        assert 'uptime_seconds' in data
        assert 'nova_pro_status' in data
        assert 'backend_api_status' in data

    def test_health_healthy_when_all_connected(self, client, mock_components):
        """Test that status is 'healthy' when all components are connected."""
        # Mock all components as healthy
        mock_components['backend_client'].health_check.return_value = True

        response = client.get("/health")
        data = response.json()

        assert response.status_code == 200
        assert data['status'] == 'healthy'
        assert data['nova_pro_status'] == 'connected'
        assert data['backend_api_status'] == 'connected'

    def test_health_degraded_when_backend_disconnected(self, client, mock_components):
        """Test that status is 'degraded' when backend is disconnected."""
        # Mock backend as unhealthy
        mock_components['backend_client'].health_check.return_value = False

        response = client.get("/health")
        data = response.json()

        assert response.status_code == 200
        assert data['status'] == 'degraded'
        assert data['backend_api_status'] == 'disconnected'

    def test_health_unhealthy_when_nova_disconnected(self, client, mock_components):
        """Test that status is 'unhealthy' when Nova Pro is disconnected."""
        # Mock agent as None (not initialized)
        with patch('server.agent', None):
            mock_components['backend_client'].health_check.return_value = True

            response = client.get("/health")

            assert response.status_code == 503
            # FastAPI returns detail in the response for 503
            assert 'detail' in response.json()


class TestChatEndpoint:
    """Tests for the /api/chat endpoint."""

    def test_chat_endpoint_exists(self, client, mock_components):
        """Test that chat endpoint is accessible."""
        response = client.post("/api/chat", json={
            "session_id": "test-123",
            "message": "Hello"
        })
        # Should return some response (may be error if components not initialized)
        assert response.status_code in [200, 400, 500]

    def test_chat_requires_session_id(self, client):
        """Test that session_id is required."""
        response = client.post("/api/chat", json={
            "message": "Hello"
        })
        assert response.status_code == 422  # Validation error

    def test_chat_requires_message(self, client):
        """Test that message is required."""
        response = client.post("/api/chat", json={
            "session_id": "test-123"
        })
        assert response.status_code == 422  # Validation error

    def test_chat_rejects_empty_message(self, client):
        """Test that empty message is rejected."""
        response = client.post("/api/chat", json={
            "session_id": "test-123",
            "message": ""
        })
        assert response.status_code == 422  # Validation error

    @patch('server.process_message')
    def test_chat_success_response(self, mock_process, client, mock_components):
        """Test successful chat response."""
        # Mock session manager
        mock_session = Mock()
        mock_components['session_manager'].get_or_create_session.return_value = mock_session

        # Mock process_message to return a response
        mock_process.return_value = "I can help you find detection equipment!"

        response = client.post("/api/chat", json={
            "session_id": "test-123",
            "message": "What products do you have?"
        })

        assert response.status_code == 200
        data = response.json()

        assert data['session_id'] == "test-123"
        assert data['response'] == "I can help you find detection equipment!"
        assert 'timestamp' in data

    @patch('server.process_message')
    def test_chat_logs_request(self, mock_process, client, mock_components):
        """Test that chat endpoint logs requests."""
        mock_session = Mock()
        mock_components['session_manager'].get_or_create_session.return_value = mock_session
        mock_process.return_value = "Response"

        client.post("/api/chat", json={
            "session_id": "test-123",
            "message": "Hello"
        })

        # Verify logger was called
        mock_components['logger'].log_request.assert_called_once()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
