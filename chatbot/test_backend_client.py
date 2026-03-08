"""
Tests for the Backend API Client.

Tests verify initialization, retry logic, timeout configuration,
and custom exception definitions.
"""

import pytest
import requests
from unittest.mock import Mock, patch, MagicMock
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from backend_client import (
    BackendAPIClient,
    BackendAPIError,
    ProductNotFoundError,
    CartItemNotFoundError,
    InvalidRequestError
)


class TestCustomExceptions:
    """Tests for custom exception classes."""

    def test_backend_api_error_is_exception(self):
        """Test that BackendAPIError is a proper exception."""
        error = BackendAPIError("Test error")
        assert isinstance(error, Exception)
        assert str(error) == "Test error"

    def test_product_not_found_error_inherits_from_backend_api_error(self):
        """Test that ProductNotFoundError inherits from BackendAPIError."""
        error = ProductNotFoundError("Product 123 not found")
        assert isinstance(error, BackendAPIError)
        assert isinstance(error, Exception)
        assert str(error) == "Product 123 not found"

    def test_cart_item_not_found_error_inherits_from_backend_api_error(self):
        """Test that CartItemNotFoundError inherits from BackendAPIError."""
        error = CartItemNotFoundError("Cart item 456 not found")
        assert isinstance(error, BackendAPIError)
        assert isinstance(error, Exception)
        assert str(error) == "Cart item 456 not found"

    def test_invalid_request_error_inherits_from_backend_api_error(self):
        """Test that InvalidRequestError inherits from BackendAPIError."""
        error = InvalidRequestError("Invalid quantity")
        assert isinstance(error, BackendAPIError)
        assert isinstance(error, Exception)
        assert str(error) == "Invalid quantity"

    def test_can_catch_specific_exceptions(self):
        """Test that specific exceptions can be caught individually."""
        try:
            raise ProductNotFoundError("Test")
        except ProductNotFoundError as e:
            assert str(e) == "Test"

        try:
            raise CartItemNotFoundError("Test")
        except CartItemNotFoundError as e:
            assert str(e) == "Test"

        try:
            raise InvalidRequestError("Test")
        except InvalidRequestError as e:
            assert str(e) == "Test"

    def test_can_catch_all_with_base_exception(self):
        """Test that all custom exceptions can be caught with BackendAPIError."""
        exceptions = [
            ProductNotFoundError("Product error"),
            CartItemNotFoundError("Cart error"),
            InvalidRequestError("Invalid error")
        ]

        for exc in exceptions:
            try:
                raise exc
            except BackendAPIError as e:
                assert isinstance(e, BackendAPIError)


