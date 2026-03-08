"""
Unit tests for the agent module.

Tests verify AWS Bedrock client initialization, Strands agent creation,
tool functions, and message processing with mocked dependencies.
"""

import pytest
import sys
from unittest.mock import Mock, patch, MagicMock, call
from datetime import datetime

# Mock the strands module before importing agent
# Create a mock tool decorator that just returns the function unchanged
def mock_tool_decorator(func):
    """Mock tool decorator that returns the function unchanged for testing."""
    return func

mock_strands = MagicMock()
mock_strands.tool = mock_tool_decorator
sys.modules['strands'] = mock_strands
sys.modules['strands.models'] = MagicMock()
sys.modules['boto3'] = MagicMock()

from agent import (
    initialize_bedrock_client,
    create_shopping_agent,
    create_search_products_tool,
    create_get_product_details_tool,
    create_add_to_cart_tool,
    create_view_cart_tool,
    create_update_cart_tool,
    create_remove_from_cart_tool,
    process_message
)
from backend_client import (
    BackendAPIClient,
    BackendAPIError,
    ProductNotFoundError,
    CartItemNotFoundError,
    InvalidRequestError
)
from config import Settings
from models import Session, Message


class TestInitializeBedrockClient:
    """Tests for initialize_bedrock_client function."""

    @patch('agent.boto3.client')
    def test_initialize_with_access_keys(self, mock_boto_client):
        """Test Bedrock client initialization with access key authentication (Requirement 1)."""
        mock_client = Mock()
        mock_boto_client.return_value = mock_client

        settings = Mock(spec=Settings)
        settings.aws_region = 'us-east-1'
        settings.aws_access_key_id = 'test_access_key'
        settings.aws_secret_access_key = 'test_secret_key'
        settings.aws_session_token = None
        settings.aws_bearer_token_bedrock = None

        result = initialize_bedrock_client(settings)

        # Verify boto3.client was called with correct parameters
        mock_boto_client.assert_called_once_with(
            service_name='bedrock-runtime',
            region_name='us-east-1',
            aws_access_key_id='test_access_key',
            aws_secret_access_key='test_secret_key'
        )

        # Verify the client was returned
        assert result == mock_client

    @patch('agent.boto3.client')
    def test_initialize_with_access_keys_and_session_token(self, mock_boto_client):
        """Test Bedrock client initialization with session token."""
        mock_client = Mock()
        mock_boto_client.return_value = mock_client

        settings = Mock(spec=Settings)
        settings.aws_region = 'us-west-2'
        settings.aws_access_key_id = 'test_access_key'
        settings.aws_secret_access_key = 'test_secret_key'
        settings.aws_session_token = 'test_session_token'
        settings.aws_bearer_token_bedrock = None

        result = initialize_bedrock_client(settings)

        # Verify boto3.client was called with session token
        mock_boto_client.assert_called_once_with(
            service_name='bedrock-runtime',
            region_name='us-west-2',
            aws_access_key_id='test_access_key',
            aws_secret_access_key='test_secret_key',
            aws_session_token='test_session_token'
        )

        assert result == mock_client

    @patch('agent.boto3.client')
    def test_initialize_with_bearer_token(self, mock_boto_client):
        """Test Bedrock client initialization with bearer token authentication."""
        mock_client = Mock()
        mock_boto_client.return_value = mock_client

        settings = Mock(spec=Settings)
        settings.aws_region = 'us-east-1'
        settings.aws_bearer_token_bedrock = 'test_bearer_token'
        settings.aws_access_key_id = None
        settings.aws_secret_access_key = None
        settings.aws_session_token = None

        result = initialize_bedrock_client(settings)

        # Verify boto3.client was called with bearer token
        mock_boto_client.assert_called_once_with(
            service_name='bedrock-runtime',
            region_name='us-east-1',
            aws_access_key_id='BEARER_TOKEN',
            aws_secret_access_key='test_bearer_token'
        )

        assert result == mock_client

    @patch('agent.boto3.client')
    def test_initialize_authentication_failure(self, mock_boto_client):
        """Test Bedrock client initialization handles authentication failures."""
        mock_boto_client.side_effect = Exception("Invalid credentials")

        settings = Mock(spec=Settings)
        settings.aws_region = 'us-east-1'
        settings.aws_access_key_id = 'invalid_key'
        settings.aws_secret_access_key = 'invalid_secret'
        settings.aws_session_token = None
        settings.aws_bearer_token_bedrock = None

        with pytest.raises(Exception) as exc_info:
            initialize_bedrock_client(settings)

        assert "Invalid credentials" in str(exc_info.value)

    @patch('agent.boto3.client')
    def test_initialize_with_different_regions(self, mock_boto_client):
        """Test Bedrock client initialization with various AWS regions."""
        mock_client = Mock()
        mock_boto_client.return_value = mock_client

        regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1']

        for region in regions:
            mock_boto_client.reset_mock()

            settings = Mock(spec=Settings)
            settings.aws_region = region
            settings.aws_access_key_id = 'test_key'
            settings.aws_secret_access_key = 'test_secret'
            settings.aws_session_token = None
            settings.aws_bearer_token_bedrock = None

            initialize_bedrock_client(settings)

            call_args = mock_boto_client.call_args[1]
            assert call_args['region_name'] == region


