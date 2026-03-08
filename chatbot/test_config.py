"""
Unit tests for the configuration module.

Tests validation logic for environment variables, port ranges, log levels,
and AWS credential configurations.
"""

import pytest
import os
from config import Settings, load_settings, ConfigurationError


class TestSettingsValidation:
    """Test Settings class validation logic"""

    def test_valid_access_key_authentication(self, monkeypatch):
        """Test valid AWS access key authentication configuration"""
        monkeypatch.setenv('AWS_ACCESS_KEY_ID', 'test_key_id')
        monkeypatch.setenv('AWS_SECRET_ACCESS_KEY', 'test_secret_key')
        monkeypatch.setenv('BACKEND_API_URL', 'http://localhost:5000')

        settings = Settings()

        assert settings.aws_access_key_id == 'test_key_id'
        assert settings.aws_secret_access_key == 'test_secret_key'
        assert settings.backend_api_url == 'http://localhost:5000'

    def test_valid_bearer_token_authentication(self, monkeypatch):
        """Test valid AWS bearer token authentication configuration"""
        monkeypatch.setenv('AWS_BEARER_TOKEN_BEDROCK', 'test_bearer_token')
        monkeypatch.setenv('BACKEND_API_URL', 'http://localhost:5000')

        settings = Settings()

        assert settings.aws_bearer_token_bedrock == 'test_bearer_token'
        assert settings.backend_api_url == 'http://localhost:5000'

    def test_missing_aws_credentials(self, monkeypatch):
        """Test that missing AWS credentials raises validation error"""
        monkeypatch.setenv('BACKEND_API_URL', 'http://localhost:5000')

        with pytest.raises(Exception) as exc_info:
            Settings()

        assert 'AWS credentials required' in str(exc_info.value)

    def test_access_key_without_secret_key(self, monkeypatch):
        """Test that access key without secret key raises validation error"""
        monkeypatch.setenv('AWS_ACCESS_KEY_ID', 'test_key_id')
        monkeypatch.setenv('BACKEND_API_URL', 'http://localhost:5000')

        with pytest.raises(Exception) as exc_info:
            Settings()

        assert 'AWS_SECRET_ACCESS_KEY is required' in str(exc_info.value)

    def test_secret_key_without_access_key(self, monkeypatch):
        """Test that secret key without access key raises validation error"""
        monkeypatch.setenv('AWS_SECRET_ACCESS_KEY', 'test_secret_key')
        monkeypatch.setenv('BACKEND_API_URL', 'http://localhost:5000')

        with pytest.raises(Exception) as exc_info:
            Settings()

        assert 'AWS_ACCESS_KEY_ID is required' in str(exc_info.value)

    def test_optional_session_token(self, monkeypatch):
        """Test that AWS session token is optional"""
        monkeypatch.setenv('AWS_ACCESS_KEY_ID', 'test_key_id')
        monkeypatch.setenv('AWS_SECRET_ACCESS_KEY', 'test_secret_key')
        monkeypatch.setenv('AWS_SESSION_TOKEN', 'test_session_token')
        monkeypatch.setenv('BACKEND_API_URL', 'http://localhost:5000')

        settings = Settings()

        assert settings.aws_session_token == 'test_session_token'

    def test_valid_port_range(self, monkeypatch):
        """Test that valid port numbers are accepted"""
        monkeypatch.setenv('AWS_ACCESS_KEY_ID', 'test_key_id')
        monkeypatch.setenv('AWS_SECRET_ACCESS_KEY', 'test_secret_key')
        monkeypatch.setenv('BACKEND_API_URL', 'http://localhost:5000')
        monkeypatch.setenv('CHATBOT_PORT', '8080')

        settings = Settings()

        assert settings.chatbot_port == 8080

    def test_invalid_port_too_low(self, monkeypatch):
        """Test that port below 1024 raises validation error"""
        monkeypatch.setenv('AWS_ACCESS_KEY_ID', 'test_key_id')
        monkeypatch.setenv('AWS_SECRET_ACCESS_KEY', 'test_secret_key')
        monkeypatch.setenv('BACKEND_API_URL', 'http://localhost:5000')
        monkeypatch.setenv('CHATBOT_PORT', '80')

        with pytest.raises(Exception) as exc_info:
            Settings()

        assert 'chatbot_port must be between 1024 and 65535' in str(exc_info.value)

    def test_invalid_port_too_high(self, monkeypatch):
        """Test that port above 65535 raises validation error"""
        monkeypatch.setenv('AWS_ACCESS_KEY_ID', 'test_key_id')
        monkeypatch.setenv('AWS_SECRET_ACCESS_KEY', 'test_secret_key')
        monkeypatch.setenv('BACKEND_API_URL', 'http://localhost:5000')
        monkeypatch.setenv('CHATBOT_PORT', '70000')

        with pytest.raises(Exception) as exc_info:
            Settings()

        assert 'chatbot_port must be between 1024 and 65535' in str(exc_info.value)

    def test_valid_log_levels(self, monkeypatch):
        """Test that valid log levels are accepted and normalized to uppercase"""
        monkeypatch.setenv('AWS_ACCESS_KEY_ID', 'test_key_id')
        monkeypatch.setenv('AWS_SECRET_ACCESS_KEY', 'test_secret_key')
        monkeypatch.setenv('BACKEND_API_URL', 'http://localhost:5000')

        valid_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']

        for level in valid_levels:
            monkeypatch.setenv('LOG_LEVEL', level.lower())
            settings = Settings()
            assert settings.log_level == level

    def test_invalid_log_level(self, monkeypatch):
        """Test that invalid log level raises validation error"""
        monkeypatch.setenv('AWS_ACCESS_KEY_ID', 'test_key_id')
        monkeypatch.setenv('AWS_SECRET_ACCESS_KEY', 'test_secret_key')
        monkeypatch.setenv('BACKEND_API_URL', 'http://localhost:5000')
        monkeypatch.setenv('LOG_LEVEL', 'INVALID')

        with pytest.raises(Exception) as exc_info:
            Settings()

        assert 'log_level must be one of' in str(exc_info.value)

    def test_backend_url_validation(self, monkeypatch):
        """Test backend URL validation and trailing slash removal"""
        monkeypatch.setenv('AWS_ACCESS_KEY_ID', 'test_key_id')
        monkeypatch.setenv('AWS_SECRET_ACCESS_KEY', 'test_secret_key')
        monkeypatch.setenv('BACKEND_API_URL', 'http://localhost:5000/')

        settings = Settings()

        # Trailing slash should be removed
        assert settings.backend_api_url == 'http://localhost:5000'

    def test_invalid_backend_url_no_protocol(self, monkeypatch):
        """Test that backend URL without protocol raises validation error"""
        monkeypatch.setenv('AWS_ACCESS_KEY_ID', 'test_key_id')
        monkeypatch.setenv('AWS_SECRET_ACCESS_KEY', 'test_secret_key')
        monkeypatch.setenv('BACKEND_API_URL', 'localhost:5000')

        with pytest.raises(Exception) as exc_info:
            Settings()

        assert 'must start with http:// or https://' in str(exc_info.value)

    def test_cors_origins_single(self, monkeypatch):
        """Test single CORS origin"""
        monkeypatch.setenv('AWS_ACCESS_KEY_ID', 'test_key_id')
        monkeypatch.setenv('AWS_SECRET_ACCESS_KEY', 'test_secret_key')
        monkeypatch.setenv('BACKEND_API_URL', 'http://localhost:5000')
        monkeypatch.setenv('CORS_ORIGINS', 'http://localhost:3000')

        settings = Settings()

        assert settings.cors_origins == 'http://localhost:3000'
        assert settings.get_cors_origins_list() == ['http://localhost:3000']

    def test_cors_origins_multiple(self, monkeypatch):
        """Test multiple CORS origins"""
        monkeypatch.setenv('AWS_ACCESS_KEY_ID', 'test_key_id')
        monkeypatch.setenv('AWS_SECRET_ACCESS_KEY', 'test_secret_key')
        monkeypatch.setenv('BACKEND_API_URL', 'http://localhost:5000')
        monkeypatch.setenv('CORS_ORIGINS', 'http://localhost:3000, https://example.com')

        settings = Settings()

        origins_list = settings.get_cors_origins_list()
        assert len(origins_list) == 2
        assert 'http://localhost:3000' in origins_list
        assert 'https://example.com' in origins_list

    def test_cors_origins_wildcard(self, monkeypatch):
        """Test wildcard CORS origin"""
        monkeypatch.setenv('AWS_ACCESS_KEY_ID', 'test_key_id')
        monkeypatch.setenv('AWS_SECRET_ACCESS_KEY', 'test_secret_key')
        monkeypatch.setenv('BACKEND_API_URL', 'http://localhost:5000')
        monkeypatch.setenv('CORS_ORIGINS', '*')

        settings = Settings()

        assert settings.get_cors_origins_list() == ['*']

    def test_default_values(self, monkeypatch):
        """Test that default values are applied for optional parameters"""
        monkeypatch.setenv('AWS_ACCESS_KEY_ID', 'test_key_id')
        monkeypatch.setenv('AWS_SECRET_ACCESS_KEY', 'test_secret_key')
        monkeypatch.setenv('BACKEND_API_URL', 'http://localhost:5000')

        settings = Settings()

        assert settings.aws_region == 'us-east-1'
        assert settings.chatbot_port == 8000
        assert settings.chatbot_host == '0.0.0.0'
        assert settings.log_level == 'INFO'
        assert settings.service_version == '1.0.0'
        assert settings.max_response_words == 500
        assert settings.session_max_age_hours == 24
        assert settings.cors_origins == 'http://localhost:3000'
        assert settings.backend_api_timeout == 5