class TestBackendAPIClientInitialization:
    """Tests for BackendAPIClient initialization."""

    def test_initialization_with_default_timeout(self):
        """Test client initialization with default timeout (Requirement 7.2)."""
        client = BackendAPIClient(base_url="http://localhost:5000")

        assert client.base_url == "http://localhost:5000"
        assert client.timeout == 5  # Default timeout is 5 seconds
        assert isinstance(client.session, requests.Session)

    def test_initialization_with_custom_timeout(self):
        """Test client initialization with custom timeout."""
        client = BackendAPIClient(base_url="http://localhost:5000", timeout=10)

        assert client.base_url == "http://localhost:5000"
        assert client.timeout == 10

    def test_initialization_strips_trailing_slash(self):
        """Test that trailing slashes are removed from base_url."""
        client = BackendAPIClient(base_url="http://localhost:5000/")
        assert client.base_url == "http://localhost:5000"

        client = BackendAPIClient(base_url="http://localhost:5000///")
        assert client.base_url == "http://localhost:5000"

    def test_initialization_with_https(self):
        """Test client initialization with HTTPS URL."""
        client = BackendAPIClient(base_url="https://api.example.com")
        assert client.base_url == "https://api.example.com"

    def test_session_has_retry_adapter(self):
        """Test that session is configured with retry adapter (Requirement 7.5)."""
        client = BackendAPIClient(base_url="http://localhost:5000")

        # Check that adapters are mounted for both http and https
        assert "http://" in client.session.adapters
        assert "https://" in client.session.adapters

        # Get the adapter and verify it's an HTTPAdapter
        adapter = client.session.get_adapter("http://localhost:5000")
        assert isinstance(adapter, HTTPAdapter)

    def test_retry_strategy_configuration(self):
        """Test that retry strategy is configured correctly (Requirement 7.5)."""
        client = BackendAPIClient(base_url="http://localhost:5000")

        # Get the adapter
        adapter = client.session.get_adapter("http://localhost:5000")

        # Verify retry configuration
        # The retry object is stored in max_retries attribute
        retry = adapter.max_retries
        assert isinstance(retry, Retry)

        # Verify retry settings
        assert retry.total == 1  # Retry once
        assert retry.backoff_factor == 0.5  # 0.5s backoff
        assert 500 in retry.status_forcelist  # Retry on 500
        assert 502 in retry.status_forcelist  # Retry on 502
        assert 503 in retry.status_forcelist  # Retry on 503
        assert 504 in retry.status_forcelist  # Retry on 504

    def test_retry_allowed_methods(self):
        """Test that retry is configured for all HTTP methods."""
        client = BackendAPIClient(base_url="http://localhost:5000")

        adapter = client.session.get_adapter("http://localhost:5000")
        retry = adapter.max_retries

        # Verify allowed methods
        allowed_methods = retry.allowed_methods
        assert "GET" in allowed_methods
        assert "POST" in allowed_methods
        assert "PUT" in allowed_methods
        assert "DELETE" in allowed_methods

    def test_multiple_clients_have_independent_sessions(self):
        """Test that multiple client instances have independent sessions."""
        client1 = BackendAPIClient(base_url="http://localhost:5000")
        client2 = BackendAPIClient(base_url="http://localhost:6000")

        assert client1.session is not client2.session
        assert client1.base_url != client2.base_url

    def test_initialization_with_different_base_urls(self):
        """Test initialization with various base URL formats."""
        test_cases = [
            ("http://localhost:5000", "http://localhost:5000"),
            ("http://localhost:5000/", "http://localhost:5000"),
            ("https://api.example.com", "https://api.example.com"),
            ("https://api.example.com/", "https://api.example.com"),
            ("http://192.168.1.1:8080", "http://192.168.1.1:8080"),
            ("http://192.168.1.1:8080/", "http://192.168.1.1:8080"),
        ]

        for input_url, expected_url in test_cases:
            client = BackendAPIClient(base_url=input_url)
            assert client.base_url == expected_url


class TestBackendAPIClientRequirements:
    """Tests verifying specific requirements."""

    def test_requirement_7_1_base_url_from_config(self):
        """
        Requirement 7.1: The Chatbot_Service SHALL read the Backend_API
        base URL from environment variable BACKEND_API_URL.

        Note: This test verifies the client accepts a base_url parameter.
        The actual environment variable reading is done in the config module.
        """
        base_url = "http://localhost:5000"
        client = BackendAPIClient(base_url=base_url)
        assert client.base_url == base_url

    def test_requirement_7_2_timeout_5_seconds(self):
        """
        Requirement 7.2: WHEN calling Backend_API endpoints, THE Chatbot_Service
        SHALL use HTTP client with timeout of 5 seconds.
        """
        client = BackendAPIClient(base_url="http://localhost:5000")
        assert client.timeout == 5

    def test_requirement_7_5_retry_once(self):
        """
        Requirement 7.5: WHEN Backend_API is unreachable, THE Chatbot_Service
        SHALL retry the request once before failing.
        """
        client = BackendAPIClient(base_url="http://localhost:5000")

        adapter = client.session.get_adapter("http://localhost:5000")
        retry = adapter.max_retries

        # Verify retry is configured to retry once
        assert retry.total == 1

        # Verify retry is configured for server errors (unreachable scenarios)
        assert 500 in retry.status_forcelist
        assert 502 in retry.status_forcelist
        assert 503 in retry.status_forcelist
        assert 504 in retry.status_forcelist


class TestBackendAPIClientEdgeCases:
    """Tests for edge cases and error conditions."""

    def test_empty_base_url(self):
        """Test initialization with empty base URL."""
        client = BackendAPIClient(base_url="")
        assert client.base_url == ""

    def test_base_url_with_path(self):
        """Test initialization with base URL containing a path."""
        client = BackendAPIClient(base_url="http://localhost:5000/api/v1")
        assert client.base_url == "http://localhost:5000/api/v1"

    def test_base_url_with_path_and_trailing_slash(self):
        """Test initialization with base URL containing path and trailing slash."""
        client = BackendAPIClient(base_url="http://localhost:5000/api/v1/")
        assert client.base_url == "http://localhost:5000/api/v1"

    def test_timeout_zero(self):
        """Test initialization with zero timeout."""
        client = BackendAPIClient(base_url="http://localhost:5000", timeout=0)
        assert client.timeout == 0

    def test_timeout_negative(self):
        """Test initialization with negative timeout."""
        client = BackendAPIClient(base_url="http://localhost:5000", timeout=-1)
        assert client.timeout == -1

    def test_very_large_timeout(self):
        """Test initialization with very large timeout."""
        client = BackendAPIClient(base_url="http://localhost:5000", timeout=3600)
        assert client.timeout == 3600



