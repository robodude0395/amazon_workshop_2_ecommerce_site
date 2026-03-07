import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the page components
jest.mock('./pages/HomePage', () => {
  return function HomePage() {
    return <div data-testid="home-page">Home Page</div>;
  };
});

jest.mock('./pages/ProductPage', () => {
  return function ProductPage() {
    return <div data-testid="product-page">Product Page</div>;
  };
});

jest.mock('./pages/CartPage', () => {
  return function CartPage() {
    return <div data-testid="cart-page">Cart Page</div>;
  };
});

jest.mock('./components/Navigation', () => {
  return function Navigation() {
    return <nav data-testid="navigation">Navigation</nav>;
  };
});

describe('App Component', () => {
  test('renders Navigation component on all routes', () => {
    render(<App />);
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
  });

  test('renders HomePage at root path', () => {
    window.history.pushState({}, 'Home', '/');
    render(<App />);
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  test('renders 404 page for unknown routes', () => {
    window.history.pushState({}, 'Unknown', '/unknown-route');
    render(<App />);
    expect(screen.getByText('404 - Page Not Found')).toBeInTheDocument();
    expect(screen.getByText("The page you're looking for doesn't exist.")).toBeInTheDocument();
  });

  test('404 page includes link back to home', () => {
    window.history.pushState({}, 'Unknown', '/unknown-route');
    render(<App />);
    const homeLink = screen.getByText('Go back to home');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });
});
