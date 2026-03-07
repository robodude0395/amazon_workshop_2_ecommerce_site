import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductCard from './ProductCard';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('ProductCard', () => {
  const mockProduct = {
    id: 1,
    part_number: 'A9044-1',
    description: 'Kit, CHECK VALVE & T PIECE KIT',
    price: 1234.56,
  };

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('should display product emoji icon', () => {
    render(
      <BrowserRouter>
        <ProductCard product={mockProduct} />
      </BrowserRouter>
    );

    const emoji = screen.getByRole('img', { name: 'Product icon' });
    expect(emoji).toBeInTheDocument();
    expect(emoji.textContent).toMatch(/[🔍📡🛡️⚡🔬📊🎯🔒⚙️🌐]/);
  });

  it('should display product name (description)', () => {
    render(
      <BrowserRouter>
        <ProductCard product={mockProduct} />
      </BrowserRouter>
    );

    expect(screen.getByText('Kit, CHECK VALVE & T PIECE KIT')).toBeInTheDocument();
  });

  it('should display product part number', () => {
    render(
      <BrowserRouter>
        <ProductCard product={mockProduct} />
      </BrowserRouter>
    );

    expect(screen.getByText('A9044-1')).toBeInTheDocument();
  });

  it('should navigate to product details page when clicked', () => {
    render(
      <BrowserRouter>
        <ProductCard product={mockProduct} />
      </BrowserRouter>
    );

    const card = screen.getByText('Kit, CHECK VALVE & T PIECE KIT').closest('.product-card');
    fireEvent.click(card);

    expect(mockNavigate).toHaveBeenCalledWith('/product/1');
  });

  it('should generate consistent emoji for same part number', () => {
    const { rerender } = render(
      <BrowserRouter>
        <ProductCard product={mockProduct} />
      </BrowserRouter>
    );

    const firstEmoji = screen.getByRole('img', { name: 'Product icon' }).textContent;

    // Re-render with same product
    rerender(
      <BrowserRouter>
        <ProductCard product={mockProduct} />
      </BrowserRouter>
    );

    const secondEmoji = screen.getByRole('img', { name: 'Product icon' }).textContent;

    expect(firstEmoji).toBe(secondEmoji);
  });

  it('should display all required elements (emoji, name, part number)', () => {
    render(
      <BrowserRouter>
        <ProductCard product={mockProduct} />
      </BrowserRouter>
    );

    // Validates Requirements 1.3, 1.4, 1.5
    expect(screen.getByRole('img', { name: 'Product icon' })).toBeInTheDocument();
    expect(screen.getByText('Kit, CHECK VALVE & T PIECE KIT')).toBeInTheDocument();
    expect(screen.getByText('A9044-1')).toBeInTheDocument();
  });
});