class TestGetProducts:
    """Tests for get_products() method."""

    @patch('logger.get_logger')
    def test_get_products_success(self, mock_get_logger):
        """Test successful retrieval of all products."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        # Mock successful response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'data': [
                {'id': 1, 'part_number': 'SD-1000', 'description': 'X-ray Scanner', 'price': 5000.00},
                {'id': 2, 'part_number': 'SD-2000', 'description': 'Metal Detector', 'price': 3000.00}
            ]
        }

        with patch.object(client.session, 'get', return_value=mock_response) as mock_get:
            result = client.get_products()

            # Verify the request was made correctly
            mock_get.assert_called_once_with(
                "http://localhost:5000/api/products",
                timeout=5
            )

            # Verify the result
            assert len(result) == 2
            assert result[0]['id'] == 1
            assert result[0]['part_number'] == 'SD-1000'
            assert result[1]['id'] == 2

            # Verify logging was called (Requirement 8.3)
            mock_logger.log_backend_call.assert_called_once()
            call_args = mock_logger.log_backend_call.call_args[1]
            assert call_args['endpoint'] == '/api/products'
            assert call_args['status_code'] == 200
            assert 'response_time_ms' in call_args

    @patch('logger.get_logger')
    def test_get_products_empty_catalog(self, mock_get_logger):
        """Test get_products when catalog is empty."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'data': []}

        with patch.object(client.session, 'get', return_value=mock_response):
            result = client.get_products()
            assert result == []

    @patch('logger.get_logger')
    def test_get_products_http_500_error(self, mock_get_logger):
        """Test get_products handles 500 server error (Requirement 7.4)."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(response=mock_response)

        with patch.object(client.session, 'get', return_value=mock_response):
            with pytest.raises(BackendAPIError) as exc_info:
                client.get_products()

            assert "Could not retrieve products" in str(exc_info.value)

            # Verify error was logged (Requirement 7.4)
            mock_logger.log_error.assert_called_once()
            call_args = mock_logger.log_error.call_args[1]
            assert call_args['error_type'] == 'HTTPError'

    @patch('logger.get_logger')
    def test_get_products_connection_error(self, mock_get_logger):
        """Test get_products handles connection errors."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        with patch.object(client.session, 'get', side_effect=requests.exceptions.ConnectionError("Connection refused")):
            with pytest.raises(BackendAPIError) as exc_info:
                client.get_products()

            assert "Could not retrieve products" in str(exc_info.value)
            mock_logger.log_error.assert_called_once()

    @patch('logger.get_logger')
    def test_get_products_timeout(self, mock_get_logger):
        """Test get_products handles timeout errors."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        with patch.object(client.session, 'get', side_effect=requests.exceptions.Timeout("Request timed out")):
            with pytest.raises(BackendAPIError) as exc_info:
                client.get_products()

            assert "Could not retrieve products" in str(exc_info.value)

    @patch('logger.get_logger')
    def test_get_products_uses_configured_timeout(self, mock_get_logger):
        """Test that get_products uses the configured timeout (Requirement 7.2)."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000", timeout=10)

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'data': []}

        with patch.object(client.session, 'get', return_value=mock_response) as mock_get:
            client.get_products()
            mock_get.assert_called_once_with(
                "http://localhost:5000/api/products",
                timeout=10
            )


