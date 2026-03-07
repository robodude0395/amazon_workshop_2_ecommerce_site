import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CartItem from './CartItem';

describe('CartItem', () => {
  const mockItem = {
    id: 1,
    product_id: 10,
    quantity: 2,
    product: {
      id: 10,
      description: 'Advanced X-Ray Scanner',
      part_number: 'SD-1000',
      price: 45000.00,
    },
    line_total: 90000.00,
  };

  const mockOnUpdate = jest.fn();
  const mockOnRemove = jest.fn();

  beforeEach(() => {
    mockOnUpdate.mockClear();
    mockOnRemove.mockClear();
  });

  describe('Display Requirements', () => {
    it('should display product name (description)', () => {
      render(
        <CartItem
          item={mockItem}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('Advanced X-Ray Scanner')).toBeInTheDocument();
    });

    it('should display product part number', () => {
      render(
        <CartItem
          item={mockItem}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('SD-1000')).toBeInTheDocument();
    });

    it('should display quantity', () => {
      render(
        <CartItem
          item={mockItem}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      const quantityInput = screen.getByLabelText('Quantity');
      expect(quantityInput).toHaveValue('2');
    });

    it('should display unit price', () => {
      render(
        <CartItem
          item={mockItem}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('$45000.00 each')).toBeInTheDocument();
    });

    it('should display line total', () => {
      render(
        <CartItem
          item={mockItem}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('$90000.00')).toBeInTheDocument();
    });

    it('should calculate line total correctly (quantity × unit price)', () => {
      const item = {
        ...mockItem,
        quantity: 3,
        product: {
          ...mockItem.product,
          price: 1234.56,
        },
      };

      render(
        <CartItem
          item={item}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      // 3 × 1234.56 = 3703.68
      expect(screen.getByText('$3703.68')).toBeInTheDocument();
    });

    it('should display all required elements (name, quantity, unit price, line total)', () => {
      render(
        <CartItem
          item={mockItem}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      // Validates Requirements 6.2, 6.3, 6.4, 6.5
      expect(screen.getByText('Advanced X-Ray Scanner')).toBeInTheDocument();
      expect(screen.getByLabelText('Quantity')).toBeInTheDocument();
      expect(screen.getByText('$45000.00 each')).toBeInTheDocument();
      expect(screen.getByText('$90000.00')).toBeInTheDocument();
    });
  });

  describe('Quantity Update Control', () => {
    it('should render quantity update control (QuantitySelector)', () => {
      render(
        <CartItem
          item={mockItem}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      // Validates Requirement 7.1
      expect(screen.getByLabelText('Quantity')).toBeInTheDocument();
      expect(screen.getByLabelText('Increase quantity')).toBeInTheDocument();
      expect(screen.getByLabelText('Decrease quantity')).toBeInTheDocument();
    });

    it('should call onUpdate when quantity is incremented', async () => {
      mockOnUpdate.mockResolvedValue();

      render(
        <CartItem
          item={mockItem}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      const incrementButton = screen.getByLabelText('Increase quantity');
      fireEvent.click(incrementButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(1, 3);
      });
    });

    it('should call onUpdate when quantity is decremented', async () => {
      mockOnUpdate.mockResolvedValue();

      render(
        <CartItem
          item={mockItem}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      const decrementButton = screen.getByLabelText('Decrease quantity');
      fireEvent.click(decrementButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(1, 1);
      });
    });

    it('should call onUpdate when quantity is manually changed', async () => {
      mockOnUpdate.mockResolvedValue();

      render(
        <CartItem
          item={mockItem}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      const quantityInput = screen.getByLabelText('Quantity');
      fireEvent.change(quantityInput, { target: { value: '5' } });

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(1, 5);
      });
    });

    it('should update line total when quantity changes optimistically', async () => {
      mockOnUpdate.mockResolvedValue();

      render(
        <CartItem
          item={mockItem}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      const incrementButton = screen.getByLabelText('Increase quantity');
      fireEvent.click(incrementButton);

      // Line total should update optimistically (3 × 45000 = 135000)
      await waitFor(() => {
        expect(screen.getByText('$135000.00')).toBeInTheDocument();
      });
    });
  });

  describe('Delete Button', () => {
    it('should render delete button', () => {
      render(
        <CartItem
          item={mockItem}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      // Validates Requirement 8.1
      expect(screen.getByLabelText('Remove item')).toBeInTheDocument();
    });

    it('should call onRemove when delete button is clicked', async () => {
      mockOnRemove.mockResolvedValue();

      render(
        <CartItem
          item={mockItem}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      const removeButton = screen.getByLabelText('Remove item');
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(mockOnRemove).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Optimistic UI Updates', () => {
    it('should show updating state during quantity update', async () => {
      let resolveUpdate;
      mockOnUpdate.mockReturnValue(
        new Promise((resolve) => {
          resolveUpdate = resolve;
        })
      );

      render(
        <CartItem
          item={mockItem}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      const incrementButton = screen.getByLabelText('Increase quantity');
      fireEvent.click(incrementButton);

      // Should have updating class
      const cartItem = screen.getByText('Advanced X-Ray Scanner').closest('.cart-item');
      expect(cartItem).toHaveClass('updating');

      // Resolve the update
      resolveUpdate();

      await waitFor(() => {
        expect(cartItem).not.toHaveClass('updating');
      });
    });

    it('should show updating state during item removal', async () => {
      let resolveRemove;
      mockOnRemove.mockReturnValue(
        new Promise((resolve) => {
          resolveRemove = resolve;
        })
      );

      render(
        <CartItem
          item={mockItem}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      const removeButton = screen.getByLabelText('Remove item');
      fireEvent.click(removeButton);

      // Should have updating class
      const cartItem = screen.getByText('Advanced X-Ray Scanner').closest('.cart-item');
      expect(cartItem).toHaveClass('updating');

      // Resolve the removal
      resolveRemove();

      await waitFor(() => {
        expect(cartItem).toHaveClass('updating');
      });
    });

    it('should revert quantity on update error', async () => {
      mockOnUpdate.mockRejectedValue(new Error('Update failed'));

      render(
        <CartItem
          item={mockItem}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      const incrementButton = screen.getByLabelText('Increase quantity');
      fireEvent.click(incrementButton);

      // Quantity should revert to original value
      await waitFor(() => {
        const quantityInput = screen.getByLabelText('Quantity');
        expect(quantityInput).toHaveValue('2');
      });
    });

    it('should disable controls during update', async () => {
      let resolveUpdate;
      mockOnUpdate.mockReturnValue(
        new Promise((resolve) => {
          resolveUpdate = resolve;
        })
      );

      render(
        <CartItem
          item={mockItem}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      const incrementButton = screen.getByLabelText('Increase quantity');
      fireEvent.click(incrementButton);

      // Controls should be disabled (via pointer-events: none on parent)
      const removeButton = screen.getByLabelText('Remove item');
      expect(removeButton).toBeDisabled();

      // Resolve the update
      resolveUpdate();

      await waitFor(() => {
        expect(removeButton).not.toBeDisabled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle decimal prices correctly', () => {
      const item = {
        ...mockItem,
        quantity: 3,
        product: {
          ...mockItem.product,
          price: 99.99,
        },
      };

      render(
        <CartItem
          item={item}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('$99.99 each')).toBeInTheDocument();
      expect(screen.getByText('$299.97')).toBeInTheDocument();
    });

    it('should handle large quantities', () => {
      const item = {
        ...mockItem,
        quantity: 999,
        product: {
          ...mockItem.product,
          price: 100.00,
        },
      };

      render(
        <CartItem
          item={item}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('$99900.00')).toBeInTheDocument();
    });

    it('should handle quantity of 1', () => {
      const item = {
        ...mockItem,
        quantity: 1,
        product: {
          ...mockItem.product,
          price: 1234.56,
        },
      };

      render(
        <CartItem
          item={item}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      const quantityInput = screen.getByLabelText('Quantity');
      expect(quantityInput).toHaveValue('1');
      expect(screen.getByText('$1234.56')).toBeInTheDocument();
    });

    it('should not call onUpdate if quantity does not change', async () => {
      render(
        <CartItem
          item={mockItem}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      const quantityInput = screen.getByLabelText('Quantity');
      fireEvent.change(quantityInput, { target: { value: '2' } });

      // Wait a bit to ensure no call is made
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockOnUpdate).not.toHaveBeenCalled();
    });
  });
});
