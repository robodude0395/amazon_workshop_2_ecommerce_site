import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CartItem from '../components/CartItem';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import cartAPI from '../api/cart';
import './CartPage.css';

/**
 * CartPage Component
 *
 * Displays shopping cart with all items, totals, and management controls.
 * Handles cart updates, item removal, and empty cart state.
 */
function CartPage() {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cartAPI.get();
      setCart(data);
    } catch (err) {
      setError(err.message || 'Failed to load cart.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    try {
      await cartAPI.update(itemId, newQuantity);
      // Refresh cart to get updated totals
      await fetchCart();
      // Notify Navigation component to update cart count
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      setError(err.message || 'Failed to update item quantity.');
      throw err; // Re-throw to allow CartItem to revert
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await cartAPI.remove(itemId);
      // Refresh cart
      await fetchCart();
      // Notify Navigation component to update cart count
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      setError(err.message || 'Failed to remove item.');
      throw err;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading cart..." />;
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1>Shopping Cart</h1>
        <button className="continue-shopping" onClick={() => navigate('/')}>
          ← Continue Shopping
        </button>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      {cart.items.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add some products to get started!</p>
          <button className="browse-products-button" onClick={() => navigate('/')}>
            Browse Products
          </button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cart.items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdate={handleUpdateQuantity}
                onRemove={handleRemoveItem}
              />
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-row">
              <span className="summary-label">Items:</span>
              <span className="summary-value">{cart.items.length}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Total Quantity:</span>
              <span className="summary-value">
                {cart.items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>
            <div className="summary-row total-row">
              <span className="summary-label">Total:</span>
              <span className="summary-value">${parseFloat(cart.total).toFixed(2)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CartPage;