class TestGetProduct:
    """Tests for get_product() method."""

    @patch('logger.get_logger')
    def test_get_product_success(self, mock_get_logger):
        """Test successful retrieval of a specific product."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'data': {
                'id': 1,
                'part_number': 'SD-1000',
                'description': 'X-ray Scanner',
                'price': 5000.00,
                'created_at': '2024-01-01T00:00:00Z'
            }
        }

        with patch.object(client.session, 'get', return_value=mock_response) as mock_get:
            result = client.get_product(1)

            # Verify the request was made correctly
            mock_get.assert_called_once_with(
                "http://localhost:5000/api/products/1",
                timeout=5
            )

            # Verify the result
            assert result['id'] == 1
            assert result['part_number'] == 'SD-1000'
            assert result['description'] == 'X-ray Scanner'
            assert result['price'] == 5000.00

            # Verify logging was called (Requirement 8.3)
            mock_logger.log_backend_call.assert_called_once()
            call_args = mock_logger.log_backend_call.call_args[1]
            assert call_args['endpoint'] == '/api/products/1'
            assert call_args['status_code'] == 200
            assert 'response_time_ms' in call_args

    @patch('logger.get_logger')
    def test_get_product_not_found(self, mock_get_logger):
        """Test get_product raises ProductNotFoundError for 404 (Requirement 7.4)."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 404

        with patch.object(client.session, 'get', return_value=mock_response):
            with pytest.raises(ProductNotFoundError) as exc_info:
                client.get_product(999)

            assert "Product 999 not found" in str(exc_info.value)

            # Verify logging was still called
            mock_logger.log_backend_call.assert_called_once()

    @patch('logger.get_logger')
    def test_get_product_http_500_error(self, mock_get_logger):
        """Test get_product handles 500 server error (Requirement 7.4)."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(response=mock_response)

        with patch.object(client.session, 'get', return_value=mock_response):
            with pytest.raises(BackendAPIError) as exc_info:
                client.get_product(1)

            assert "Could not retrieve product" in str(exc_info.value)

            # Verify error was logged (Requirement 7.4)
            mock_logger.log_error.assert_called_once()
            call_args = mock_logger.log_error.call_args[1]
            assert call_args['error_type'] == 'HTTPError'

    @patch('logger.get_logger')
    def test_get_product_connection_error(self, mock_get_logger):
        """Test get_product handles connection errors."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        with patch.object(client.session, 'get', side_effect=requests.exceptions.ConnectionError("Connection refused")):
            with pytest.raises(BackendAPIError) as exc_info:
                client.get_product(1)

            assert "Could not retrieve product" in str(exc_info.value)
            mock_logger.log_error.assert_called_once()

    @patch('logger.get_logger')
    def test_get_product_with_different_ids(self, mock_get_logger):
        """Test get_product with various product IDs."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        test_ids = [1, 42, 999, 12345]

        for product_id in test_ids:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                'data': {'id': product_id, 'part_number': f'SD-{product_id}'}
            }

            with patch.object(client.session, 'get', return_value=mock_response) as mock_get:
                result = client.get_product(product_id)

                mock_get.assert_called_with(
                    f"http://localhost:5000/api/products/{product_id}",
                    timeout=5
                )
                assert result['id'] == product_id

    @patch('logger.get_logger')
    def test_get_product_uses_configured_timeout(self, mock_get_logger):
        """Test that get_product uses the configured timeout (Requirement 7.2)."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000", timeout=10)

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'data': {'id': 1}}

        with patch.object(client.session, 'get', return_value=mock_response) as mock_get:
            client.get_product(1)
            mock_get.assert_called_once_with(
                "http://localhost:5000/api/products/1",
                timeout=10
            )

    @patch('logger.get_logger')
    def test_get_product_logs_response_time(self, mock_get_logger):
        """Test that get_product logs response time (Requirement 8.3)."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'data': {'id': 1}}

        with patch.object(client.session, 'get', return_value=mock_response):
            client.get_product(1)

            # Verify log_backend_call was called with response_time_ms
            mock_logger.log_backend_call.assert_called_once()
            call_args = mock_logger.log_backend_call.call_args[1]
            assert 'response_time_ms' in call_args
            assert isinstance(call_args['response_time_ms'], float)
            assert call_args['response_time_ms'] >= 0


class TestProductAPIRequirements:
    """Tests verifying specific requirements for product API methods."""

    @patch('logger.get_logger')
    def test_requirement_5_1_query_backend_for_products(self, mock_get_logger):
        """
        Requirement 5.1: WHEN a user asks about product features,
        THE Chatbot_Service SHALL query the Backend_API for Product_Catalog information.
        """
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'data': []}

        with patch.object(client.session, 'get', return_value=mock_response) as mock_get:
            client.get_products()
            mock_get.assert_called_once()

    @patch('logger.get_logger')
    def test_requirement_7_3_parse_json_on_success(self, mock_get_logger):
        """
        Requirement 7.3: WHEN Backend_API returns HTTP 2xx,
        THE Chatbot_Service SHALL parse the JSON response.
        """
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'data': [{'id': 1, 'part_number': 'SD-1000'}]
        }

        with patch.object(client.session, 'get', return_value=mock_response):
            result = client.get_products()
            assert isinstance(result, list)
            assert len(result) == 1
            assert result[0]['id'] == 1

    @patch('logger.get_logger')
    def test_requirement_7_4_log_error_on_4xx_5xx(self, mock_get_logger):
        """
        Requirement 7.4: WHEN Backend_API returns HTTP 4xx or 5xx,
        THE Chatbot_Service SHALL log the error and inform the user of the issue.
        """
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        # Test 404 error
        mock_response = Mock()
        mock_response.status_code = 404

        with patch.object(client.session, 'get', return_value=mock_response):
            with pytest.raises(ProductNotFoundError):
                client.get_product(999)

            # Verify error was logged
            assert mock_logger.log_backend_call.called

        # Test 500 error
        mock_logger.reset_mock()
        mock_response.status_code = 500
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(response=mock_response)

        with patch.object(client.session, 'get', return_value=mock_response):
            with pytest.raises(BackendAPIError):
                client.get_products()

            # Verify error was logged
            mock_logger.log_error.assert_called_once()

    @patch('logger.get_logger')
    def test_requirement_8_3_log_all_api_calls(self, mock_get_logger):
        """
        Requirement 8.3: THE Chatbot_Service SHALL log all Backend_API calls
        with endpoint, status code, and response time.
        """
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'data': []}

        with patch.object(client.session, 'get', return_value=mock_response):
            client.get_products()

            # Verify log_backend_call was called with all required parameters
            mock_logger.log_backend_call.assert_called_once()
            call_args = mock_logger.log_backend_call.call_args[1]
            assert 'endpoint' in call_args
            assert 'status_code' in call_args
            assert 'response_time_ms' in call_args



class TestGetCart:
    """Tests for get_cart() method."""

    @patch('logger.get_logger')
    def test_get_cart_success(self, mock_get_logger):
        """Test successful retrieval of cart contents."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'data': {
                'items': [
                    {
                        'id': 1,
                        'product_id': 10,
                        'quantity': 2,
                        'product': {'id': 10, 'part_number': 'SD-1000', 'description': 'X-ray Scanner', 'price': 5000.00},
                        'line_total': 10000.00
                    }
                ],
                'total': 10000.00,
                'item_count': 1
            }
        }

        with patch.object(client.session, 'get', return_value=mock_response) as mock_get:
            result = client.get_cart()

            # Verify the request was made correctly
            mock_get.assert_called_once_with(
                "http://localhost:5000/api/cart",
                timeout=5
            )

            # Verify the result
            assert 'items' in result
            assert len(result['items']) == 1
            assert result['total'] == 10000.00
            assert result['item_count'] == 1

            # Verify logging was called (Requirement 8.3)
            mock_logger.log_backend_call.assert_called_once()
            call_args = mock_logger.log_backend_call.call_args[1]
            assert call_args['endpoint'] == '/api/cart'
            assert call_args['status_code'] == 200
            assert 'response_time_ms' in call_args

    @patch('logger.get_logger')
    def test_get_cart_empty(self, mock_get_logger):
        """Test get_cart when cart is empty."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'data': {
                'items': [],
                'total': 0.00,
                'item_count': 0
            }
        }

        with patch.object(client.session, 'get', return_value=mock_response):
            result = client.get_cart()
            assert result['items'] == []
            assert result['total'] == 0.00
            assert result['item_count'] == 0

    @patch('logger.get_logger')
    def test_get_cart_http_500_error(self, mock_get_logger):
        """Test get_cart handles 500 server error (Requirement 7.4)."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(response=mock_response)

        with patch.object(client.session, 'get', return_value=mock_response):
            with pytest.raises(BackendAPIError) as exc_info:
                client.get_cart()

            assert "Could not retrieve cart" in str(exc_info.value)
            mock_logger.log_error.assert_called_once()

    @patch('logger.get_logger')
    def test_get_cart_connection_error(self, mock_get_logger):
        """Test get_cart handles connection errors."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        with patch.object(client.session, 'get', side_effect=requests.exceptions.ConnectionError("Connection refused")):
            with pytest.raises(BackendAPIError) as exc_info:
                client.get_cart()

            assert "Could not retrieve cart" in str(exc_info.value)
            mock_logger.log_error.assert_called_once()


class TestAddToCart:
    """Tests for add_to_cart() method."""

    @patch('logger.get_logger')
    def test_add_to_cart_success(self, mock_get_logger):
        """Test successful addition of product to cart."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 201
        mock_response.json.return_value = {
            'data': {
                'id': 1,
                'product_id': 10,
                'quantity': 2,
                'product': {'id': 10, 'part_number': 'SD-1000', 'description': 'X-ray Scanner', 'price': 5000.00},
                'line_total': 10000.00
            }
        }

        with patch.object(client.session, 'post', return_value=mock_response) as mock_post:
            result = client.add_to_cart(product_id=10, quantity=2)

            # Verify the request was made correctly
            mock_post.assert_called_once_with(
                "http://localhost:5000/api/cart",
                json={"product_id": 10, "quantity": 2},
                timeout=5
            )

            # Verify the result
            assert result['id'] == 1
            assert result['product_id'] == 10
            assert result['quantity'] == 2
            assert result['line_total'] == 10000.00

            # Verify logging was called (Requirement 8.3)
            mock_logger.log_backend_call.assert_called_once()
            call_args = mock_logger.log_backend_call.call_args[1]
            assert call_args['endpoint'] == '/api/cart'
            assert call_args['status_code'] == 201
            assert 'response_time_ms' in call_args

    @patch('logger.get_logger')
    def test_add_to_cart_product_not_found(self, mock_get_logger):
        """Test add_to_cart raises ProductNotFoundError for 404 (Requirement 7.4)."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 404

        with patch.object(client.session, 'post', return_value=mock_response):
            with pytest.raises(ProductNotFoundError) as exc_info:
                client.add_to_cart(product_id=999, quantity=1)

            assert "Product 999 not found" in str(exc_info.value)
            mock_logger.log_backend_call.assert_called_once()

    @patch('logger.get_logger')
    def test_add_to_cart_invalid_request(self, mock_get_logger):
        """Test add_to_cart raises InvalidRequestError for 400 (Requirement 7.4)."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.json.return_value = {
            'error': {'message': 'Quantity must be positive'}
        }

        with patch.object(client.session, 'post', return_value=mock_response):
            with pytest.raises(InvalidRequestError) as exc_info:
                client.add_to_cart(product_id=10, quantity=-1)

            assert "Quantity must be positive" in str(exc_info.value)
            mock_logger.log_backend_call.assert_called_once()

    @patch('logger.get_logger')
    def test_add_to_cart_http_500_error(self, mock_get_logger):
        """Test add_to_cart handles 500 server error (Requirement 7.4)."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(response=mock_response)

        with patch.object(client.session, 'post', return_value=mock_response):
            with pytest.raises(BackendAPIError) as exc_info:
                client.add_to_cart(product_id=10, quantity=1)

            assert "Could not add to cart" in str(exc_info.value)
            mock_logger.log_error.assert_called_once()

    @patch('logger.get_logger')
    def test_add_to_cart_connection_error(self, mock_get_logger):
        """Test add_to_cart handles connection errors."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        with patch.object(client.session, 'post', side_effect=requests.exceptions.ConnectionError("Connection refused")):
            with pytest.raises(BackendAPIError) as exc_info:
                client.add_to_cart(product_id=10, quantity=1)

            assert "Could not add to cart" in str(exc_info.value)
            mock_logger.log_error.assert_called_once()

    @patch('logger.get_logger')
    def test_add_to_cart_with_different_quantities(self, mock_get_logger):
        """Test add_to_cart with various quantities."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        test_cases = [(1, 1), (10, 5), (20, 100)]

        for product_id, quantity in test_cases:
            mock_response = Mock()
            mock_response.status_code = 201
            mock_response.json.return_value = {
                'data': {'id': 1, 'product_id': product_id, 'quantity': quantity}
            }

            with patch.object(client.session, 'post', return_value=mock_response) as mock_post:
                result = client.add_to_cart(product_id=product_id, quantity=quantity)

                mock_post.assert_called_with(
                    "http://localhost:5000/api/cart",
                    json={"product_id": product_id, "quantity": quantity},
                    timeout=5
                )
                assert result['product_id'] == product_id
                assert result['quantity'] == quantity


class TestUpdateCartItem:
    """Tests for update_cart_item() method."""

    @patch('logger.get_logger')
    def test_update_cart_item_success(self, mock_get_logger):
        """Test successful update of cart item quantity."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'data': {
                'id': 1,
                'product_id': 10,
                'quantity': 5,
                'product': {'id': 10, 'part_number': 'SD-1000', 'description': 'X-ray Scanner', 'price': 5000.00},
                'line_total': 25000.00
            }
        }

        with patch.object(client.session, 'put', return_value=mock_response) as mock_put:
            result = client.update_cart_item(cart_item_id=1, quantity=5)

            # Verify the request was made correctly
            mock_put.assert_called_once_with(
                "http://localhost:5000/api/cart/1",
                json={"quantity": 5},
                timeout=5
            )

            # Verify the result
            assert result['id'] == 1
            assert result['quantity'] == 5
            assert result['line_total'] == 25000.00

            # Verify logging was called (Requirement 8.3)
            mock_logger.log_backend_call.assert_called_once()
            call_args = mock_logger.log_backend_call.call_args[1]
            assert call_args['endpoint'] == '/api/cart/1'
            assert call_args['status_code'] == 200
            assert 'response_time_ms' in call_args

    @patch('logger.get_logger')
    def test_update_cart_item_to_zero_removes_item(self, mock_get_logger):
        """Test updating cart item quantity to 0 removes the item (returns 204)."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 204

        with patch.object(client.session, 'put', return_value=mock_response) as mock_put:
            result = client.update_cart_item(cart_item_id=1, quantity=0)

            # Verify the request was made correctly
            mock_put.assert_called_once_with(
                "http://localhost:5000/api/cart/1",
                json={"quantity": 0},
                timeout=5
            )

            # Verify the result indicates removal
            assert result['message'] == "Item removed from cart"

            # Verify logging was called
            mock_logger.log_backend_call.assert_called_once()

    @patch('logger.get_logger')
    def test_update_cart_item_not_found(self, mock_get_logger):
        """Test update_cart_item raises CartItemNotFoundError for 404 (Requirement 7.4)."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 404

        with patch.object(client.session, 'put', return_value=mock_response):
            with pytest.raises(CartItemNotFoundError) as exc_info:
                client.update_cart_item(cart_item_id=999, quantity=5)

            assert "Cart item 999 not found" in str(exc_info.value)
            mock_logger.log_backend_call.assert_called_once()

    @patch('logger.get_logger')
    def test_update_cart_item_http_500_error(self, mock_get_logger):
        """Test update_cart_item handles 500 server error (Requirement 7.4)."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(response=mock_response)

        with patch.object(client.session, 'put', return_value=mock_response):
            with pytest.raises(BackendAPIError) as exc_info:
                client.update_cart_item(cart_item_id=1, quantity=5)

            assert "Could not update cart" in str(exc_info.value)
            mock_logger.log_error.assert_called_once()

    @patch('logger.get_logger')
    def test_update_cart_item_connection_error(self, mock_get_logger):
        """Test update_cart_item handles connection errors."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        with patch.object(client.session, 'put', side_effect=requests.exceptions.ConnectionError("Connection refused")):
            with pytest.raises(BackendAPIError) as exc_info:
                client.update_cart_item(cart_item_id=1, quantity=5)

            assert "Could not update cart" in str(exc_info.value)
            mock_logger.log_error.assert_called_once()


