import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import cartAPI from '../api/cart';
import './Navigation.css';

/**
 * Navigation Component
 *
 * Displays navigation menu with links to Home and Cart pages.
 * Shows cart item count badge that updates when cart changes.
 */
function Navigation() {
  const [cartCount, setCartCount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCartCount();

    // Listen for cart update events
    const handleCartUpdate = () => {
      fetchCartCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const fetchCartCount = async () => {
    try {
      const cart = await cartAPI.get();
      setCartCount(cart.item_count || 0);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch cart count:', err);
      setError(err.message);
    }
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          🔍 Smiths Detection
        </Link>

        <div className="nav-links">
          <Link to="/" className="nav-link">
            Home
          </Link>
          <Link to="/cart" className="nav-link cart-link">
            🛒 Cart
            {cartCount > 0 && (
              <span className="cart-badge">{cartCount}</span>
            )}
          </Link>
        </div>
      </div>

      {error && (
        <div className="nav-error">
          Unable to load cart count
        </div>
      )}
    </nav>
  );
}

export default Navigation;
