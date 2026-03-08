"""
Strands agent implementation for shopping assistance.

This module provides the conversational AI agent using Strands SDK
with AWS Bedrock Nova Pro for natural language understanding and
response generation.
"""

import os
from typing import Dict, List, Optional

import boto3
from strands import Agent, tool
from strands.models import BedrockModel

from backend_client import (
    BackendAPIClient,
    BackendAPIError,
    ProductNotFoundError,
    CartItemNotFoundError,
    InvalidRequestError
)
from config import Settings
from logger import get_logger
from models import Session

logger = get_logger(__name__)


def initialize_bedrock_client(settings: Settings) -> boto3.client:
    """Initialize AWS Bedrock client with credentials from settings.

    Supports both access key authentication and bearer token authentication.

    Args:
        settings: Configuration settings with AWS credentials

    Returns:
        Configured boto3 Bedrock client

    Raises:
        Exception: If authentication fails or credentials are invalid
    """
    try:
        client_kwargs = {
            'service_name': 'bedrock-runtime',
            'region_name': settings.aws_region
        }

        # Use bearer token if provided, otherwise use access keys
        if settings.aws_bearer_token_bedrock:
            # Bearer token authentication
            client_kwargs['aws_access_key_id'] = 'BEARER_TOKEN'
            client_kwargs['aws_secret_access_key'] = settings.aws_bearer_token_bedrock
        else:
            # Access key authentication
            client_kwargs['aws_access_key_id'] = settings.aws_access_key_id
            client_kwargs['aws_secret_access_key'] = settings.aws_secret_access_key

            # Add session token if provided
            if settings.aws_session_token:
                client_kwargs['aws_session_token'] = settings.aws_session_token

        client = boto3.client(**client_kwargs)
        logger.info("AWS Bedrock client initialized successfully")
        return client

    except Exception as e:
        logger.error(f"Failed to initialize Bedrock client: {e}")
        raise


def create_shopping_agent(settings: Settings, backend_client: BackendAPIClient) -> Agent:
    """Create and configure the shopping assistant agent.

    Args:
        settings: Configuration settings
        backend_client: Client for backend API communication

    Returns:
        Configured Strands Agent instance

    Raises:
        Exception: If agent initialization fails
    """
    try:
        # Initialize Bedrock model with Nova Pro
        model = BedrockModel(
            model_id="us.amazon.nova-pro-v1:0",
            region_name=settings.aws_region,
            temperature=0.7,
            max_tokens=2048,
        )

        # Define tools for the agent
        tools = [
            create_search_products_tool(backend_client),
            create_get_product_details_tool(backend_client),
            create_add_to_cart_tool(backend_client),
            create_view_cart_tool(backend_client),
            create_update_cart_tool(backend_client),
            create_remove_from_cart_tool(backend_client)
        ]

        # Create agent with system prompt
        system_prompt = """You are a helpful shopping assistant for Smiths Detection,
a company specializing in detection equipment including X-ray scanners, trace detectors,
and security screening systems. Your role is to help customers find products, answer
questions about features and specifications, and assist with cart management.

Be professional, concise, and helpful. When presenting multiple products, organize them
clearly. Keep responses under 500 words. If you need more information to help the customer,
ask clarifying questions."""

        agent = Agent(
            model=model,
            tools=tools,
            system_prompt=system_prompt
        )

        logger.info("Shopping assistant agent created successfully")
        return agent

    except Exception as e:
        logger.error(f"Failed to create shopping agent: {e}")
        raise


def create_search_products_tool(backend_client: BackendAPIClient):
    """Create the search_products tool for the agent."""

    @tool
    def search_products(query: Optional[str] = None) -> dict:
        """Search for products in the catalog.

        If no query is provided, returns all products. Otherwise filters products
        by description or part number matching the query.

        Args:
            query: Optional search term to filter products

        Returns:
            Dictionary with 'products' list and 'count' of results
        """
        try:
            products = backend_client.get_products()

            if query:
                query_lower = query.lower()
                products = [
                    p for p in products
                    if query_lower in p.get('description', '').lower()
                    or query_lower in p.get('part_number', '').lower()
                ]

            return {
                "products": products,
                "count": len(products)
            }
        except BackendAPIError as e:
            logger.error(f"Error searching products: {e}")
            return {
                "error": "Unable to retrieve products at this time",
                "products": [],
                "count": 0
            }

    return search_products


def create_get_product_details_tool(backend_client: BackendAPIClient):
    """Create the get_product_details tool for the agent."""

    @tool
    def get_product_details(product_id: int) -> dict:
        """Get detailed information about a specific product.

        Args:
            product_id: The unique identifier of the product

        Returns:
            Product details including id, part_number, description, price, created_at
        """
        try:
            product = backend_client.get_product(product_id)
            return product
        except ProductNotFoundError:
            return {"error": f"Product with ID {product_id} not found"}
        except BackendAPIError as e:
            logger.error(f"Error getting product details: {e}")
            return {"error": "Unable to retrieve product details at this time"}

    return get_product_details


