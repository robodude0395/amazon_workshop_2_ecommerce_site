import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QuantitySelector from '../components/QuantitySelector';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import productsAPI from '../api/products';
import cartAPI from '../api/cart';
import './ProductPage.css';

/**
 * ProductPage Component
 *
 * Displays detailed product information with add-to-cart functionality.
 * Shows product description, price, sample reviews, and quantity selector.
 */
function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Sample reviews (static for MVP)
  const sampleReviews = [
    { id: 1, author: 'John D.', rating: 5, comment: 'Excellent product, works as expected.' },
    { id: 2, author: 'Sarah M.', rating: 4, comment: 'Good quality, fast delivery.' },
    { id: 3, author: 'Mike R.', rating: 5, comment: 'Very reliable equipment.' },
  ];

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productsAPI.getById(id);
      setProduct(data);
    } catch (err) {
      setError(err.message || 'Failed to load product details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      setAddingToCart(true);
      setError(null);
      await cartAPI.add(product.id, quantity);
      setSuccessMessage(`Added ${quantity} item(s) to cart!`);
      setQuantity(1); // Reset quantity

      // Notify Navigation component to update cart count
      window.dispatchEvent(new Event('cartUpdated'));

      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to add item to cart.');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading product details..." />;
  }

  if (error && !product) {
    return (
      <div className="product-page">
        <ErrorMessage message={error} onDismiss={() => navigate('/')} />
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Products
        </button>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="product-page">
      <button className="back-button" onClick={() => navigate('/')}>
        ← Back to Products
      </button>

      <div className="product-detail">
        <div className="product-main">
          <div className="product-icon-large">
            {product.part_number ? product.part_number.charAt(0) : '📦'}
          </div>

          <div className="product-info-section">
            <h1 className="product-title">{product.description}</h1>
            <p className="product-part-number">Part Number: {product.part_number}</p>
            <p className="product-price">${parseFloat(product.price).toFixed(2)}</p>

            <div className="add-to-cart-section">
              <div className="quantity-section">
                <label htmlFor="quantity">Quantity:</label>
                <QuantitySelector
                  quantity={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={999}
                />
              </div>

              <button
                className="add-to-cart-button"
                onClick={handleAddToCart}
                disabled={addingToCart || !quantity}
              >
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>

            {successMessage && (
              <div className="success-message" role="status">
                ✓ {successMessage}
              </div>
            )}

            {error && (
              <ErrorMessage
                message={error}
                onDismiss={() => setError(null)}
              />
            )}
          </div>
        </div>

        <div className="product-reviews">
          <h2>Customer Reviews</h2>
          <div className="reviews-list">
            {sampleReviews.map((review) => (
              <div key={review.id} className="review-item">
                <div className="review-header">
                  <span className="review-author">{review.author}</span>
                  <span className="review-rating">{'⭐'.repeat(review.rating)}</span>
                </div>
                <p className="review-comment">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductPage;
