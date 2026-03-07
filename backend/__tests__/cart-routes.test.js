const request = require('supertest');
const express = require('express');
const cartRouter = require('../routes/cart');
const cartService = require('../services/cartService');

// Mock the cartService module
jest.mock('../services/cartService');

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/cart', cartRouter);

// Error handler middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred',
    },
  });
});

describe('POST /api/cart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Success cases', () => {
    it('should add new item to cart and return 201', async () => {
      // Mock successful cart item creation
      const mockCartItem = {
        id: 1,
        product_id: 1,
        quantity: 2,
        created_at: '2024-01-20T14:30:00Z',
        updated_at: '2024-01-20T14:30:00Z'
      };

      cartService.addItem.mockResolvedValue(mockCartItem);

      const response = await request(app)
        .post('/api/cart')
        .send({ product_id: 1, quantity: 2 })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Item added to cart successfully',
        data: mockCartItem
      });

      expect(cartService.addItem).toHaveBeenCalledTimes(1);
      expect(cartService.addItem).toHaveBeenCalledWith(1, 2);
    });

    it('should increment quantity when adding existing product', async () => {
      // Mock cart item with incremented quantity
      const mockCartItem = {
        id: 1,
        product_id: 1,
        quantity: 5,
        created_at: '2024-01-20T14:30:00Z',
        updated_at: '2024-01-20T14:35:00Z'
      };

      cartService.addItem.mockResolvedValue(mockCartItem);

      const response = await request(app)
        .post('/api/cart')
        .send({ product_id: 1, quantity: 3 })
        .expect(201);

      expect(response.body.data.quantity).toBe(5);
      expect(cartService.addItem).toHaveBeenCalledWith(1, 3);
    });

    it('should handle multiple different products', async () => {
      // Mock first product
      const mockCartItem1 = {
        id: 1,
        product_id: 1,
        quantity: 1,
        created_at: '2024-01-20T14:30:00Z',
        updated_at: '2024-01-20T14:30:00Z'
      };

      cartService.addItem.mockResolvedValueOnce(mockCartItem1);

      const response1 = await request(app)
        .post('/api/cart')
        .send({ product_id: 1, quantity: 1 })
        .expect(201);

      // Mock second product
      const mockCartItem2 = {
        id: 2,
        product_id: 2,
        quantity: 2,
        created_at: '2024-01-20T14:31:00Z',
        updated_at: '2024-01-20T14:31:00Z'
      };

      cartService.addItem.mockResolvedValueOnce(mockCartItem2);

      const response2 = await request(app)
        .post('/api/cart')
        .send({ product_id: 2, quantity: 2 })
        .expect(201);

      expect(response1.body.data.product_id).toBe(1);
      expect(response2.body.data.product_id).toBe(2);
      expect(response1.body.data.id).not.toBe(response2.body.data.id);
    });
  });

  describe('Error cases - 404 Not Found', () => {
    it('should return 404 when product does not exist', async () => {
      // Mock product not found error
      const error = new Error('Product with ID 9999 not found');
      error.code = 'PRODUCT_NOT_FOUND';
      error.statusCode = 404;

      cartService.addItem.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/cart')
        .send({ product_id: 9999, quantity: 1 })
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product with ID 9999 not found'
        }
      });

      expect(cartService.addItem).toHaveBeenCalledWith(9999, 1);
    });
  });

  describe('Error cases - 400 Bad Request', () => {
    it('should return 400 when product_id is missing', async () => {
      const response = await request(app)
        .post('/api/cart')
        .send({ quantity: 1 })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_PRODUCT_ID'
        }
      });
    });

    it('should return 400 when product_id is not an integer', async () => {
      const response = await request(app)
        .post('/api/cart')
        .send({ product_id: 'abc', quantity: 1 })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_PRODUCT_ID'
        }
      });
    });

    it('should return 400 when product_id is zero', async () => {
      const response = await request(app)
        .post('/api/cart')
        .send({ product_id: 0, quantity: 1 })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_PRODUCT_ID'
        }
      });
    });

    it('should return 400 when product_id is negative', async () => {
      const response = await request(app)
        .post('/api/cart')
        .send({ product_id: -1, quantity: 1 })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_PRODUCT_ID'
        }
      });
    });

    it('should return 400 when quantity is missing', async () => {
      const response = await request(app)
        .post('/api/cart')
        .send({ product_id: 1 })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_QUANTITY'
        }
      });
    });

    it('should return 400 when quantity is not an integer', async () => {
      const response = await request(app)
        .post('/api/cart')
        .send({ product_id: 1, quantity: 'abc' })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_QUANTITY'
        }
      });
    });

    it('should return 400 when quantity is zero', async () => {
      const response = await request(app)
        .post('/api/cart')
        .send({ product_id: 1, quantity: 0 })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_QUANTITY'
        }
      });
    });

    it('should return 400 when quantity is negative', async () => {
      const response = await request(app)
        .post('/api/cart')
        .send({ product_id: 1, quantity: -1 })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_QUANTITY'
        }
      });
    });

    it('should return 400 when quantity is a decimal', async () => {
      const response = await request(app)
        .post('/api/cart')
        .send({ product_id: 1, quantity: 1.5 })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_QUANTITY'
        }
      });
    });
  });
});

