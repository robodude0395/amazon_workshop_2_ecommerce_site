const request = require('supertest');
const express = require('express');
const productsRouter = require('../routes/products');
const productService = require('../services/productService');

// Mock the productService module
jest.mock('../services/productService');

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/products', productsRouter);

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

describe('GET /api/products', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all products with 200 status', async () => {
    // Mock successful product retrieval
    const mockProducts = [
      {
        id: 1,
        part_number: 'SD-1000',
        description: 'Advanced X-Ray Scanner',
        price: 45000.00,
        created_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        part_number: 'SD-2000',
        description: 'Portable Explosive Trace Detector',
        price: 12500.00,
        created_at: '2024-01-15T10:31:00Z'
      }
    ];

    productService.getAllProducts.mockResolvedValue(mockProducts);

    const response = await request(app).get('/api/products');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: mockProducts
    });
    expect(productService.getAllProducts).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when no products exist', async () => {
    // Mock empty product list
    productService.getAllProducts.mockResolvedValue([]);

    const response = await request(app).get('/api/products');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: []
    });
    expect(productService.getAllProducts).toHaveBeenCalledTimes(1);
  });

  it('should return 503 when database connection fails', async () => {
    // Mock database connection error
    const dbError = new Error('Database connection failed');
    dbError.code = 'DATABASE_CONNECTION_FAILED';
    dbError.statusCode = 503;

    productService.getAllProducts.mockRejectedValue(dbError);

    const response = await request(app).get('/api/products');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'DATABASE_CONNECTION_FAILED',
        message: 'Database connection failed'
      }
    });
    expect(productService.getAllProducts).toHaveBeenCalledTimes(1);
  });

  it('should return 500 for other database errors', async () => {
    // Mock generic database error
    const dbError = new Error('Failed to load products');
    dbError.code = 'PRODUCT_LOAD_FAILED';
    dbError.statusCode = 500;

    productService.getAllProducts.mockRejectedValue(dbError);

    const response = await request(app).get('/api/products');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'PRODUCT_LOAD_FAILED',
        message: 'Failed to load products'
      }
    });
    expect(productService.getAllProducts).toHaveBeenCalledTimes(1);
  });
});

describe('GET /api/products/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a single product with 200 status', async () => {
    // Mock successful product retrieval
    const mockProduct = {
      id: 1,
      part_number: 'SD-1000',
      description: 'Advanced X-Ray Scanner',
      price: 45000.00,
      created_at: '2024-01-15T10:30:00Z'
    };

    productService.getProductById.mockResolvedValue(mockProduct);

    const response = await request(app).get('/api/products/1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: mockProduct
    });
    expect(productService.getProductById).toHaveBeenCalledTimes(1);
    expect(productService.getProductById).toHaveBeenCalledWith(1);
  });

  it('should return 404 when product does not exist', async () => {
    // Mock product not found
    productService.getProductById.mockResolvedValue(null);

    const response = await request(app).get('/api/products/999');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product with ID 999 not found'
      }
    });
    expect(productService.getProductById).toHaveBeenCalledTimes(1);
    expect(productService.getProductById).toHaveBeenCalledWith(999);
  });

  it('should return 400 for invalid product ID (non-numeric)', async () => {
    const response = await request(app).get('/api/products/abc');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'INVALID_PRODUCT_ID',
        message: 'Invalid product ID'
      }
    });
    expect(productService.getProductById).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid product ID (negative number)', async () => {
    const response = await request(app).get('/api/products/-1');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'INVALID_PRODUCT_ID',
        message: 'Invalid product ID'
      }
    });
    expect(productService.getProductById).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid product ID (zero)', async () => {
    const response = await request(app).get('/api/products/0');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'INVALID_PRODUCT_ID',
        message: 'Invalid product ID'
      }
    });
    expect(productService.getProductById).not.toHaveBeenCalled();
  });

  it('should return 503 when database connection fails', async () => {
    // Mock database connection error
    const dbError = new Error('Database connection failed');
    dbError.code = 'DATABASE_CONNECTION_FAILED';
    dbError.statusCode = 503;

    productService.getProductById.mockRejectedValue(dbError);

    const response = await request(app).get('/api/products/1');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'DATABASE_CONNECTION_FAILED',
        message: 'Database connection failed'
      }
    });
    expect(productService.getProductById).toHaveBeenCalledTimes(1);
  });

  it('should return 500 for other database errors', async () => {
    // Mock generic database error
    const dbError = new Error('Failed to load product');
    dbError.code = 'PRODUCT_LOAD_FAILED';
    dbError.statusCode = 500;

    productService.getProductById.mockRejectedValue(dbError);

    const response = await request(app).get('/api/products/1');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'PRODUCT_LOAD_FAILED',
        message: 'Failed to load product'
      }
    });
    expect(productService.getProductById).toHaveBeenCalledTimes(1);
  });
});
