"""
Backend API Client for communicating with the Node.js backend.

This module provides a client for making HTTP requests to the backend API
with retry logic, timeout handling, and custom exceptions for different error types.

Requirements: 7.1, 7.2, 7.5
"""

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


# Custom Exceptions

class BackendAPIError(Exception):
    """
    Base exception for backend API errors.

    This is the parent exception for all backend API-related errors.
    Catch this to handle any backend communication error.
    """
    pass


class ProductNotFoundError(BackendAPIError):
    """
    Raised when a product does not exist.

    This exception is raised when the backend returns a 404 error
    for a product-related request.
    """
    pass


class CartItemNotFoundError(BackendAPIError):
    """
    Raised when a cart item does not exist.

    This exception is raised when the backend returns a 404 error
    for a cart item-related request.
    """
    pass


class InvalidRequestError(BackendAPIError):
    """
    Raised when request parameters are invalid.

    This exception is raised when the backend returns a 400 error
    indicating invalid request parameters.
    """
    pass


class BackendAPIClient:
    """
    HTTP client for communicating with the Node.js backend API.

    Features:
    - Automatic retry on transient failures (1 retry) - Requirement 7.5
    - 5-second timeout for all requests - Requirement 7.2
    - Custom exceptions for different error types
    - Structured logging of all API calls

    Requirements:
    - 7.1: Read Backend API base URL from environment variable
    - 7.2: Use HTTP client with timeout of 5 seconds
    - 7.5: Retry request once before failing when Backend API is unreachable
    """

    def __init__(self, base_url: str, timeout: int = 5):
        """
        Initialize the backend API client.

        Args:
            base_url: Base URL of the backend API (e.g., http://localhost:5000)
            timeout: Request timeout in seconds (default: 5)

        Requirement 7.1: The base_url should come from BACKEND_API_URL environment variable
        Requirement 7.2: Default timeout is 5 seconds
        """
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout

        # Configure session with retry logic
        # Requirement 7.5: Retry the request once before failing
        self.session = requests.Session()
        retry_strategy = Retry(
            total=1,  # Retry once on failure
            backoff_factor=0.5,  # Wait 0.5s before retry
            status_forcelist=[500, 502, 503, 504],  # Retry on server errors
            allowed_methods=["GET", "POST", "PUT", "DELETE"]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

    def get_products(self):
        """
        Fetch all products from the catalog.

        Makes a GET request to /api/products endpoint and returns the list
        of all products in the catalog.

        Returns:
            list: List of product dictionaries with id, part_number, description, price

        Raises:
            BackendAPIError: When the API call fails or returns an error

        Requirements:
        - 5.1: Query Backend_API for Product_Catalog information
        - 7.3: Parse JSON response when Backend_API returns HTTP 2xx
        - 7.4: Log error and inform user when Backend_API returns HTTP 4xx or 5xx
        - 8.3: Log all Backend_API calls with endpoint, status code, and response time
        """
        from logger import get_logger
        import time

        logger = get_logger()
        endpoint = f"{self.base_url}/api/products"
        start_time = time.time()

        try:
            response = self.session.get(endpoint, timeout=self.timeout)
            response_time_ms = (time.time() - start_time) * 1000

            # Log the API call (Requirement 8.3)
            logger.log_backend_call(
                endpoint="/api/products",
                status_code=response.status_code,
                response_time_ms=response_time_ms
            )

            # Requirement 7.3: Parse JSON response when Backend_API returns HTTP 2xx
            response.raise_for_status()
            data = response.json()
            return data.get('data', [])

        except requests.exceptions.HTTPError as e:
            # Requirement 7.4: Log error when Backend_API returns HTTP 4xx or 5xx
            logger.log_error(
                error_type="HTTPError",
                message=f"Failed to fetch products: HTTP {e.response.status_code}",
                context={"endpoint": "/api/products", "status_code": e.response.status_code}
            )
            raise BackendAPIError(f"Could not retrieve products: {str(e)}")

        except requests.exceptions.RequestException as e:
            # Requirement 7.4: Log error when request fails
            logger.log_error(
                error_type="RequestException",
                message=f"Failed to fetch products: {str(e)}",
                context={"endpoint": "/api/products"}
            )
            raise BackendAPIError(f"Could not retrieve products: {str(e)}")

    def get_product(self, product_id):
        """
        Fetch specific product details by ID.

        Makes a GET request to /api/products/:id endpoint and returns
        detailed information about a specific product.

        Args:
            product_id (int): The unique identifier of the product

        Returns:
            dict: Product dictionary with id, part_number, description, price, created_at

        Raises:
            ProductNotFoundError: When the product does not exist (HTTP 404)
            BackendAPIError: When the API call fails or returns an error

        Requirements:
        - 5.1: Query Backend_API for Product_Catalog information
        - 7.3: Parse JSON response when Backend_API returns HTTP 2xx
        - 7.4: Log error and inform user when Backend_API returns HTTP 4xx or 5xx
        - 8.3: Log all Backend_API calls with endpoint, status code, and response time
        """
        from logger import get_logger
        import time

        logger = get_logger()
        endpoint = f"{self.base_url}/api/products/{product_id}"
        start_time = time.time()

        try:
            response = self.session.get(endpoint, timeout=self.timeout)
            response_time_ms = (time.time() - start_time) * 1000

            # Log the API call (Requirement 8.3)
            logger.log_backend_call(
                endpoint=f"/api/products/{product_id}",
                status_code=response.status_code,
                response_time_ms=response_time_ms
            )

            # Handle 404 specifically (Requirement 7.4)
            if response.status_code == 404:
                raise ProductNotFoundError(f"Product {product_id} not found")

            # Requirement 7.3: Parse JSON response when Backend_API returns HTTP 2xx
            response.raise_for_status()
            data = response.json()
            return data.get('data', {})

        except ProductNotFoundError:
            # Re-raise ProductNotFoundError without wrapping
            raise

        except requests.exceptions.HTTPError as e:
            # Requirement 7.4: Log error when Backend_API returns HTTP 4xx or 5xx
            logger.log_error(
                error_type="HTTPError",
                message=f"Failed to fetch product {product_id}: HTTP {e.response.status_code}",
                context={"endpoint": f"/api/products/{product_id}", "status_code": e.response.status_code}
            )
            raise BackendAPIError(f"Could not retrieve product: {str(e)}")

        except requests.exceptions.RequestException as e:
            # Requirement 7.4: Log error when request fails
            logger.log_error(
                error_type="RequestException",
                message=f"Failed to fetch product {product_id}: {str(e)}",
                context={"endpoint": f"/api/products/{product_id}"}
            )
            raise BackendAPIError(f"Could not retrieve product: {str(e)}")

    def get_cart(self):
        """
        Fetch current shopping cart contents.

        Makes a GET request to /api/cart endpoint and returns the cart
        with all items, product details, and totals.

        Returns:
            dict: Cart dictionary with items (list), total (float), and item_count (int)

        Raises:
            BackendAPIError: When the API call fails or returns an error

        Requirements:
        - 6.4: Support requests to view current cart contents by querying Backend_API
        - 7.3: Parse JSON response when Backend_API returns HTTP 2xx
        - 7.4: Log error and inform user when Backend_API returns HTTP 4xx or 5xx
        - 8.3: Log all Backend_API calls with endpoint, status code, and response time
        """
        from logger import get_logger
        import time

        logger = get_logger()
        endpoint = f"{self.base_url}/api/cart"
        start_time = time.time()

        try:
            response = self.session.get(endpoint, timeout=self.timeout)
            response_time_ms = (time.time() - start_time) * 1000

            # Log the API call (Requirement 8.3)
            logger.log_backend_call(
                endpoint="/api/cart",
                status_code=response.status_code,
                response_time_ms=response_time_ms
            )

            # Requirement 7.3: Parse JSON response when Backend_API returns HTTP 2xx
            response.raise_for_status()
            data = response.json()
            return data.get('data', {})

        except requests.exceptions.HTTPError as e:
            # Requirement 7.4: Log error when Backend_API returns HTTP 4xx or 5xx
            logger.log_error(
                error_type="HTTPError",
                message=f"Failed to fetch cart: HTTP {e.response.status_code}",
                context={"endpoint": "/api/cart", "status_code": e.response.status_code}
            )
            raise BackendAPIError(f"Could not retrieve cart: {str(e)}")

        except requests.exceptions.RequestException as e:
            # Requirement 7.4: Log error when request fails
            logger.log_error(
                error_type="RequestException",
                message=f"Failed to fetch cart: {str(e)}",
                context={"endpoint": "/api/cart"}
            )
            raise BackendAPIError(f"Could not retrieve cart: {str(e)}")

    def add_to_cart(self, product_id, quantity):
        """
        Add a product to the shopping cart.

        Makes a POST request to /api/cart endpoint to add an item to the cart.
        If the product already exists in the cart, the quantity is updated.

        Args:
            product_id (int): The unique identifier of the product to add
            quantity (int): Number of units to add (must be positive)

        Returns:
            dict: Cart item dictionary with id, product_id, quantity, product details, line_total

        Raises:
            ProductNotFoundError: When the product does not exist (HTTP 404)
            InvalidRequestError: When request parameters are invalid (HTTP 400)
            BackendAPIError: When the API call fails or returns an error

        Requirements:
        - 6.1: Call Backend_API cart endpoint with product identifier when user requests to add product
        - 6.2: Confirm action to user when cart operation succeeds
        - 6.3: Inform user and explain reason when cart operation fails
        - 7.3: Parse JSON response when Backend_API returns HTTP 2xx
        - 7.4: Log error and inform user when Backend_API returns HTTP 4xx or 5xx
        - 8.3: Log all Backend_API calls with endpoint, status code, and response time
        """
        from logger import get_logger
        import time

        logger = get_logger()
        endpoint = f"{self.base_url}/api/cart"
        start_time = time.time()

        try:
            response = self.session.post(
                endpoint,
                json={"product_id": product_id, "quantity": quantity},
                timeout=self.timeout
            )
            response_time_ms = (time.time() - start_time) * 1000

            # Log the API call (Requirement 8.3)
            logger.log_backend_call(
                endpoint="/api/cart",
                status_code=response.status_code,
                response_time_ms=response_time_ms
            )

            # Handle specific error codes (Requirement 7.4)
            if response.status_code == 404:
                raise ProductNotFoundError(f"Product {product_id} not found")
            elif response.status_code == 400:
                error_data = response.json()
                error_message = error_data.get('error', {}).get('message', 'Invalid request')
                raise InvalidRequestError(error_message)

            # Requirement 7.3: Parse JSON response when Backend_API returns HTTP 2xx
            response.raise_for_status()
            data = response.json()
            return data.get('data', {})

        except (ProductNotFoundError, InvalidRequestError):
            # Re-raise specific exceptions without wrapping
            raise

        except requests.exceptions.HTTPError as e:
            # Requirement 7.4: Log error when Backend_API returns HTTP 4xx or 5xx
            logger.log_error(
                error_type="HTTPError",
                message=f"Failed to add to cart: HTTP {e.response.status_code}",
                context={"endpoint": "/api/cart", "product_id": product_id, "quantity": quantity, "status_code": e.response.status_code}
            )
            raise BackendAPIError(f"Could not add to cart: {str(e)}")

        except requests.exceptions.RequestException as e:
            # Requirement 7.4: Log error when request fails
            logger.log_error(
                error_type="RequestException",
                message=f"Failed to add to cart: {str(e)}",
                context={"endpoint": "/api/cart", "product_id": product_id, "quantity": quantity}
            )
            raise BackendAPIError(f"Could not add to cart: {str(e)}")

    def update_cart_item(self, cart_item_id, quantity):
        """
        Update the quantity of an item in the shopping cart.

        Makes a PUT request to /api/cart/:id endpoint to update the quantity
        of a cart item. If quantity is 0, the item is removed from the cart.

        Args:
            cart_item_id (int): The cart item ID (not product ID)
            quantity (int): New quantity (0 to remove, must be non-negative)

        Returns:
            dict: Updated cart item dictionary or removal confirmation message

        Raises:
            CartItemNotFoundError: When the cart item does not exist (HTTP 404)
            BackendAPIError: When the API call fails or returns an error

        Requirements:
        - 6.5: Support requests to update cart items through Backend_API calls
        - 6.2: Confirm action to user when cart operation succeeds
        - 6.3: Inform user and explain reason when cart operation fails
        - 7.3: Parse JSON response when Backend_API returns HTTP 2xx
        - 7.4: Log error and inform user when Backend_API returns HTTP 4xx or 5xx
        - 8.3: Log all Backend_API calls with endpoint, status code, and response time
        """
        from logger import get_logger
        import time

        logger = get_logger()
        endpoint = f"{self.base_url}/api/cart/{cart_item_id}"
        start_time = time.time()

        try:
            response = self.session.put(
                endpoint,
                json={"quantity": quantity},
                timeout=self.timeout
            )
            response_time_ms = (time.time() - start_time) * 1000

            # Log the API call (Requirement 8.3)
            logger.log_backend_call(
                endpoint=f"/api/cart/{cart_item_id}",
                status_code=response.status_code,
                response_time_ms=response_time_ms
            )

            # Handle 404 specifically (Requirement 7.4)
            if response.status_code == 404:
                raise CartItemNotFoundError(f"Cart item {cart_item_id} not found")

            # Handle 204 No Content (item removed when quantity is 0)
            if response.status_code == 204:
                return {"message": "Item removed from cart"}

            # Requirement 7.3: Parse JSON response when Backend_API returns HTTP 2xx
            response.raise_for_status()
            data = response.json()
            return data.get('data', {})

        except CartItemNotFoundError:
            # Re-raise CartItemNotFoundError without wrapping
            raise

        except requests.exceptions.HTTPError as e:
            # Requirement 7.4: Log error when Backend_API returns HTTP 4xx or 5xx
            logger.log_error(
                error_type="HTTPError",
                message=f"Failed to update cart item {cart_item_id}: HTTP {e.response.status_code}",
                context={"endpoint": f"/api/cart/{cart_item_id}", "quantity": quantity, "status_code": e.response.status_code}
            )
            raise BackendAPIError(f"Could not update cart: {str(e)}")

        except requests.exceptions.RequestException as e:
            # Requirement 7.4: Log error when request fails
            logger.log_error(
                error_type="RequestException",
                message=f"Failed to update cart item {cart_item_id}: {str(e)}",
                context={"endpoint": f"/api/cart/{cart_item_id}", "quantity": quantity}
            )
            raise BackendAPIError(f"Could not update cart: {str(e)}")

    def remove_cart_item(self, cart_item_id):
        """
        Remove an item from the shopping cart.

        Makes a DELETE request to /api/cart/:id endpoint to remove a cart item.

        Args:
            cart_item_id (int): The cart item ID to remove

        Returns:
            dict: Confirmation message indicating successful removal

        Raises:
            CartItemNotFoundError: When the cart item does not exist (HTTP 404)
            BackendAPIError: When the API call fails or returns an error

        Requirements:
        - 6.5: Support requests to remove cart items through Backend_API calls
        - 6.2: Confirm action to user when cart operation succeeds
        - 6.3: Inform user and explain reason when cart operation fails
        - 7.3: Parse JSON response when Backend_API returns HTTP 2xx
        - 7.4: Log error and inform user when Backend_API returns HTTP 4xx or 5xx
        - 8.3: Log all Backend_API calls with endpoint, status code, and response time
        """
        from logger import get_logger
        import time

        logger = get_logger()
        endpoint = f"{self.base_url}/api/cart/{cart_item_id}"
        start_time = time.time()

        try:
            response = self.session.delete(endpoint, timeout=self.timeout)
            response_time_ms = (time.time() - start_time) * 1000

            # Log the API call (Requirement 8.3)
            logger.log_backend_call(
                endpoint=f"/api/cart/{cart_item_id}",
                status_code=response.status_code,
                response_time_ms=response_time_ms
            )

            # Handle 404 specifically (Requirement 7.4)
            if response.status_code == 404:
                raise CartItemNotFoundError(f"Cart item {cart_item_id} not found")

            # Requirement 7.3: Handle successful response (typically 204 No Content)
            response.raise_for_status()
            return {"message": "Item removed from cart"}

        except CartItemNotFoundError:
            # Re-raise CartItemNotFoundError without wrapping
            raise

        except requests.exceptions.HTTPError as e:
            # Requirement 7.4: Log error when Backend_API returns HTTP 4xx or 5xx
            logger.log_error(
                error_type="HTTPError",
                message=f"Failed to remove cart item {cart_item_id}: HTTP {e.response.status_code}",
                context={"endpoint": f"/api/cart/{cart_item_id}", "status_code": e.response.status_code}
            )
            raise BackendAPIError(f"Could not remove from cart: {str(e)}")

        except requests.exceptions.RequestException as e:
            # Requirement 7.4: Log error when request fails
            logger.log_error(
                error_type="RequestException",
                message=f"Failed to remove cart item {cart_item_id}: {str(e)}",
                context={"endpoint": f"/api/cart/{cart_item_id}"}
            )
            raise BackendAPIError(f"Could not remove from cart: {str(e)}")

    def health_check(self):
        """
        Check if the backend API is reachable.

        Makes a quick GET request to /api/products endpoint with a 2-second
        timeout to verify backend connectivity.

        Returns:
            bool: True if backend is reachable and returns 200, False otherwise

        Requirements:
        - 11.4: Check Backend_API connectivity for health endpoint
        """
        try:
            response = self.session.get(
                f"{self.base_url}/api/products",
                timeout=2
            )
            return response.status_code == 200
        except:
            return False