class TestRemoveCartItem:
    """Tests for remove_cart_item() method."""

    @patch('logger.get_logger')
    def test_remove_cart_item_success(self, mock_get_logger):
        """Test successful removal of cart item."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 204

        with patch.object(client.session, 'delete', return_value=mock_response) as mock_delete:
            result = client.remove_cart_item(cart_item_id=1)

            # Verify the request was made correctly
            mock_delete.assert_called_once_with(
                "http://localhost:5000/api/cart/1",
                timeout=5
            )

            # Verify the result
            assert result['message'] == "Item removed from cart"

            # Verify logging was called (Requirement 8.3)
            mock_logger.log_backend_call.assert_called_once()
            call_args = mock_logger.log_backend_call.call_args[1]
            assert call_args['endpoint'] == '/api/cart/1'
            assert call_args['status_code'] == 204
            assert 'response_time_ms' in call_args

    @patch('logger.get_logger')
    def test_remove_cart_item_not_found(self, mock_get_logger):
        """Test remove_cart_item raises CartItemNotFoundError for 404 (Requirement 7.4)."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 404

        with patch.object(client.session, 'delete', return_value=mock_response):
            with pytest.raises(CartItemNotFoundError) as exc_info:
                client.remove_cart_item(cart_item_id=999)

            assert "Cart item 999 not found" in str(exc_info.value)
            mock_logger.log_backend_call.assert_called_once()

    @patch('logger.get_logger')
    def test_remove_cart_item_http_500_error(self, mock_get_logger):
        """Test remove_cart_item handles 500 server error (Requirement 7.4)."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(response=mock_response)

        with patch.object(client.session, 'delete', return_value=mock_response):
            with pytest.raises(BackendAPIError) as exc_info:
                client.remove_cart_item(cart_item_id=1)

            assert "Could not remove from cart" in str(exc_info.value)
            mock_logger.log_error.assert_called_once()

    @patch('logger.get_logger')
    def test_remove_cart_item_connection_error(self, mock_get_logger):
        """Test remove_cart_item handles connection errors."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        with patch.object(client.session, 'delete', side_effect=requests.exceptions.ConnectionError("Connection refused")):
            with pytest.raises(BackendAPIError) as exc_info:
                client.remove_cart_item(cart_item_id=1)

            assert "Could not remove from cart" in str(exc_info.value)
            mock_logger.log_error.assert_called_once()

    @patch('logger.get_logger')
    def test_remove_cart_item_with_different_ids(self, mock_get_logger):
        """Test remove_cart_item with various cart item IDs."""
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        test_ids = [1, 42, 999, 12345]

        for cart_item_id in test_ids:
            mock_response = Mock()
            mock_response.status_code = 204

            with patch.object(client.session, 'delete', return_value=mock_response) as mock_delete:
                result = client.remove_cart_item(cart_item_id=cart_item_id)

                mock_delete.assert_called_with(
                    f"http://localhost:5000/api/cart/{cart_item_id}",
                    timeout=5
                )
                assert result['message'] == "Item removed from cart"


