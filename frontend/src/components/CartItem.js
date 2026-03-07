import React, { useState } from 'react';
import QuantitySelector from './QuantitySelector';
import './CartItem.css';

/**
 * CartItem Component
 *
 * Displays a single cart item with update and delete controls.
 * Handles quantity updates and item removal with optimistic UI.
 *
 * @param {Object} item - Cart item with product details
 * @param {function} onUpdate - Callback for quantity update
 * @param {function} onRemove - Callback for item removal
 */
function CartItem({ item, onUpdate, onRemove }) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [updating, setUpdating] = useState(false);

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity === quantity) return;

    setQuantity(newQuantity);
    setUpdating(true);

    try {
      await onUpdate(item.id, newQuantity);
    } catch (err) {
      // Revert on error
      setQuantity(item.quantity);
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async () => {
    setUpdating(true);
    try {
      await onRemove(item.id);
    } catch (err) {
      setUpdating(false);
    }
  };

  const lineTotal = (parseFloat(item.product.price) * quantity).toFixed(2);

  return (
    <div className={`cart-item ${updating ? 'updating' : ''}`}>
      <div className="cart-item-info">
        <h3 className="cart-item-name">{item.product.description}</h3>
        <p className="cart-item-part-number">{item.product.part_number}</p>
      </div>

      <div className="cart-item-controls">
        <div className="cart-item-quantity">
          <QuantitySelector
            quantity={quantity}
            onChange={handleQuantityChange}
            min={1}
            max={999}
          />
        </div>

        <div className="cart-item-price">
          <span className="unit-price">${parseFloat(item.product.price).toFixed(2)} each</span>
          <span className="line-total">${lineTotal}</span>
        </div>

        <button
          className="remove-button"
          onClick={handleRemove}
          disabled={updating}
          aria-label="Remove item"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

export default CartItem;
