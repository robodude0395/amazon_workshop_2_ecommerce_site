import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage } from '../api/chat';
import './ChatWidget.css';

/**
 * ChatWidget component - A floating chat interface for the shopping assistant.
 *
 * Provides a popup chat window that allows users to interact with the
 * AI shopping assistant powered by AWS Bedrock Nova Pro.
 */
const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId] = useState(() => {
    // Generate a unique session ID for this user
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  });

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add welcome message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Hello! I\'m your shopping assistant. I can help you find detection equipment, answer questions about products, and manage your cart. How can I help you today?',
        timestamp: new Date().toISOString()
      }]);
    }
  }, [isOpen, messageserMessage]);

    // Send to chatbot API
    setIsLoading(true);
    try {
      const response = await sendChatMessage(sessionId, userMessage);

      // Add assistant response to chat
      const assistantMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: response.timestamp
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setError('Sorry, I\'m having trouble connecting. Please try again.');

      // Remove the user message if the request failed
      setMessages(prev => prev.slice(0, -1));
      // Restore the input
      setInputValue(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="chat-widget">
      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <h3>🤖 Shopping Assistant</h3>
            <button
              className="chat-close-button"
              onClick={handleToggle}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div key={index} className={`chat-message ${message.role}`}>
                <div className="message-bubble">
                  {message.content}
                </div>
                <div className="message-time">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="chat-message assistant">
                <div className="chat-typing">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error message */}
          {error && (
            <div className="chat-error">
              {error}
            </div>
          )}

          {/* Input */}
          <div className="chat-input-container">
            <form className="chat-input-form" onSubmit={handleSubmit}>
              <input
                type="text"
                className="chat-input"
                placeholder="Ask me anything..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="chat-send-button"
                disabled={isLoading || !inputValue.trim()}
                aria-label="Send message"
              >
                ➤
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        className="chat-toggle-button"
        onClick={handleToggle}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? '×' : '💬'}
      </button>
    </div>
  );
};

export default ChatWidget;
