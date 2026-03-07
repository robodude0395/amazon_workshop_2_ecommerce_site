import { render, screen } from '@testing-library/react';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should display loading spinner with default message', () => {
    render(<LoadingSpinner />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display custom loading message', () => {
    render(<LoadingSpinner message="Loading products..." />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading products...')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<LoadingSpinner message="Loading data..." />);

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('role', 'status');
    expect(spinner).toHaveAttribute('aria-live', 'polite');
  });

  it('should render spinner element', () => {
    const { container } = render(<LoadingSpinner />);

    const spinnerElement = container.querySelector('.spinner');
    expect(spinnerElement).toBeInTheDocument();
  });

  it('should render loading message element', () => {
    const { container } = render(<LoadingSpinner message="Test message" />);

    const messageElement = container.querySelector('.loading-message');
    expect(messageElement).toBeInTheDocument();
    expect(messageElement).toHaveTextContent('Test message');
  });

  it('should have consistent styling structure', () => {
    const { container } = render(<LoadingSpinner />);

    const containerElement = container.querySelector('.loading-spinner-container');
    const spinnerWrapper = container.querySelector('.loading-spinner');
    const spinnerElement = container.querySelector('.spinner');

    expect(containerElement).toBeInTheDocument();
    expect(spinnerWrapper).toBeInTheDocument();
    expect(spinnerElement).toBeInTheDocument();
  });

  it('should display different messages for different contexts', () => {
    const { rerender } = render(<LoadingSpinner message="Loading products..." />);
    expect(screen.getByText('Loading products...')).toBeInTheDocument();

    rerender(<LoadingSpinner message="Loading cart..." />);
    expect(screen.getByText('Loading cart...')).toBeInTheDocument();
    expect(screen.queryByText('Loading products...')).not.toBeInTheDocument();

    rerender(<LoadingSpinner message="Loading product details..." />);
    expect(screen.getByText('Loading product details...')).toBeInTheDocument();
    expect(screen.queryByText('Loading cart...')).not.toBeInTheDocument();
  });

  it('should handle empty string message', () => {
    const { container } = render(<LoadingSpinner message="" />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    const messageElement = container.querySelector('.loading-message');
    expect(messageElement).toBeInTheDocument();
    expect(messageElement).toHaveTextContent('');
  });

  it('should handle long loading messages', () => {
    const longMessage = 'Loading a very large dataset with many items, please wait while we fetch all the information...';
    render(<LoadingSpinner message={longMessage} />);

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('should be visible during async operations (UX requirement)', () => {
    render(<LoadingSpinner message="Loading..." />);

    const spinner = screen.getByRole('status');
    expect(spinner).toBeVisible();
  });

  it('should maintain consistent styling across different messages', () => {
    const { container, rerender } = render(<LoadingSpinner message="Message 1" />);

    const initialClasses = container.querySelector('.loading-spinner-container').className;

    rerender(<LoadingSpinner message="Message 2" />);

    const updatedClasses = container.querySelector('.loading-spinner-container').className;
    expect(updatedClasses).toBe(initialClasses);
  });

  it('should render without crashing when no props provided', () => {
    expect(() => {
      render(<LoadingSpinner />);
    }).not.toThrow();
  });

  it('should display spinner animation element', () => {
    const { container } = render(<LoadingSpinner />);

    const spinner = container.querySelector('.spinner');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('spinner');
  });

  it('should be used consistently across pages (HomePage, ProductPage, CartPage)', () => {
    // Test that the component can be rendered with messages from different pages
    const { rerender } = render(<LoadingSpinner message="Loading products..." />);
    expect(screen.getByText('Loading products...')).toBeInTheDocument();

    rerender(<LoadingSpinner message="Loading product details..." />);
    expect(screen.getByText('Loading product details...')).toBeInTheDocument();

    rerender(<LoadingSpinner message="Loading cart..." />);
    expect(screen.getByText('Loading cart...')).toBeInTheDocument();
  });
});