describe('GET /api/cart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Success cases', () => {
    it('should return empty cart when no items exist', async () => {
      // Mock empty cart
      const mockCart = {
        items: [],
        total: 0,
        item_count: 0
      };

      cartService.getCart.mockResolvedValue(mockCart);

      const response = await request(app)
        .get('/api/cart')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: mockCart
      });

      expect(cartService.getCart).toHaveBeenCalledTimes(1);
    });

    it('should return cart with single item', async () => {
      // Mock cart with one item
      const mockCart = {
        items: [
          {
            id: 1,
            product_id: 1,
            quantity: 2,
            product: {
              id: 1,
              part_number: 'SD-1000',
              description: 'Advanced X-Ray Scanner',
              price: 45000.00
            },
            line_total: 90000.00,
            created_at: '2024-01-20T14:30:00Z',
            updated_at: '2024-01-20T14:30:00Z'
          }
        ],
        total: 90000.00,
        item_count: 2
      };

      cartService.getCart.mockResolvedValue(mockCart);

      const response = await request(app)
        .get('/api/cart')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: mockCart
      });

      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0]).toHaveProperty('product');
      expect(response.body.data.items[0]).toHaveProperty('line_total');
      expect(response.body.data.total).toBe(90000.00);
      expect(response.body.data.item_count).toBe(2);
    });

    it('should return cart with multiple items', async () => {
      // Mock cart with multiple items
      const mockCart = {
        items: [
          {
            id: 1,
            product_id: 1,
            quantity: 2,
            product: {
              id: 1,
              part_number: 'SD-1000',
              description: 'Advanced X-Ray Scanner',
              price: 45000.00
            },
            line_total: 90000.00,
            created_at: '2024-01-20T14:30:00Z',
            updated_at: '2024-01-20T14:30:00Z'
          },
          {
            id: 2,
            product_id: 2,
            quantity: 1,
            product: {
              id: 2,
              part_number: 'SD-2000',
              description: 'Portable Explosive Trace Detector',
              price: 12500.00
            },
            line_total: 12500.00,
            created_at: '2024-01-20T14:31:00Z',
            updated_at: '2024-01-20T14:31:00Z'
          }
        ],
        total: 102500.00,
        item_count: 3
      };

      cartService.getCart.mockResolvedValue(mockCart);

      const response = await request(app)
        .get('/api/cart')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: mockCart
      });

      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.total).toBe(102500.00);
      expect(response.body.data.item_count).toBe(3);
    });

    it('should include all required fields in cart items', async () => {
      // Mock cart with item
      const mockCart = {
        items: [
          {
            id: 1,
            product_id: 1,
            quantity: 1,
            product: {
              id: 1,
              part_number: 'SD-1000',
              description: 'Advanced X-Ray Scanner',
              price: 45000.00
            },
            line_total: 45000.00,
            created_at: '2024-01-20T14:30:00Z',
            updated_at: '2024-01-20T14:30:00Z'
          }
        ],
        total: 45000.00,
        item_count: 1
      };

      cartService.getCart.mockResolvedValue(mockCart);

      const response = await request(app)
        .get('/api/cart')
        .expect(200);

      const item = response.body.data.items[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('product_id');
      expect(item).toHaveProperty('quantity');
      expect(item).toHaveProperty('product');
      expect(item).toHaveProperty('line_total');
      expect(item).toHaveProperty('created_at');
      expect(item).toHaveProperty('updated_at');

      const product = item.product;
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('part_number');
      expect(product).toHaveProperty('description');
      expect(product).toHaveProperty('price');
    });
  });

  describe('Error cases - 503 Service Unavailable', () => {
    it('should return 503 when database connection fails', async () => {
      // Mock database connection error
      const error = new Error('Database connection failed');
      error.code = 'DATABASE_CONNECTION_FAILED';
      error.statusCode = 503;

      cartService.getCart.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/cart')
        .expect(503);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'DATABASE_CONNECTION_FAILED',
          message: 'Database connection failed'
        }
      });

      expect(cartService.getCart).toHaveBeenCalledTimes(1);
    });

    it('should return 500 when cart load fails', async () => {
      // Mock cart load error
      const error = new Error('Failed to load cart');
      error.code = 'CART_LOAD_FAILED';
      error.statusCode = 500;

      cartService.getCart.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/cart')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'CART_LOAD_FAILED',
          message: 'Failed to load cart'
        }
      });
    });
  });
});


