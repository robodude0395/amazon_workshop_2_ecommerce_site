import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuantitySelector from './QuantitySelector';

describe('QuantitySelector', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('should render input field with increment and decrement buttons', () => {
    render(<QuantitySelector quantity={1} onChange={mockOnChange} />);

    expect(screen.getByLabelText('Decrease quantity')).toBeInTheDocument();
    expect(screen.getByLabelText('Quantity')).toBeInTheDocument();
    expect(screen.getByLabelText('Increase quantity')).toBeInTheDocument();
  });

  it('should display current quantity value', () => {
    render(<QuantitySelector quantity={5} onChange={mockOnChange} />);

    const input = screen.getByLabelText('Quantity');
    expect(input.value).toBe('5');
  });

  it('should increment quantity when increment button is clicked', () => {
    render(<QuantitySelector quantity={5} onChange={mockOnChange} />);

    const incrementBtn = screen.getByLabelText('Increase quantity');
    fireEvent.click(incrementBtn);

    expect(mockOnChange).toHaveBeenCalledWith(6);
  });

  it('should decrement quantity when decrement button is clicked', () => {
    render(<QuantitySelector quantity={5} onChange={mockOnChange} />);

    const decrementBtn = screen.getByLabelText('Decrease quantity');
    fireEvent.click(decrementBtn);

    expect(mockOnChange).toHaveBeenCalledWith(4);
  });

  it('should not decrement below minimum value', () => {
    render(<QuantitySelector quantity={1} onChange={mockOnChange} min={1} />);

    const decrementBtn = screen.getByLabelText('Decrease quantity');
    fireEvent.click(decrementBtn);

    expect(mockOnChange).not.toHaveBeenCalled();
    expect(decrementBtn).toBeDisabled();
  });

  it('should not increment above maximum value', () => {
    render(<QuantitySelector quantity={10} onChange={mockOnChange} max={10} />);

    const incrementBtn = screen.getByLabelText('Increase quantity');
    fireEvent.click(incrementBtn);

    expect(mockOnChange).not.toHaveBeenCalled();
    expect(incrementBtn).toBeDisabled();
  });

  it('should update quantity when valid number is typed', () => {
    render(<QuantitySelector quantity={5} onChange={mockOnChange} />);

    const input = screen.getByLabelText('Quantity');
    fireEvent.change(input, { target: { value: '10' } });

    expect(mockOnChange).toHaveBeenCalledWith(10);
  });

  it('should validate positive integer input', () => {
    render(<QuantitySelector quantity={5} onChange={mockOnChange} />);

    const input = screen.getByLabelText('Quantity');

    // Try negative number
    fireEvent.change(input, { target: { value: '-5' } });
    expect(mockOnChange).not.toHaveBeenCalled();

    // Try decimal
    fireEvent.change(input, { target: { value: '5.5' } });
    expect(mockOnChange).not.toHaveBeenCalled();

    // Try non-numeric
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should allow empty string during typing', () => {
    render(<QuantitySelector quantity={5} onChange={mockOnChange} />);

    const input = screen.getByLabelText('Quantity');
    fireEvent.change(input, { target: { value: '' } });

    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('should reset to minimum on blur if empty or invalid', () => {
    render(<QuantitySelector quantity={''} onChange={mockOnChange} min={1} />);

    const input = screen.getByLabelText('Quantity');
    fireEvent.blur(input);

    expect(mockOnChange).toHaveBeenCalledWith(1);
  });

  it('should respect custom min and max values', () => {
    render(<QuantitySelector quantity={5} onChange={mockOnChange} min={2} max={8} />);

    const input = screen.getByLabelText('Quantity');

    // Try below min
    fireEvent.change(input, { target: { value: '1' } });
    expect(mockOnChange).not.toHaveBeenCalled();

    // Try above max
    fireEvent.change(input, { target: { value: '10' } });
    expect(mockOnChange).not.toHaveBeenCalled();

    // Try within range
    fireEvent.change(input, { target: { value: '7' } });
    expect(mockOnChange).toHaveBeenCalledWith(7);
  });

  it('should update displayed quantity on change (Requirements 3.6)', () => {
    const { rerender } = render(<QuantitySelector quantity={1} onChange={mockOnChange} />);

    let input = screen.getByLabelText('Quantity');
    expect(input.value).toBe('1');

    // Simulate parent component updating quantity
    rerender(<QuantitySelector quantity={5} onChange={mockOnChange} />);

    input = screen.getByLabelText('Quantity');
    expect(input.value).toBe('5');
  });
});