class TestHealthCheck:
    """Tests for health_check() method."""

    def test_health_check_success(self):
        """Test health_check returns True when backend is reachable."""
        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 200

        with patch.object(client.session, 'get', return_value=mock_response) as mock_get:
            result = client.health_check()

            # Verify the request was made with 2-second timeout (Requirement 11.4)
            mock_get.assert_called_once_with(
                "http://localhost:5000/api/products",
                timeout=2
            )

            # Verify the result
            assert result is True

    def test_health_check_failure_non_200(self):
        """Test health_check returns False when backend returns non-200 status."""
        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 500

        with patch.object(client.session, 'get', return_value=mock_response):
            result = client.health_check()
            assert result is False

    def test_health_check_failure_connection_error(self):
        """Test health_check returns False when connection fails."""
        client = BackendAPIClient(base_url="http://localhost:5000")

        with patch.object(client.session, 'get', side_effect=requests.exceptions.ConnectionError("Connection refused")):
            result = client.health_check()
            assert result is False

    def test_health_check_failure_timeout(self):
        """Test health_check returns False when request times out."""
        client = BackendAPIClient(base_url="http://localhost:5000")

        with patch.object(client.session, 'get', side_effect=requests.exceptions.Timeout("Request timed out")):
            result = client.health_check()
            assert result is False

    def test_health_check_uses_2_second_timeout(self):
        """Test health_check uses 2-second timeout (Requirement 11.4)."""
        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 200

        with patch.object(client.session, 'get', return_value=mock_response) as mock_get:
            client.health_check()

            # Verify 2-second timeout is used
            call_args = mock_get.call_args
            assert call_args[1]['timeout'] == 2


