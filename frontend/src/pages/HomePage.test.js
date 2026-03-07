import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from './HomePage';

// Mock the products API
jest.mock('../api/products', () => ({
  __esModule: true,
  default: {
    getAll: jest.fn(),
    getById: jest.fn(),
  },
}));

import productsAPI from '../api/products';

// Mock child components
jest.mock('../components/ProductCard', () => {
  return function MockProductCard({ product }) {
    return (
      <div data-testid={`product-card-${product.id}`}>
        {product.description}
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
  return function MockErrorMessage({ message }) {
    return <div data-testid="error-message">{message}</div>;
  };
});

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays loading spinner while fetching products', () => {
    // Mock API to never resolve
    productsAPI.getAll.mockImplementation(() => new Promise(() => {}));

    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading products...')).toBeInTheDocument();
  });

  test('displays products after successful fetch', async () => {
    const mockProducts = [
      {
        id: 1,
        part_number: 'SD-1000',
        description: 'Advanced X-Ray Scanner',
        price: 45000.00,
      },
      {
        id: 2,
        part_number: 'SD-2000',
        description: 'Portable Explosive Detector',
        price: 12500.00,
      },
    ];

    productsAPI.getAll.mockResolvedValue(mockProducts);

    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Wait for products to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check header
    expect(screen.getByText('Smiths Detection Products')).toBeInTheDocument();
    expect(screen.getByText('2 products available')).toBeInTheDocument();

    // Check products are rendered
    expect(screen.getByTestId('product-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('product-card-2')).toBeInTheDocument();
    expect(screen.getByText('Advanced X-Ray Scanner')).toBeInTheDocument();
    expect(screen.getByText('Portable Explosive Detector')).toBeInTheDocument();
  });

  test('displays error message when fetch fails', async () => {
    const errorMessage = 'Failed to load products';
    productsAPI.getAll.mockRejectedValue(new Error(errorMessage));

    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('displays empty state when no products available', async () => {
    productsAPI.getAll.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Wait for products to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Smiths Detection Products')).toBeInTheDocument();
    expect(screen.getByText('0 products available')).toBeInTheDocument();
    expect(screen.getByText('No products available at this time.')).toBeInTheDocument();
  });

  test('calls productsAPI.getAll on mount', () => {
    productsAPI.getAll.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    expect(productsAPI.getAll).toHaveBeenCalledTimes(1);
  });
});
