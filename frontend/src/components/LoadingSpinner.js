import React from 'react';
import './LoadingSpinner.css';

/**
 * LoadingSpinner Component
 *
 * Displays a loading indicator during async operations.
 * Consistent styling across pages.
 *
 * @param {string} message - Optional loading message (default: "Loading...")
 */
function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner" role="status" aria-live="polite">
        <div className="spinner"></div>
        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
}

export default LoadingSpinner;