class TestCreateShoppingAgent:
    """Tests for create_shopping_agent function."""

    @patch('agent.Agent')
    @patch('agent.BedrockModel')
    def test_create_agent_success(self, mock_bedrock_model, mock_agent_class):
        """Test successful agent creation (Requirement 2)."""
        mock_model = Mock()
        mock_bedrock_model.return_value = mock_model
        mock_agent = Mock()
        mock_agent_class.return_value = mock_agent

        settings = Mock(spec=Settings)
        settings.aws_region = 'us-east-1'

        backend_client = Mock(spec=BackendAPIClient)

        result = create_shopping_agent(settings, backend_client)

        # Verify BedrockModel was initialized with correct parameters
        mock_bedrock_model.assert_called_once_with(
            model_id="us.amazon.nova-pro-v1:0",
            region_name='us-east-1',
            temperature=0.7,
            max_tokens=2048
        )

        # Verify Agent was created
        mock_agent_class.assert_called_once()
        call_args = mock_agent_class.call_args[1]
        assert call_args['model'] == mock_model
        assert len(call_args['tools']) == 6  # 6 tools
        assert 'system_prompt' in call_args

        # Verify the agent was returned
        assert result == mock_agent

    @patch('agent.Agent')
    @patch('agent.BedrockModel')
    def test_create_agent_initialization_failure(self, mock_bedrock_model, mock_agent_class):
        """Test agent creation handles initialization failures."""
        mock_bedrock_model.side_effect = Exception("Model initialization failed")

        settings = Mock(spec=Settings)
        settings.aws_region = 'us-east-1'

        backend_client = Mock(spec=BackendAPIClient)

        with pytest.raises(Exception) as exc_info:
            create_shopping_agent(settings, backend_client)

        assert "Model initialization failed" in str(exc_info.value)

    @patch('agent.Agent')
    @patch('agent.BedrockModel')
    def test_create_agent_has_all_tools(self, mock_bedrock_model, mock_agent_class):
        """Test that agent is created with all required tools (Requirement 7.2-7.5)."""
        mock_model = Mock()
        mock_bedrock_model.return_value = mock_model
        mock_agent = Mock()
        mock_agent_class.return_value = mock_agent

        settings = Mock(spec=Settings)
        settings.aws_region = 'us-east-1'

        backend_client = Mock(spec=BackendAPIClient)

        create_shopping_agent(settings, backend_client)

        # Verify Agent was called with 6 tools
        call_args = mock_agent_class.call_args[1]
        tools = call_args['tools']
        assert len(tools) == 6

        # Verify tool names (they should be callable functions)
        tool_names = [tool.__name__ for tool in tools]
        assert 'search_products' in tool_names
        assert 'get_product_details' in tool_names
        assert 'add_to_cart' in tool_names
        assert 'view_cart' in tool_names
        assert 'update_cart_item' in tool_names
        assert 'remove_from_cart' in tool_names