class TestLoadSettings:
    """Test load_settings function"""

    def test_load_settings_success(self, monkeypatch):
        """Test successful settings loading"""
        monkeypatch.setenv('AWS_ACCESS_KEY_ID', 'test_key_id')
        monkeypatch.setenv('AWS_SECRET_ACCESS_KEY', 'test_secret_key')
        monkeypatch.setenv('BACKEND_API_URL', 'http://localhost:5000')

        settings = load_settings()

        assert isinstance(settings, Settings)
        assert settings.aws_access_key_id == 'test_key_id'

    def test_load_settings_failure_missing_credentials(self, monkeypatch, capsys):
        """Test that load_settings raises ConfigurationError with descriptive message for missing credentials"""
        monkeypatch.setenv('BACKEND_API_URL', 'http://localhost:5000')
        # Missing AWS credentials

        with pytest.raises(ConfigurationError) as exc_info:
            load_settings()

        # Check that error message is descriptive
        assert 'Configuration' in str(exc_info.value)

        # Check stderr output for descriptive error messages
        captured = capsys.readouterr()
        assert 'AWS credentials are required' in captured.err or 'AWS credentials required' in captured.err

    def test_load_settings_failure_missing_backend_url(self, monkeypatch, capsys):
        """Test that load_settings logs descriptive error for missing BACKEND_API_URL"""
        monkeypatch.setenv('AWS_ACCESS_KEY_ID', 'test_key_id')
        monkeypatch.setenv('AWS_SECRET_ACCESS_KEY', 'test_secret_key')
        # Missing BACKEND_API_URL

        with pytest.raises(ConfigurationError) as exc_info:
            load_settings()

        # Check that error is raised
        assert 'Configuration' in str(exc_info.value)

        # Check stderr output mentions the missing variable
        captured = capsys.readouterr()
        assert 'BACKEND_API_URL' in captured.err

    def test_load_settings_failure_invalid_port(self, monkeypatch, capsys):
        """Test that load_settings logs descriptive error for invalid port"""
        monkeypatch.setenv('AWS_ACCESS_KEY_ID', 'test_key_id')
        monkeypatch.setenv('AWS_SECRET_ACCESS_KEY', 'test_secret_key')
        monkeypatch.setenv('BACKEND_API_URL', 'http://localhost:5000')
        monkeypatch.setenv('CHATBOT_PORT', '100')  # Invalid port

        with pytest.raises(ConfigurationError) as exc_info:
            load_settings()

        # Check that error message is descriptive
        assert 'Configuration' in str(exc_info.value)

        # Check stderr output for validation error
        captured = capsys.readouterr()
        assert 'chatbot_port' in captured.err or 'port' in captured.err.lower()

    def test_load_settings_failure_invalid_log_level(self, monkeypatch, capsys):
        """Test that load_settings logs descriptive error for invalid log level"""
        monkeypatch.setenv('AWS_ACCESS_KEY_ID', 'test_key_id')
        monkeypatch.setenv('AWS_SECRET_ACCESS_KEY', 'test_secret_key')
        monkeypatch.setenv('BACKEND_API_URL', 'http://localhost:5000')
        monkeypatch.setenv('LOG_LEVEL', 'INVALID_LEVEL')

        with pytest.raises(ConfigurationError) as exc_info:
            load_settings()

        # Check that error message is descriptive
        assert 'Configuration' in str(exc_info.value)

        # Check stderr output for validation error
        captured = capsys.readouterr()
        assert 'log_level' in captured.err or 'LOG_LEVEL' in captured.err


class TestSettingsRepresentation:
    """Test Settings string representation"""

    def test_repr_masks_credentials(self, monkeypatch):
        """Test that __repr__ does not expose sensitive credentials"""
        monkeypatch.setenv('AWS_ACCESS_KEY_ID', 'test_key_id')
        monkeypatch.setenv('AWS_SECRET_ACCESS_KEY', 'test_secret_key')
        monkeypatch.setenv('BACKEND_API_URL', 'http://localhost:5000')

        settings = Settings()
        repr_str = repr(settings)

        # Should not contain sensitive credentials
        assert 'test_key_id' not in repr_str
        assert 'test_secret_key' not in repr_str

        # Should contain non-sensitive config
        assert 'aws_region' in repr_str
        assert 'backend_api_url' in repr_str
        assert 'chatbot_port' in repr_str
