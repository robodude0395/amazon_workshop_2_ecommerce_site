import React from 'react';
import './QuantitySelector.css';

/**
 * QuantitySelector Component
 *
 * Renders an input field with increment/decrement buttons for quantity selection.
 * Validates positive integer input and updates displayed quantity on change.
 *
 * @param {number} quantity - Current quantity value
 * @param {function} onChange - Callback function when quantity changes
 * @param {number} min - Minimum allowed quantity (default: 1)
 * @param {number} max - Maximum allowed quantity (default: 999)
 */
function QuantitySelector({ quantity, onChange, min = 1, max = 999 }) {
  const handleDecrement = () => {
    if (quantity > min) {
      onChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < max) {
      onChange(quantity + 1);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;

    // Allow empty string for user to clear and type new value
    if (value === '') {
      onChange('');
      return;
    }

    // Validate that input contains only digits (no decimals, negatives, or letters)
    if (!/^\d+$/.test(value)) {
      return; // Reject invalid input
    }

    // Parse as integer
    const numValue = parseInt(value, 10);

    // Validate within range
    if (numValue >= min && numValue <= max) {
      onChange(numValue);
    }
  };

  const handleBlur = () => {
    // If empty or invalid on blur, reset to minimum
    if (quantity === '' || quantity < min) {
      onChange(min);
    }
  };

  return (
    <div className="quantity-selector">
      <button
        type="button"
        className="quantity-btn quantity-btn-decrement"
        onClick={handleDecrement}
        disabled={quantity <= min}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        type="text"
        className="quantity-input"
        value={quantity}
        onChange={handleInputChange}
        onBlur={handleBlur}
        aria-label="Quantity"
        inputMode="numeric"
      />
      <button
        type="button"
        className="quantity-btn quantity-btn-increment"
        onClick={handleIncrement}
        disabled={quantity >= max}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

export default QuantitySelector;
