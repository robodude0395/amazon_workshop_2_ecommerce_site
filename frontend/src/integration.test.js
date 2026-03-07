/**
 * Integration Tests
 *
 * Tests end-to-end user flows to verify component wiring and navigation.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import productsAPI from './api/products';
import cartAPI from './api/cart';

// Mock API modules
jest.mock('./api/products');
jest.mock('./api/cart');

describe('Integration Tests - Component Wiring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Product Browsing to Cart Flow', () => {
    it('should navigate from home to product page to cart', async () => {
      const mockProducts = [
        {
          id: 1,
          part_number: 'SD-1000',
          description: 'Advanced X-Ray Scanner',
          price: 45000.00,
        },
      ];

      const mockProduct = mockProducts[0];

      const mockCart = {
        items: [],
        total: 0,
        item_count: 0,
      };

      productsAPI.getAll.mockResolvedValue(mockProducts);
      productsAPI.getById.mockResolvedValue(mockProduct);
      cartAPI.get.mockResolvedValue(mockCart);
      cartAPI.add.mockResolvedValue({ id: 1, product_id: 1, quantity: 2 });

      // Render the app
      render(<App />);

      // Wait for products to load on home page
      await waitFor(() => {
        expect(screen.getByText('Advanced X-Ray Scanner')).toBeInTheDocument();
      });

      // Click on product card to navigate to product page
      const productCard = screen.getByText('Advanced X-Ray Scanner').closest('.product-card');
      fireEvent.click(productCard);

      // Wait for product page to load
      await waitFor(() => {
        expect(screen.getByText('Add to Cart')).toBeInTheDocument();
      });

      // Verify product details are displayed
      expect(screen.getByText('SD-1000')).toBeInTheDocument();
      expect(screen.getByText('$45000.00')).toBeInTheDocument();

      // Add to cart
      const addToCartButton = screen.getByText('Add to Cart');
      fireEvent.click(addToCartButton);

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText(/added.*to cart/i)).toBeInTheDocument();
      });

      // Verify cartAPI.add was called with correct parameters
      expect(cartAPI.add).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('Navigation Component Integration', () => {
    it('should display navigation on all pages', async () => {
      const mockProducts = [];
      const mockCart = { items: [], total: 0, item_count: 0 };

      productsAPI.getAll.mockResolvedValue(mockProducts);
      cartAPI.get.mockResolvedValue(mockCart);

      render(<App />);

      // Navigation should be visible
      await waitFor(() => {
        expect(screen.getByText('🔍 Smiths Detection')).toBeInTheDocument();
      });

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('🛒 Cart')).toBeInTheDocument();
    });

    it('should update cart count badge when cartUpdated event is dispatched', async () => {
      const mockCart = { items: [], total: 0, item_count: 0 };
      const updatedCart = { items: [], total: 0, item_count: 3 };

      cartAPI.get
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(updatedCart);

      productsAPI.getAll.mockResolvedValue([]);

      render(<App />);

      // Wait for initial cart count to load
      await waitFor(() => {
        expect(cartAPI.get).toHaveBeenCalledTimes(1);
      });

      // Dispatch cart updated event
      window.dispatchEvent(new Event('cartUpdated'));

      // Wait for cart count to be fetched again
      await waitFor(() => {
        expect(cartAPI.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should display error messages when API calls fail', async () => {
      productsAPI.getAll.mockRejectedValue(new Error('Failed to load products'));
      cartAPI.get.mockResolvedValue({ items: [], total: 0, item_count: 0 });

      render(<App />);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/failed to load products/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cart Management Flow', () => {
    it('should handle cart operations and refresh display', async () => {
      const mockCart = {
        items: [
          {
            id: 1,
            product_id: 1,
            quantity: 2,
            product: {
              id: 1,
              description: 'Advanced X-Ray Scanner',
              part_number: 'SD-1000',
              price: 45000.00,
            },
            line_total: 90000.00,
          },
        ],
        total: 90000.00,
        item_count: 2,
      };

      productsAPI.getAll.mockResolvedValue([]);
      cartAPI.get.mockResolvedValue(mockCart);

      render(<App />);

      // Navigate to cart page
      await waitFor(() => {
        const cartLink = screen.getByText('🛒 Cart');
        fireEvent.click(cartLink);
      });

      // Wait for cart items to load
      await waitFor(() => {
        expect(screen.getByText('Advanced X-Ray Scanner')).toBeInTheDocument();
      });

      // Verify cart total is displayed
      expect(screen.getByText('$90000.00')).toBeInTheDocument();
    });
  });
});
