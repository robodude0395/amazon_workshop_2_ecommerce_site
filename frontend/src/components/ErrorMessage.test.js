import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ErrorMessage from './ErrorMessage';

describe('ErrorMessage', () => {
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    mockOnDismiss.mockClear();
    jest.clearAllTimers();
  });

  it('should display error message with icon', () => {
    render(<ErrorMessage message="Test error message" />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('should display dismiss button', () => {
    render(<ErrorMessage message="Test error" />);

    const dismissButton = screen.getByLabelText('Dismiss error');
    expect(dismissButton).toBeInTheDocument();
    expect(dismissButton).toHaveTextContent('×');
  });

  it('should call onDismiss when dismiss button is clicked', () => {
    render(<ErrorMessage message="Test error" onDismiss={mockOnDismiss} />);

    const dismissButton = screen.getByLabelText('Dismiss error');
    fireEvent.click(dismissButton);

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('should hide message when dismiss button is clicked', () => {
    render(<ErrorMessage message="Test error" onDismiss={mockOnDismiss} />);

    const dismissButton = screen.getByLabelText('Dismiss error');
    fireEvent.click(dismissButton);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should not render when message is empty', () => {
    render(<ErrorMessage message="" />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should not render when message is null', () => {
    render(<ErrorMessage message={null} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should not render when message is undefined', () => {
    render(<ErrorMessage message={undefined} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should auto-dismiss after default timeout (5000ms)', async () => {
    jest.useFakeTimers();

    render(<ErrorMessage message="Test error" onDismiss={mockOnDismiss} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Fast-forward time by 5000ms
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it('should auto-dismiss after custom timeout', async () => {
    jest.useFakeTimers();

    render(
      <ErrorMessage
        message="Test error"
        onDismiss={mockOnDismiss}
        autoHideDuration={3000}
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Fast-forward time by 3000ms
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it('should not auto-dismiss when autoHideDuration is 0', async () => {
    jest.useFakeTimers();

    render(
      <ErrorMessage
        message="Test error"
        onDismiss={mockOnDismiss}
        autoHideDuration={0}
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Fast-forward time by 10 seconds
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    // Message should still be visible
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(mockOnDismiss).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('should clear timeout on unmount', () => {
    jest.useFakeTimers();

    const { unmount } = render(
      <ErrorMessage message="Test error" onDismiss={mockOnDismiss} />
    );

    // Unmount before timeout
    unmount();

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // onDismiss should not be called
    expect(mockOnDismiss).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('should work without onDismiss callback', () => {
    render(<ErrorMessage message="Test error" />);

    const dismissButton = screen.getByLabelText('Dismiss error');

    // Should not throw error when clicking dismiss
    expect(() => {
      fireEvent.click(dismissButton);
    }).not.toThrow();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should display user-friendly error messages (Requirements 14.1)', () => {
    const { rerender } = render(
      <ErrorMessage message="Unable to load products. Please try again." />
    );

    expect(screen.getByText('Unable to load products. Please try again.')).toBeInTheDocument();

    // Test different error messages
    rerender(<ErrorMessage message="Unable to add item to cart. Please try again." />);
    expect(screen.getByText('Unable to add item to cart. Please try again.')).toBeInTheDocument();

    rerender(<ErrorMessage message="Unable to update cart. Please try again." />);
    expect(screen.getByText('Unable to update cart. Please try again.')).toBeInTheDocument();
  });

  it('should be dismissible (Requirements 14.1, 14.2, 14.3)', () => {
    render(<ErrorMessage message="Test error" onDismiss={mockOnDismiss} />);

    // Verify message is displayed
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Verify dismiss button exists
    const dismissButton = screen.getByLabelText('Dismiss error');
    expect(dismissButton).toBeInTheDocument();

    // Dismiss the message
    fireEvent.click(dismissButton);

    // Verify message is hidden
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(mockOnDismiss).toHaveBeenCalled();
  });

  it('should have proper accessibility attributes', () => {
    render(<ErrorMessage message="Test error" />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('role', 'alert');

    const dismissButton = screen.getByLabelText('Dismiss error');
    expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss error');
  });

  it('should display long error messages correctly', () => {
    const longMessage = 'This is a very long error message that should still be displayed correctly without breaking the layout or causing any visual issues in the component.';

    render(<ErrorMessage message={longMessage} />);

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('should handle multiple error messages sequentially', () => {
    const { rerender } = render(<ErrorMessage message="First error" />);
    expect(screen.getByText('First error')).toBeInTheDocument();

    rerender(<ErrorMessage message="Second error" />);
    expect(screen.getByText('Second error')).toBeInTheDocument();
    expect(screen.queryByText('First error')).not.toBeInTheDocument();
  });
});
