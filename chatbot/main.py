"""
Main entry point for the Shopping Assistant Chatbot service.

This module starts the uvicorn server with the FastAPI application,
initializes components, and manages background tasks.

Requirements: 3.6, 13.1
"""

import asyncio
import sys

import uvicorn

from config import load_settings, ConfigurationError
from logger import get_logger
from server import app, setup_signal_handlers


async def session_cleanup_task(session_manager, max_age_hours: int, interval_minutes: int = 60):
    """
    Background task to periodically clean up old sessions.

    Args:
        session_manager: SessionManager instance
        max_age_hours: Maximum age of sessions in hours
        interval_minutes: Cleanup interval in minutes
    """
    logger = get_logger("chatbot.cleanup")

    while True:
        try:
            await asyncio.sleep(interval_minutes * 60)
            removed = session_manager.cleanup_old_sessions(max_age_hours)
            if removed > 0:
                logger.info(f"Cleaned up {removed} expired sessions")
        except asyncio.CancelledError:
            logger.info("Session cleanup task cancelled")
            break
        except Exception as e:
            logger.error(f"Error in session cleanup task: {e}")


def main():
    """
    Main entry point for the chatbot service.

    Requirements:
    - 3.6: Listen on configurable port specified by environment variable
    - 13.1: Run as standalone Python process independent of Backend_API
    """
    logger = get_logger("chatbot.main")

    try:
        # Load configuration
        logger.info("Loading configuration")
        settings = load_settings()

        # Update logger level from settings
        logger = get_logger("chatbot.main", level=settings.log_level)

        # Setup signal handlers for graceful shutdown
        setup_signal_handlers()

        logger.info(f"Starting chatbot service on {settings.chatbot_host}:{settings.chatbot_port}")
        logger.info(f"Backend API URL: {settings.backend_api_url}")
        logger.info(f"AWS Region: {settings.aws_region}")
        logger.info(f"Log Level: {settings.log_level}")

        # Start uvicorn server
        # Requirement 3.6: Run server on configured host and port
        uvicorn.run(
            app,
            host=settings.chatbot_host,
            port=settings.chatbot_port,
            log_level=settings.log_level.lower(),
            access_log=True
        )

    except ConfigurationError as e:
        logger.error(f"Configuration error: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Failed to start chatbot service: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