class TestCartAPIRequirements:
    """Tests verifying specific requirements for cart API methods."""

    @patch('logger.get_logger')
    def test_requirement_6_1_add_to_cart_calls_backend(self, mock_get_logger):
        """
        Requirement 6.1: WHEN a user requests to add a product to cart,
        THE Chatbot_Service SHALL call the Backend_API cart endpoint with the product identifier.
        """
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 201
        mock_response.json.return_value = {'data': {'id': 1, 'product_id': 10, 'quantity': 1}}

        with patch.object(client.session, 'post', return_value=mock_response) as mock_post:
            client.add_to_cart(product_id=10, quantity=1)

            # Verify the backend API was called with product identifier
            mock_post.assert_called_once()
            call_args = mock_post.call_args
            assert call_args[1]['json']['product_id'] == 10

    @patch('logger.get_logger')
    def test_requirement_6_4_view_cart_queries_backend(self, mock_get_logger):
        """
        Requirement 6.4: THE Chatbot_Service SHALL support requests to view
        current cart contents by querying the Backend_API.
        """
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'data': {'items': [], 'total': 0.00}}

        with patch.object(client.session, 'get', return_value=mock_response) as mock_get:
            client.get_cart()

            # Verify the backend API was called
            mock_get.assert_called_once()

    @patch('logger.get_logger')
    def test_requirement_6_5_update_and_remove_through_backend(self, mock_get_logger):
        """
        Requirement 6.5: THE Chatbot_Service SHALL support requests to update
        or remove cart items through Backend_API calls.
        """
        mock_logger = Mock()
        mock_get_logger.return_value = mock_logger

        client = BackendAPIClient(base_url="http://localhost:5000")

        # Test update
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'data': {'id': 1, 'quantity': 5}}

        with patch.object(client.session, 'put', return_value=mock_response) as mock_put:
            client.update_cart_item(cart_item_id=1, quantity=5)
            mock_put.assert_called_once()

        # Test remove
        mock_response.status_code = 204

        with patch.object(client.session, 'delete', return_value=mock_response) as mock_delete:
            client.remove_cart_item(cart_item_id=1)
            mock_delete.assert_called_once()
