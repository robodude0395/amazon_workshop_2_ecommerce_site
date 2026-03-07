const cartService = require('../cartService');
const db = require('../../config/database');
const productService = require('../productService');

// Mock the database and product service modules
jest.mock('../../config/database');
jest.mock('../productService');

describe('CartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCart', () => {
    it('should retrieve cart with items and product details', async () => {
      const mockCartItems = [
        {
          id: 1,
          product_id: 1,
          quantity: 2,
          created_at: new Date('2024-01-20T14:30:00Z'),
          updated_at: new Date('2024-01-20T14:30:00Z'),
          part_number: 'SD-1000',
          description: 'Advanced X-Ray Scanner',
          price: 45000.00,
          line_total: 90000.00
        },
        {
          id: 2,
          product_id: 2,
          quantity: 1,
          created_at: new Date('2024-01-20T15:00:00Z'),
          updated_at: new Date('2024-01-20T15:00:00Z'),
          part_number: 'SD-2000',
          description: 'Portable Explosive Detector',
          price: 12500.00,
          line_total: 12500.00
        }
      ];

      db.query.mockResolvedValue(mockCartItems);

      const cart = await cartService.getCart();

      expect(cart).toHaveProperty('items');
      expect(cart).toHaveProperty('total');
      expect(cart).toHaveProperty('item_count');
      expect(cart.items.length).toBe(2);
      expect(cart.total).toBe(102500.00);
      expect(cart.item_count).toBe(3);

      // Verify item structure
      expect(cart.items[0]).toMatchObject({
        id: 1,
        product_id: 1,
        quantity: 2,
        line_total: 90000.00
      });
      expect(cart.items[0].product).toMatchObject({
        id: 1,
        part_number: 'SD-1000',
        description: 'Advanced X-Ray Scanner',
        price: 45000.00
      });
    });

    it('should return empty cart when no items exist', async () => {
      db.query.mockResolvedValue([]);

      const cart = await cartService.getCart();

      expect(cart.items).toEqual([]);
      expect(cart.total).toBe(0);
      expect(cart.item_count).toBe(0);
    });

    it('should throw 503 error on database connection failure', async () => {
      db.query.mockRejectedValue({ code: 'ECONNREFUSED', message: 'Connection refused' });

      await expect(cartService.getCart()).rejects.toMatchObject({
        message: 'Database connection failed',
        code: 'DATABASE_CONNECTION_FAILED',
        statusCode: 503
      });
    });

    it('should throw 500 error on other database errors', async () => {
      db.query.mockRejectedValue(new Error('Query failed'));

      await expect(cartService.getCart()).rejects.toMatchObject({
        message: 'Failed to load cart',
        code: 'CART_LOAD_FAILED',
        statusCode: 500
      });
    });
  });

  describe('addItem', () => {
    it('should create new cart item when product not in cart', async () => {
      productService.productExists.mockResolvedValue(true);
      db.query
        .mockResolvedValueOnce([]) // Check for existing item
        .mockResolvedValueOnce([{ insertId: 1 }]) // Insert new item
        .mockResolvedValueOnce([{ // Return created item
          id: 1,
          product_id: 1,
          quantity: 2,
          created_at: new Date(),
          updated_at: new Date()
        }]);

      const result = await cartService.addItem(1, 2);

      expect(result).toMatchObject({
        id: 1,
        product_id: 1,
        quantity: 2
      });
      expect(db.query).toHaveBeenCalledWith(
        'INSERT INTO cart_items (product_id, quantity) VALUES (?, ?)',
        [1, 2]
      );
    });

    it('should increment quantity when product already in cart', async () => {
      productService.productExists.mockResolvedValue(true);
      db.query
        .mockResolvedValueOnce([{ id: 1, quantity: 3 }]) // Existing item
        .mockResolvedValueOnce([]) // Update query
        .mockResolvedValueOnce([{ // Return updated item
          id: 1,
          product_id: 1,
          quantity: 5,
          created_at: new Date(),
          updated_at: new Date()
        }]);

      const result = await cartService.addItem(1, 2);

      expect(result.quantity).toBe(5);
      expect(db.query).toHaveBeenCalledWith(
        'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [5, 1]
      );
    });

    it('should throw 404 error if product does not exist', async () => {
      productService.productExists.mockResolvedValue(false);

      await expect(cartService.addItem(9999, 1)).rejects.toMatchObject({
        message: 'Product with ID 9999 not found',
        code: 'PRODUCT_NOT_FOUND',
        statusCode: 404
      });
    });

    it('should throw 400 error for invalid product ID', async () => {
      await expect(cartService.addItem(null, 1)).rejects.toMatchObject({
        message: 'Product ID is required and must be a positive integer',
        code: 'INVALID_PRODUCT_ID',
        statusCode: 400
      });

      await expect(cartService.addItem(-1, 1)).rejects.toMatchObject({
        code: 'INVALID_PRODUCT_ID',
        statusCode: 400
      });

      await expect(cartService.addItem(1.5, 1)).rejects.toMatchObject({
        code: 'INVALID_PRODUCT_ID',
        statusCode: 400
      });
    });

    it('should throw 400 error for invalid quantity', async () => {
      await expect(cartService.addItem(1, null)).rejects.toMatchObject({
        message: 'Quantity must be a positive integer',
        code: 'INVALID_QUANTITY',
        statusCode: 400
      });

      await expect(cartService.addItem(1, 0)).rejects.toMatchObject({
        code: 'INVALID_QUANTITY',
        statusCode: 400
      });

      await expect(cartService.addItem(1, -1)).rejects.toMatchObject({
        code: 'INVALID_QUANTITY',
        statusCode: 400
      });

      await expect(cartService.addItem(1, 1.5)).rejects.toMatchObject({
        code: 'INVALID_QUANTITY',
        statusCode: 400
      });
    });

    it('should throw 503 error on database connection failure', async () => {
      productService.productExists.mockResolvedValue(true);
      db.query.mockRejectedValue({ code: 'ECONNREFUSED', message: 'Connection refused' });

      await expect(cartService.addItem(1, 1)).rejects.toMatchObject({
        message: 'Database connection failed',
        code: 'DATABASE_CONNECTION_FAILED',
        statusCode: 503
      });
    });
  });

  describe('updateItemQuantity', () => {
    it('should update cart item quantity', async () => {
      db.query
        .mockResolvedValueOnce([{ id: 1 }]) // Check item exists
        .mockResolvedValueOnce([]) // Update query
        .mockResolvedValueOnce([{ // Return updated item
          id: 1,
          product_id: 1,
          quantity: 5,
          created_at: new Date(),
          updated_at: new Date()
        }]);

      const result = await cartService.updateItemQuantity(1, 5);

      expect(result.quantity).toBe(5);
      expect(db.query).toHaveBeenCalledWith(
        'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [5, 1]
      );
    });

    it('should remove item when quantity is 0', async () => {
      db.query
        .mockResolvedValueOnce([{ id: 1 }]) // Check item exists
        .mockResolvedValueOnce([]); // Delete query

      const result = await cartService.updateItemQuantity(1, 0);

      expect(result).toBeNull();
      expect(db.query).toHaveBeenCalledWith(
        'DELETE FROM cart_items WHERE id = ?',
        [1]
      );
    });

    it('should throw 404 error if cart item not found', async () => {
      db.query.mockResolvedValueOnce([]); // Item doesn't exist

      await expect(cartService.updateItemQuantity(9999, 5)).rejects.toMatchObject({
        message: 'Cart item with ID 9999 not found',
        code: 'CART_ITEM_NOT_FOUND',
        statusCode: 404
      });
    });

    it('should throw 400 error for invalid item ID', async () => {
      await expect(cartService.updateItemQuantity(null, 1)).rejects.toMatchObject({
        message: 'Item ID is required and must be a positive integer',
        code: 'INVALID_ITEM_ID',
        statusCode: 400
      });

      await expect(cartService.updateItemQuantity(-1, 1)).rejects.toMatchObject({
        code: 'INVALID_ITEM_ID',
        statusCode: 400
      });
    });

    it('should throw 400 error for invalid quantity', async () => {
      await expect(cartService.updateItemQuantity(1, -1)).rejects.toMatchObject({
        message: 'Quantity must be a non-negative integer',
        code: 'INVALID_QUANTITY',
        statusCode: 400
      });

      await expect(cartService.updateItemQuantity(1, 1.5)).rejects.toMatchObject({
        code: 'INVALID_QUANTITY',
        statusCode: 400
      });
    });

    it('should throw 503 error on database connection failure', async () => {
      db.query.mockRejectedValue({ code: 'PROTOCOL_CONNECTION_LOST', message: 'Connection lost' });

      await expect(cartService.updateItemQuantity(1, 5)).rejects.toMatchObject({
        message: 'Database connection failed',
        code: 'DATABASE_CONNECTION_FAILED',
        statusCode: 503
      });
    });
  });

  describe('removeItem', () => {
    it('should remove cart item', async () => {
      db.query
        .mockResolvedValueOnce([{ id: 1 }]) // Check item exists
        .mockResolvedValueOnce([]); // Delete query

      await cartService.removeItem(1);

      expect(db.query).toHaveBeenCalledWith(
        'DELETE FROM cart_items WHERE id = ?',
        [1]
      );
    });

    it('should throw 404 error if cart item not found', async () => {
      db.query.mockResolvedValueOnce([]); // Item doesn't exist

      await expect(cartService.removeItem(9999)).rejects.toMatchObject({
        message: 'Cart item with ID 9999 not found',
        code: 'CART_ITEM_NOT_FOUND',
        statusCode: 404
      });
    });

    it('should throw 400 error for invalid item ID', async () => {
      await expect(cartService.removeItem(null)).rejects.toMatchObject({
        message: 'Item ID is required and must be a positive integer',
        code: 'INVALID_ITEM_ID',
        statusCode: 400
      });

      await expect(cartService.removeItem(-1)).rejects.toMatchObject({
        code: 'INVALID_ITEM_ID',
        statusCode: 400
      });

      await expect(cartService.removeItem(1.5)).rejects.toMatchObject({
        code: 'INVALID_ITEM_ID',
        statusCode: 400
      });
    });

    it('should throw 503 error on database connection failure', async () => {
      db.query.mockRejectedValue({ code: 'ECONNREFUSED', message: 'Connection refused' });

      await expect(cartService.removeItem(1)).rejects.toMatchObject({
        message: 'Database connection failed',
        code: 'DATABASE_CONNECTION_FAILED',
        statusCode: 503
      });
    });
  });

  describe('calculateCartTotal', () => {
    it('should calculate total from cart items', () => {
      const items = [
        { line_total: 90000.00 },
        { line_total: 12500.00 },
        { line_total: 5000.00 }
      ];

      const total = cartService.calculateCartTotal(items);

      expect(total).toBe(107500.00);
    });

    it('should return 0 for empty cart', () => {
      expect(cartService.calculateCartTotal([])).toBe(0);
      expect(cartService.calculateCartTotal(null)).toBe(0);
      expect(cartService.calculateCartTotal(undefined)).toBe(0);
    });

    it('should handle items with missing line_total', () => {
      const items = [
        { line_total: 100.00 },
        { line_total: null },
        { line_total: 50.00 }
      ];

      const total = cartService.calculateCartTotal(items);

      expect(total).toBe(150.00);
    });

    it('should round to 2 decimal places', () => {
      const items = [
        { line_total: 10.555 },
        { line_total: 20.444 }
      ];

      const total = cartService.calculateCartTotal(items);

      expect(total).toBe(31.00);
    });
  });

  describe('getCartItemCount', () => {
    it('should return total quantity of all items', async () => {
      db.query.mockResolvedValue([{ total_count: 15 }]);

      const count = await cartService.getCartItemCount();

      expect(count).toBe(15);
      expect(db.query).toHaveBeenCalledWith(
        'SELECT COALESCE(SUM(quantity), 0) as total_count FROM cart_items'
      );
    });

    it('should return 0 for empty cart', async () => {
      db.query.mockResolvedValue([{ total_count: 0 }]);

      const count = await cartService.getCartItemCount();

      expect(count).toBe(0);
    });

    it('should throw 503 error on database connection failure', async () => {
      db.query.mockRejectedValue({ code: 'ECONNREFUSED', message: 'Connection refused' });

      await expect(cartService.getCartItemCount()).rejects.toMatchObject({
        message: 'Database connection failed',
        code: 'DATABASE_CONNECTION_FAILED',
        statusCode: 503
      });
    });

    it('should throw 500 error on other database errors', async () => {
      db.query.mockRejectedValue(new Error('Query failed'));

      await expect(cartService.getCartItemCount()).rejects.toMatchObject({
        message: 'Failed to get cart item count',
        code: 'CART_LOAD_FAILED',
        statusCode: 500
      });
    });
  });
});
