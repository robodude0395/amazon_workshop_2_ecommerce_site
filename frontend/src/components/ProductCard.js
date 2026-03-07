import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ProductCard.css';

/**
 * ProductCard Component
 *
 * Displays a product card with emoji icon, name, and part number.
 * Clickable to navigate to product details page.
 *
 * @param {Object} product - Product object with id, part_number, description, price
 */
function ProductCard({ product }) {
  const navigate = useNavigate();

  // Generate a consistent emoji icon based on product part number
  const getProductEmoji = (partNumber) => {
    const emojis = ['🔍', '📡', '🛡️', '⚡', '🔬', '📊', '🎯', '🔒', '⚙️', '🌐'];

    // Use part number to consistently select an emoji
    let hash = 0;
    for (let i = 0; i < partNumber.length; i++) {
      hash = ((hash << 5) - hash) + partNumber.charCodeAt(i);
      hash = hash & hash;
    }

    return emojis[Math.abs(hash) % emojis.length];
  };

  const handleClick = () => {
    navigate(`/product/${product.id}`);
  };

  return (
    <div className="product-card" onClick={handleClick}>
      <div className="product-emoji" role="img" aria-label="Product icon">
        {getProductEmoji(product.part_number)}
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.description}</h3>
        <p className="product-part-number">{product.part_number}</p>
      </div>
    </div>
  );
}

export default ProductCard;