class TestSearchProductsTool:
    """Tests for search_products tool function."""

    def test_search_products_all(self):
        """Test search_products returns all products when no query provided."""
        backend_client = Mock(spec=BackendAPIClient)
        backend_client.get_products.return_value = [
            {'id': 1, 'part_number': 'SD-1000', 'description': 'X-ray Scanner'},
            {'id': 2, 'part_number': 'SD-2000', 'description': 'Metal Detector'}
        ]

        tool = create_search_products_tool(backend_client)
        result = tool()

        assert result['count'] == 2
        assert len(result['products']) == 2
        backend_client.get_products.assert_called_once()

    def test_search_products_with_query(self):
        """Test search_products filters by query."""
        backend_client = Mock(spec=BackendAPIClient)
        backend_client.get_products.return_value = [
            {'id': 1, 'part_number': 'SD-1000', 'description': 'X-ray Scanner'},
            {'id': 2, 'part_number': 'SD-2000', 'description': 'Metal Detector'},
            {'id': 3, 'part_number': 'SD-3000', 'description': 'X-ray Baggage Scanner'}
        ]

        tool = create_search_products_tool(backend_client)
        result = tool(query='x-ray')

        assert result['count'] == 2
        assert len(result['products']) == 2
        assert all('x-ray' in p['description'].lower() for p in result['products'])

    def test_search_products_by_part_number(self):
        """Test search_products filters by part number."""
        backend_client = Mock(spec=BackendAPIClient)
        backend_client.get_products.return_value = [
            {'id': 1, 'part_number': 'SD-1000', 'description': 'X-ray Scanner'},
            {'id': 2, 'part_number': 'SD-2000', 'description': 'Metal Detector'}
        ]

        tool = create_search_products_tool(backend_client)
        result = tool(query='SD-1000')

        assert result['count'] == 1
        assert result['products'][0]['part_number'] == 'SD-1000'

    def test_search_products_no_matches(self):
        """Test search_products returns empty list when no matches."""
        backend_client = Mock(spec=BackendAPIClient)
        backend_client.get_products.return_value = [
            {'id': 1, 'part_number': 'SD-1000', 'description': 'X-ray Scanner'}
        ]

        tool = create_search_products_tool(backend_client)
        result = tool(query='nonexistent')

        assert result['count'] == 0
        assert result['products'] == []

    def test_search_products_backend_error(self):
        """Test search_products handles backend errors gracefully."""
        backend_client = Mock(spec=BackendAPIClient)
        backend_client.get_products.side_effect = BackendAPIError("Connection failed")

        tool = create_search_products_tool(backend_client)
        result = tool()

        assert 'error' in result
        assert result['count'] == 0
        assert result['products'] == []


class TestGetProductDetailsTool:
    """Tests for get_product_details tool function."""

    def test_get_product_details_success(self):
        """Test get_product_details returns product data."""
        backend_client = Mock(spec=BackendAPIClient)
        backend_client.get_product.return_value = {
            'id': 1,
            'part_number': 'SD-1000',
            'description': 'X-ray Scanner',
            'price': 5000.00
        }

        tool = create_get_product_details_tool(backend_client)
        result = tool(product_id=1)

        assert result['id'] == 1
        assert result['part_number'] == 'SD-1000'
        backend_client.get_product.assert_called_once_with(1)

    def test_get_product_details_not_found(self):
        """Test get_product_details handles product not found."""
        backend_client = Mock(spec=BackendAPIClient)
        backend_client.get_product.side_effect = ProductNotFoundError("Product 999 not found")

        tool = create_get_product_details_tool(backend_client)
        result = tool(product_id=999)

        assert 'error' in result
        assert '999' in result['error']

    def test_get_product_details_backend_error(self):
        """Test get_product_details handles backend errors."""
        backend_client = Mock(spec=BackendAPIClient)
        backend_client.get_product.side_effect = BackendAPIError("Connection failed")

        tool = create_get_product_details_tool(backend_client)
        result = tool(product_id=1)

        assert 'error' in result


