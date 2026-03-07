import React, { useState, useEffect } from 'react';
import './ErrorMessage.css';

/**
 * ErrorMessage Component
 *
 * Displays user-friendly error messages with dismissible notification.
 * Auto-dismisses after timeout.
 *
 * @param {string} message - Error message to display
 * @param {function} onDismiss - Callback when message is dismissed
 * @param {number} autoHideDuration - Auto-hide duration in ms (default: 5000, 0 to disable)
 */
function ErrorMessage({ message, onDismiss, autoHideDuration = 5000 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [autoHideDuration]);

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!visible || !message) {
    return null;
  }

  return (
    <div className="error-message" role="alert">
      <div className="error-content">
        <span className="error-icon">⚠️</span>
        <span className="error-text">{message}</span>
      </div>
      <button
        className="error-dismiss"
        onClick={handleDismiss}
        aria-label="Dismiss error"
      >
        ×
      </button>
    </div>
  );
}

export default ErrorMessage;