def create_add_to_cart_tool(backend_client: BackendAPIClient):
    """Create the add_to_cart tool for the agent."""

    @tool
    def add_to_cart(product_id: int, quantity: int = 1) -> dict:
        """Add a product to the shopping cart.

        Args:
            product_id: The unique identifier of the product to add
            quantity: Number of units to add (default: 1)

        Returns:
            Confirmation with cart item details
        """
        try:
            result = backend_client.add_to_cart(product_id, quantity)
            return {
                "success": True,
                "message": f"Added {quantity} unit(s) to cart",
                "data": result
            }
        except ProductNotFoundError:
            return {
                "success": False,
                "error": f"Product with ID {product_id} not found"
            }
        except InvalidRequestError as e:
            return {
                "success": False,
                "error": str(e)
            }
        except BackendAPIError as e:
            logger.error(f"Error adding to cart: {e}")
            return {
                "success": False,
                "error": "Unable to add item to cart at this time"
            }

    return add_to_cart


def create_view_cart_tool(backend_client: BackendAPIClient):
    """Create the view_cart tool for the agent."""

    @tool
    def view_cart() -> dict:
        """View current shopping cart contents.

        Returns:
            Cart items with product details, quantities, line totals, and cart total
        """
        try:
            cart = backend_client.get_cart()
            return cart
        except BackendAPIError as e:
            logger.error(f"Error viewing cart: {e}")
            return {
                "error": "Unable to retrieve cart at this time",
                "items": [],
                "total": 0
            }

    return view_cart


def create_update_cart_tool(backend_client: BackendAPIClient):
    """Create the update_cart_item tool for the agent."""

    @tool
    def update_cart_item(cart_item_id: int, quantity: int) -> dict:
        """Update the quantity of an item in the cart.

        Args:
            cart_item_id: The cart item ID (not product ID)
            quantity: New quantity (0 to remove)

        Returns:
            Updated cart item details or removal confirmation
        """
        try:
            result = backend_client.update_cart_item(cart_item_id, quantity)
            return {
                "success": True,
                "message": "Cart updated successfully",
                "data": result
            }
        except CartItemNotFoundError:
            return {
                "success": False,
                "error": f"Cart item with ID {cart_item_id} not found"
            }
        except BackendAPIError as e:
            logger.error(f"Error updating cart: {e}")
            return {
                "success": False,
                "error": "Unable to update cart at this time"
            }

    return update_cart_item


def create_remove_from_cart_tool(backend_client: BackendAPIClient):
    """Create the remove_from_cart tool for the agent."""

    @tool
    def remove_from_cart(cart_item_id: int) -> dict:
        """Remove an item from the shopping cart.

        Args:
            cart_item_id: The cart item ID to remove

        Returns:
            Confirmation of removal
        """
        try:
            result = backend_client.remove_cart_item(cart_item_id)
            return {
                "success": True,
                "message": "Item removed from cart",
                "data": result
            }
        except CartItemNotFoundError:
            return {
                "success": False,
                "error": f"Cart item with ID {cart_item_id} not found"
            }
        except BackendAPIError as e:
            logger.error(f"Error removing from cart: {e}")
            return {
                "success": False,
                "error": "Unable to remove item from cart at this time"
            }

    return remove_from_cart


def process_message(agent: Agent, session: Session, user_message: str) -> str:
    """Process a user message and generate a response.

    Args:
        agent: The Strands agent instance
        session: The conversation session
        user_message: The user's message text

    Returns:
        The agent's response text

    Raises:
        Exception: If message processing fails
    """
    try:
        # Add user message to session history
        session.add_message("user", user_message)

        # Build conversation history for agent context
        # Strands agents expect a list of message dicts with 'role' and 'content'
        conversation_history = [
            {"role": msg.role, "content": msg.content}
            for msg in session.messages[:-1]  # Exclude the just-added user message
        ]

        # Generate response using the agent
        # The agent will automatically use conversation history if we pass it
        result = agent(user_message)

        # Extract text from AgentResult object
        # The Strands agent returns an AgentResult, we need to get the text content
        if hasattr(result, 'content'):
            response_text = result.content
        elif hasattr(result, 'text'):
            response_text = result.text
        elif hasattr(result, 'message'):
            response_text = result.message
        elif isinstance(result, str):
            response_text = result
        else:
            # Fallback: convert to string
            response_text = str(result)

        # Add assistant response to session history
        session.add_message("assistant", response_text)

        logger.info(f"Processed message for session {session.session_id}")
        return response_text

    except Exception as e:
        logger.error(f"Error processing message: {e}", extra={
            "session_id": session.session_id,
            "error": str(e)
        })
        raise