class TestAddToCartTool:
    """Tests for add_to_cart tool function."""

    def test_add_to_cart_success(self):
        """Test add_to_cart successfully adds product."""
        backend_client = Mock(spec=BackendAPIClient)
        backend_client.add_to_cart.return_value = {
            'id': 1,
            'product_id': 10,
            'quantity': 2
        }

        tool = create_add_to_cart_tool(backend_client)
        result = tool(product_id=10, quantity=2)

        assert result['success'] is True
        assert 'Added 2 unit(s) to cart' in result['message']
        backend_client.add_to_cart.assert_called_once_with(10, 2)

    def test_add_to_cart_default_quantity(self):
        """Test add_to_cart uses default quantity of 1."""
        backend_client = Mock(spec=BackendAPIClient)
        backend_client.add_to_cart.return_value = {
            'id': 1,
            'product_id': 10,
            'quantity': 1
        }

        tool = create_add_to_cart_tool(backend_client)
        result = tool(product_id=10)

        assert result['success'] is True
        backend_client.add_to_cart.assert_called_once_with(10, 1)

    def test_add_to_cart_product_not_found(self):
        """Test add_to_cart handles product not found."""
        backend_client = Mock(spec=BackendAPIClient)
        backend_client.add_to_cart.side_effect = ProductNotFoundError("Product 999 not found")

        tool = create_add_to_cart_tool(backend_client)
        result = tool(product_id=999, quantity=1)

        assert result['success'] is False
        assert 'error' in result
        assert '999' in result['error']

    def test_add_to_cart_invalid_request(self):
        """Test add_to_cart handles invalid requests."""
        backend_client = Mock(spec=BackendAPIClient)
        backend_client.add_to_cart.side_effect = InvalidRequestError("Quantity must be positive")

        tool = create_add_to_cart_tool(backend_client)
        result = tool(product_id=10, quantity=-1)

        assert result['success'] is False
        assert 'Quantity must be positive' in result['error']

    def test_add_to_cart_backend_error(self):
        """Test add_to_cart handles backend errors."""
        backend_client = Mock(spec=BackendAPIClient)
        backend_client.add_to_cart.side_effect = BackendAPIError("Connection failed")

        tool = create_add_to_cart_tool(backend_client)
        result = tool(product_id=10, quantity=1)

        assert result['success'] is False
        assert 'error' in result


class TestViewCartTool:
    """Tests for view_cart tool function."""

    def test_view_cart_success(self):
        """Test view_cart returns cart contents."""
        backend_client = Mock(spec=BackendAPIClient)
        backend_client.get_cart.return_value = {
            'items': [
                {'id': 1, 'product_id': 10, 'quantity': 2}
            ],
            'total': 10000.00,
            'item_count': 1
        }

        tool = create_view_cart_tool(backend_client)
        result = tool()

        assert len(result['items']) == 1
        assert result['total'] == 10000.00
        backend_client.get_cart.assert_called_once()

    def test_view_cart_empty(self):
        """Test view_cart with empty cart."""
        backend_client = Mock(spec=BackendAPIClient)
        backend_client.get_cart.return_value = {
            'items': [],
            'total': 0.00,
            'item_count': 0
        }

        tool = create_view_cart_tool(backend_client)
        result = tool()

        assert result['items'] == []
        assert result['total'] == 0.00

    def test_view_cart_backend_error(self):
        """Test view_cart handles backend errors."""
        backend_client = Mock(spec=BackendAPIClient)
        backend_client.get_cart.side_effect = BackendAPIError("Connection failed")

        tool = create_view_cart_tool(backend_client)
        result = tool()

        assert 'error' in result
        assert result['items'] == []
        assert result['total'] == 0


class TestUpdateCartTool:
    """Tests for update_cart_item tool function."""

    def test_update_cart_item_success(self):
        """Test update_cart_item successfully updates quantity."""
        backend_client = Mock(spec=BackendAPIClient)
        backend_client.update_cart_item.return_value = {
            'id': 1,
            'product_id': 10,
            'quantity': 5
        }

        tool = create_update_cart_tool(backend_client)
        result = tool(cart_item_id=1, quantity=5)

        assert result['success'] is True
        assert 'Cart updated successfully' in result['message']
        backend_client.update_cart_item.assert_called_once_with(1, 5)

    def test_update_cart_item_not_found(self):
        """Test update_cart_item handles cart item not found."""
        backend_client = Mock(spec=BackendAPIClient)
        backend_client.update_cart_item.side_effect = CartItemNotFoundError("Cart item 999 not found")

        tool = create_update_cart_tool(backend_client)
        result = tool(cart_item_id=999, quantity=5)

        assert result['success'] is False
        assert 'error' in result
        assert '999' in result['error']

    def test_update_cart_item_backend_error(self):
        """Test update_cart_item handles backend errors."""
        backend_client = Mock(spec=BackendAPIClient)
        backend_client.update_cart_item.side_effect = BackendAPIError("Connection failed")

        tool = create_update_cart_tool(backend_client)
        result = tool(cart_item_id=1, quantity=5)

        assert result['success'] is False
        assert 'error' in result


