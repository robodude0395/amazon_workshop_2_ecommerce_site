"""
Data models for session management.

This module defines the data structures used to maintain conversation
contexts and message history for chatbot sessions.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List
import threading


@dataclass
class Message:
    """Single message in a conversation.

    Attributes:
        role: The message sender role ("user" or "assistant")
        content: The message text content
        timestamp: When the message was created
    """
    role: str
    content: str
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Session:
    """Conversation session with message history.

    Maintains conversation context for a single user session,
    including all messages exchanged and session metadata.

    Attributes:
        session_id: Unique identifier for the session
        messages: List of messages in conversation order
        created_at: When the session was created
        last_accessed: When the session was last used
    """
    session_id: str
    messages: List[Message] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_accessed: datetime = field(default_factory=datetime.utcnow)

    def add_message(self, role: str, content: str) -> None:
        """Add a message to the conversation history.

        Enforces a maximum of 100 messages per session. When the limit
        is exceeded, only the most recent 100 messages are retained.

        Args:
            role: The message sender role ("user" or "assistant")
            content: The message text content
        """
        self.messages.append(Message(role=role, content=content))

        # Enforce 100-message limit
        if len(self.messages) > 100:
            self.messages = self.messages[-100:]

        self.last_accessed = datetime.utcnow()


class SessionManager:
    """Manages conversation sessions for multiple users.

    Provides thread-safe access to session storage and cleanup
    of expired sessions.

    Attributes:
        sessions: Dictionary mapping session IDs to Session objects
        lock: Thread lock for safe concurrent access
    """

    def __init__(self):
        """Initialize the session manager."""
        self.sessions: Dict[str, Session] = {}
        self.lock = threading.Lock()

    def get_or_create_session(self, session_id: str) -> Session:
        """Retrieve an existing session or create a new one.

        Thread-safe method to get or create a session.

        Args:
            session_id: Unique session identifier

        Returns:
            Session object for the given session_id
        """
        with self.lock:
            if session_id not in self.sessions:
                self.sessions[session_id] = Session(session_id=session_id)
            else:
                # Update last accessed time
                self.sessions[session_id].last_accessed = datetime.utcnow()
            return self.sessions[session_id]

    def cleanup_old_sessions(self, max_age_hours: int = 24) -> int:
        """Remove sessions older than max_age_hours.

        Thread-safe method to clean up expired sessions.

        Args:
            max_age_hours: Maximum age of sessions in hours (default: 24)

        Returns:
            Number of sessions removed
        """
        cutoff = datetime.utcnow() - timedelta(hours=max_age_hours)

        with self.lock:
            old_count = len(self.sessions)
            self.sessions = {
                sid: session for sid, session in self.sessions.items()
                if session.last_accessed > cutoff
            }
            removed_count = old_count - len(self.sessions)

        return removed_count

    def cleanup_all_sessions(self) -> None:
        """Remove all sessions.

        Used during shutdown to clean up resources.
        """
        with self.lock:
            self.sessions.clear()

    def get_session_count(self) -> int:
        """Get the current number of active sessions.

        Returns:
            Number of active sessions
        """
        with self.lock:
            return len(self.sessions)
