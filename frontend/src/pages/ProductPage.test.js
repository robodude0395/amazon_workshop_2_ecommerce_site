import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import ProductPage from './ProductPage';
import productsAPI from '../api/products';
import cartAPI from '../api/cart';

// Mock the API modules
jest.mock('../api/products', () => ({
  __esModule: true,
  default: {
    getById: jest.fn(),
  },
}));
jest.mock('../api/cart', () => ({
  __esModule: true,
  default: {
    add: jest.fn(),
  },
}));

// Mock child components
jest.mock('../components/QuantitySelector', () => {
  return function MockQuantitySelector({ quantity, onChange }) {
    return (
      <div data-testid="quantity-selector">
        <input
          type="number"
          value={quantity}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          data-testid="quantity-input"
        />
      </div>
    );
  };
});

jest.mock('../components/LoadingSpinner', () => {
  return function MockLoadingSpinner({ message }) {
    return <div data-testid="loading-spinner">{message}</div>;
  };
});

jest.mock('../components/ErrorMessage', () => {
  return function MockErrorMessage({ message, onDismiss }) {
    return (
      <div data-testid="error-message">
        {message}
        <button onClick={onDismiss}>Dismiss</button>
      </div>
    );
  };
});

const mockProduct = {
  id: 1,
  part_number: 'TEST-001',
  description: 'Test Product',
  price: '100.00',
  created_at: '2024-01-01T00:00:00Z',
};

describe('ProductPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderProductPage = (productId = '1') => {
    return render(
      <MemoryRouter initialEntries={[`/product/${productId}`]}>
        <Routes>
          <Route path="/product/:id" element={<ProductPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('Loading State', () => {
    it('should display loading spinner while fetching product', () => {
      productsAPI.getById.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderProductPage();

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading product details...')).toBeInTheDocument();
    });
  });

  describe('Product Display', () => {
    it('should display product details after successful fetch', async () => {
      productsAPI.getById.mockResolvedValue(mockProduct);

      renderProductPage();

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });

      expect(screen.getByText('Part Number: TEST-001')).toBeInTheDocument();
      expect(screen.getByText('$100.00')).toBeInTheDocument();
    });

    it('should display sample reviews', async () => {
      productsAPI.getById.mockResolvedValue(mockProduct);

      renderProductPage();

      await waitFor(() => {
        expect(screen.getByText('Customer Reviews')).toBeInTheDocument();
      });

      expect(screen.getByText('John D.')).toBeInTheDocument();
      expect(screen.getByText('Sarah M.')).toBeInTheDocument();
      expect(screen.getByText('Mike R.')).toBeInTheDocument();
    });

    it('should render quantity selector', async () => {
      productsAPI.getById.mockResolvedValue(mockProduct);

      renderProductPage();

      await waitFor(() => {
        expect(screen.getByTestId('quantity-selector')).toBeInTheDocument();
      });
    });

    it('should render add-to-cart button', async () => {
      productsAPI.getById.mockResolvedValue(mockProduct);

      renderProductPage();

      await waitFor(() => {
        expect(screen.getByText('Add to Cart')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when product fetch fails', async () => {
      productsAPI.getById.mockRejectedValue(new Error('Product not found'));

      renderProductPage();

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      expect(screen.getByText('Product not found')).toBeInTheDocument();
    });

    it('should display error message when add-to-cart fails', async () => {
      productsAPI.getById.mockResolvedValue(mockProduct);
      cartAPI.add.mockRejectedValue(new Error('Failed to add to cart'));

      renderProductPage();

      await waitFor(() => {
        expect(screen.getByText('Add to Cart')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add to Cart');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to add to cart')).toBeInTheDocument();
      });
    });
  });

  describe('Add to Cart Functionality', () => {
    it('should add product to cart with selected quantity', async () => {
      productsAPI.getById.mockResolvedValue(mockProduct);
      cartAPI.add.mockResolvedValue({ id: 1, product_id: 1, quantity: 2 });

      renderProductPage();

      await waitFor(() => {
        expect(screen.getByText('Add to Cart')).toBeInTheDocument();
      });

      // Change quantity to 2
      const quantityInput = screen.getByTestId('quantity-input');
      fireEvent.change(quantityInput, { target: { value: '2' } });

      // Click add to cart
      const addButton = screen.getByText('Add to Cart');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(cartAPI.add).toHaveBeenCalledWith(1, 2);
      });
    });

    it('should display success message after adding to cart', async () => {
      productsAPI.getById.mockResolvedValue(mockProduct);
      cartAPI.add.mockResolvedValue({ id: 1, product_id: 1, quantity: 1 });

      renderProductPage();

      await waitFor(() => {
        expect(screen.getByText('Add to Cart')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add to Cart');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Added 1 item\(s\) to cart!/)).toBeInTheDocument();
      });
    });

    it('should reset quantity to 1 after successful add', async () => {
      productsAPI.getById.mockResolvedValue(mockProduct);
      cartAPI.add.mockResolvedValue({ id: 1, product_id: 1, quantity: 3 });

      renderProductPage();

      await waitFor(() => {
        expect(screen.getByText('Add to Cart')).toBeInTheDocument();
      });

      // Change quantity to 3
      const quantityInput = screen.getByTestId('quantity-input');
      fireEvent.change(quantityInput, { target: { value: '3' } });

      // Click add to cart
      const addButton = screen.getByText('Add to Cart');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(cartAPI.add).toHaveBeenCalledWith(1, 3);
      });

      // Verify quantity is reset to 1
      await waitFor(() => {
        expect(quantityInput.value).toBe('1');
      });
    });

    it('should disable button while adding to cart', async () => {
      productsAPI.getById.mockResolvedValue(mockProduct);
      cartAPI.add.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      renderProductPage();

      await waitFor(() => {
        expect(screen.getByText('Add to Cart')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add to Cart');
      fireEvent.click(addButton);

      // Button should show "Adding..." and be disabled
      await waitFor(() => {
        expect(screen.getByText('Adding...')).toBeInTheDocument();
      });

      const addingButton = screen.getByText('Adding...');
      expect(addingButton).toBeDisabled();
    });
  });

  describe('Navigation', () => {
    it('should have back button to navigate to home', async () => {
      productsAPI.getById.mockResolvedValue(mockProduct);

      renderProductPage();

      await waitFor(() => {
        expect(screen.getByText('← Back to Products')).toBeInTheDocument();
      });
    });
  });
});
