"""
Configuration management for the Shopping Assistant Chatbot service.

This module uses Pydantic for environment variable validation and type checking.
All configuration is loaded from environment variables at startup.
"""

from pydantic import Field, field_validator, model_validator, ConfigDict
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    Required variables:
    - AWS_ACCESS_KEY_ID or AWS_BEARER_TOKEN_BEDROCK
    - AWS_SECRET_ACCESS_KEY (if using access key authentication)
    - BACKEND_API_URL

    Optional variables have sensible defaults.
    """

    # AWS Credentials - Requirements 1.1, 1.2, 1.3
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_session_token: Optional[str] = None
    aws_bearer_token_bedrock: Optional[str] = None
    aws_region: str = Field(default="us-east-1", description="AWS region for Bedrock")

    # Backend API - Requirement 7.1
    backend_api_url: str = Field(..., description="Base URL of the Node.js backend API")
    backend_api_timeout: int = Field(default=5, ge=1, le=30, description="Timeout for backend API calls in seconds")

    # HTTP Server - Requirements 3.6
    chatbot_port: int = Field(default=8000, description="Port for the HTTP server")
    chatbot_host: str = Field(default="0.0.0.0", description="Host binding for the HTTP server")

    # Logging - Requirement 8.5
    log_level: str = Field(default="INFO", description="Logging level")

    # Service Configuration
    service_version: str = Field(default="1.0.0", description="Service version")
    max_response_words: int = Field(default=500, ge=50, le=1000, description="Maximum words in chatbot responses")
    session_max_age_hours: int = Field(default=24, ge=1, le=168, description="Session expiration time in hours")

    # CORS Configuration - Requirement 3.5
    cors_origins: str = Field(default="http://localhost:3000", description="Comma-separated list of allowed CORS origins")

    @model_validator(mode='after')
    def validate_aws_credentials(self):
        """
        Validate AWS credentials configuration.

        Requirements 1.1, 1.2, 1.3:
        - Either AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY must be provided
        - Or AWS_BEARER_TOKEN_BEDROCK must be provided
        - AWS_SESSION_TOKEN is optional when using access key authentication
        """
        access_key = self.aws_access_key_id
        secret_key = self.aws_secret_access_key
        bearer_token = self.aws_bearer_token_bedrock

        # If using access key auth, both access key and secret key must be present
        if access_key and not secret_key:
            raise ValueError('AWS_SECRET_ACCESS_KEY is required when AWS_ACCESS_KEY_ID is provided')
        if secret_key and not access_key:
            raise ValueError('AWS_ACCESS_KEY_ID is required when AWS_SECRET_ACCESS_KEY is provided')

        # Check if we have either access key auth or bearer token auth
        has_access_key_auth = access_key and secret_key
        has_bearer_token_auth = bearer_token

        if not has_access_key_auth and not has_bearer_token_auth:
            raise ValueError(
                'AWS credentials required: either provide AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY, '
                'or provide AWS_BEARER_TOKEN_BEDROCK'
            )

        return self

    @field_validator('log_level')
    @classmethod
    def validate_log_level(cls, v):
        """
        Validate log level is one of the standard Python logging levels.

        Requirement 8.5: Support configurable log levels through environment variable.
        """
        valid_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        v_upper = v.upper()
        if v_upper not in valid_levels:
            raise ValueError(f'log_level must be one of {valid_levels}, got: {v}')
        return v_upper

    @field_validator('chatbot_port')
    @classmethod
    def validate_port(cls, v):
        """
        Validate port is in the valid range for non-privileged ports.

        Requirement 3.6: HTTP server shall listen on a configurable port.
        """
        if not 1024 <= v <= 65535:
            raise ValueError(f'chatbot_port must be between 1024 and 65535, got: {v}')
        return v

    @field_validator('backend_api_url')
    @classmethod
    def validate_backend_url(cls, v):
        """
        Validate backend API URL format.

        Requirement 7.1: Read Backend API base URL from environment variable.
        """
        if not v:
            raise ValueError('backend_api_url cannot be empty')

        # Remove trailing slashes for consistency
        v = v.rstrip('/')

        # Basic URL validation
        if not (v.startswith('http://') or v.startswith('https://')):
            raise ValueError(f'backend_api_url must start with http:// or https://, got: {v}')

        return v

    @field_validator('cors_origins')
    @classmethod
    def validate_cors_origins(cls, v):
        """
        Validate CORS origins format.

        Requirement 3.5: Support CORS to allow requests from frontend origin.
        """
        if not v:
            raise ValueError('cors_origins cannot be empty')

        # Split by comma and strip whitespace
        origins = [origin.strip() for origin in v.split(',')]

        # Validate each origin
        for origin in origins:
            if not origin:
                raise ValueError('cors_origins contains empty origin')
            if not (origin.startswith('http://') or origin.startswith('https://') or origin == '*'):
                raise ValueError(f'Invalid CORS origin format: {origin}')

        return v

    def get_cors_origins_list(self) -> list:
        """
        Get CORS origins as a list.

        Returns:
            List of origin strings
        """
        return [origin.strip() for origin in self.cors_origins.split(',')]

    model_config = ConfigDict(
        env_file='.env',
        case_sensitive=False,  # Allow case-insensitive environment variable names
        extra='ignore'  # Ignore extra fields not defined in the model
    )

    def __repr__(self):
        """
        String representation that masks sensitive credentials.
        """
        return (
            f"Settings("
            f"aws_region={self.aws_region}, "
            f"backend_api_url={self.backend_api_url}, "
            f"chatbot_port={self.chatbot_port}, "
            f"log_level={self.log_level}, "
            f"service_version={self.service_version}"
            f")"
        )


class ConfigurationError(Exception):
    """Raised when configuration is invalid or missing required values."""
    pass


def load_settings() -> Settings:
    """
    Load and validate settings from environment variables.

    Requirements 12.1, 12.3, 12.4, 1.4:
    - Read all configuration from environment variables at startup
    - Validate all required environment variables
    - Log which variables are missing and fail to start
    - Fail fast on configuration errors at startup

    Returns:
        Settings: Validated settings object

    Raises:
        ConfigurationError: If configuration is invalid or missing required values
    """
    import sys
    import os

    try:
        settings = Settings()
        return settings
    except ValueError as e:
        # Pydantic validation errors - these are descriptive about what's wrong
        error_str = str(e)

        # Check for missing required fields and provide helpful messages
        if 'backend_api_url' in error_str.lower() and 'BACKEND_API_URL' not in os.environ:
            print("ERROR: Required environment variable BACKEND_API_URL is missing", file=sys.stderr)

        # Check AWS credentials for missing field errors
        if 'aws' in error_str.lower():
            has_access_key = 'AWS_ACCESS_KEY_ID' in os.environ
            has_secret_key = 'AWS_SECRET_ACCESS_KEY' in os.environ
            has_bearer_token = 'AWS_BEARER_TOKEN_BEDROCK' in os.environ

            if not has_bearer_token and not (has_access_key and has_secret_key):
                print("ERROR: AWS credentials are required. Provide either:", file=sys.stderr)
                print("  - AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY, or", file=sys.stderr)
                print("  - AWS_BEARER_TOKEN_BEDROCK", file=sys.stderr)

        error_msg = f"Configuration validation failed: {error_str}"
        print(f"ERROR: {error_msg}", file=sys.stderr)
        raise ConfigurationError(error_msg) from e
    except Exception as e:
        # Other unexpected errors
        error_msg = f"Configuration error: {str(e)}"
        print(f"ERROR: {error_msg}", file=sys.stderr)
        raise ConfigurationError(error_msg) from e