class TestRemoveFromCartTool:
    """Tests for remove_from_cart tool function."""

    def test_remove_from_cart_success(self):
        """Test remove_from_cart successfully removes item."""
        backend_client = Mock(spec=BackendAPIClient)
        backend_client.remove_cart_item.return_value = {
            'message': 'Item removed from cart'
        }

        tool = create_remove_from_cart_tool(backend_client)
        result = tool(cart_item_id=1)

        assert result['success'] is True
        assert 'Item removed from cart' in result['message']
        backend_client.remove_cart_item.assert_called_once_with(1)

    def test_remove_from_cart_not_found(self):
        """Test remove_from_cart handles cart item not found."""
        backend_client = Mock(spec=BackendAPIClient)
        backend_client.remove_cart_item.side_effect = CartItemNotFoundError("Cart item 999 not found")

        tool = create_remove_from_cart_tool(backend_client)
        result = tool(cart_item_id=999)

        assert result['success'] is False
        assert 'error' in result
        assert '999' in result['error']

    def test_remove_from_cart_backend_error(self):
        """Test remove_from_cart handles backend errors."""
        backend_client = Mock(spec=BackendAPIClient)
        backend_client.remove_cart_item.side_effect = BackendAPIError("Connection failed")

        tool = create_remove_from_cart_tool(backend_client)
        result = tool(cart_item_id=1)

        assert result['success'] is False
        assert 'error' in result


class TestProcessMessage:
    """Tests for process_message function."""

    def test_process_message_success(self):
        """Test process_message successfully processes user message (Requirement 9, 10)."""
        mock_agent = Mock()
        mock_agent.return_value = "I can help you find detection equipment."

        session = Session(session_id="test-session-123")
        user_message = "What products do you have?"

        result = process_message(mock_agent, session, user_message)

        # Verify agent was called with user message
        mock_agent.assert_called_once_with(user_message)

        # Verify response was returned
        assert result == "I can help you find detection equipment."

        # Verify messages were added to session
        assert len(session.messages) == 2
        assert session.messages[0].role == "user"
        assert session.messages[0].content == user_message
        assert session.messages[1].role == "assistant"
        assert session.messages[1].content == result

    def test_process_message_with_conversation_history(self):
        """Test process_message maintains conversation context."""
        mock_agent = Mock()
        mock_agent.return_value = "The X-ray Scanner costs $5000."

        session = Session(session_id="test-session-456")
        session.add_message("user", "What products do you have?")
        session.add_message("assistant", "We have X-ray scanners and metal detectors.")

        user_message = "How much is the X-ray scanner?"

        result = process_message(mock_agent, session, user_message)

        # Verify agent was called
        mock_agent.assert_called_once_with(user_message)

        # Verify session has all messages
        assert len(session.messages) == 4

    def test_process_message_agent_failure(self):
        """Test process_message handles agent failures."""
        mock_agent = Mock()
        mock_agent.side_effect = Exception("Agent processing failed")

        session = Session(session_id="test-session-789")
        user_message = "What products do you have?"

        with pytest.raises(Exception) as exc_info:
            process_message(mock_agent, session, user_message)

        assert "Agent processing failed" in str(exc_info.value)

    def test_process_message_updates_session_timestamp(self):
        """Test process_message updates session last_accessed timestamp."""
        mock_agent = Mock()
        mock_agent.return_value = "Response"

        session = Session(session_id="test-session-time")
        original_timestamp = session.last_accessed

        # Small delay to ensure timestamp changes
        import time
        time.sleep(0.01)

        process_message(mock_agent, session, "Test message")

        # Verify timestamp was updated
        assert session.last_accessed > original_timestamp