// ============================================================================
// PUT /api/cart/:id Tests
// ============================================================================

describe('PUT /api/cart/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update cart item quantity', async () => {
    const mockUpdatedItem = {
      id: 1,
      product_id: 1,
      quantity: 5,
      created_at: '2024-01-20T14:30:00Z',
      updated_at: '2024-01-20T16:00:00Z'
    };

    cartService.updateItemQuantity.mockResolvedValue(mockUpdatedItem);

    const response = await request(app)
      .put('/api/cart/1')
      .send({ quantity: 5 })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.quantity).toBe(5);
    expect(response.body.message).toBe('Cart item updated successfully');
    expect(cartService.updateItemQuantity).toHaveBeenCalledWith(1, 5);
  });

  it('should remove item when quantity is 0', async () => {
    cartService.updateItemQuantity.mockResolvedValue(null);

    await request(app)
      .put('/api/cart/1')
      .send({ quantity: 0 })
      .expect(204);

    expect(cartService.updateItemQuantity).toHaveBeenCalledWith(1, 0);
  });

  it('should return 404 for non-existent cart item', async () => {
    const error = new Error('Cart item with ID 9999 not found');
    error.code = 'CART_ITEM_NOT_FOUND';
    error.statusCode = 404;
    cartService.updateItemQuantity.mockRejectedValue(error);

    const response = await request(app)
      .put('/api/cart/9999')
      .send({ quantity: 5 })
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('CART_ITEM_NOT_FOUND');
  });

  it('should return 400 for invalid quantity', async () => {
    const response = await request(app)
      .put('/api/cart/1')
      .send({ quantity: -1 })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_QUANTITY');
  });

  it('should return 400 for missing quantity', async () => {
    const response = await request(app)
      .put('/api/cart/1')
      .send({})
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_QUANTITY');
  });

  it('should return 400 for invalid cart item ID', async () => {
    const response = await request(app)
      .put('/api/cart/invalid')
      .send({ quantity: 5 })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_CART_ITEM_ID');
  });
});

// ============================================================================
// DELETE /api/cart/:id Tests
// ============================================================================

describe('DELETE /api/cart/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should remove cart item', async () => {
    cartService.removeItem.mockResolvedValue(true);

    await request(app)
      .delete('/api/cart/1')
      .expect(204);

    expect(cartService.removeItem).toHaveBeenCalledWith(1);
  });

  it('should return 404 for non-existent cart item', async () => {
    const error = new Error('Cart item with ID 9999 not found');
    error.code = 'CART_ITEM_NOT_FOUND';
    error.statusCode = 404;
    cartService.removeItem.mockRejectedValue(error);

    const response = await request(app)
      .delete('/api/cart/9999')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('CART_ITEM_NOT_FOUND');
  });

  it('should return 400 for invalid cart item ID', async () => {
    const response = await request(app)
      .delete('/api/cart/invalid')
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_CART_ITEM_ID');
  });
});
