const productService = require('../productService');
const db = require('../../config/database');
const path = require('path');
const fs = require('fs');

// Mock the database module
jest.mock('../../config/database');

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadProductsFromCSV', () => {
    it('should load and validate products from CSV file', async () => {
      const products = await productService.loadProductsFromCSV();

      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);

      // Verify first product has required fields
      const firstProduct = products[0];
      expect(firstProduct).toHaveProperty('part_number');
      expect(firstProduct).toHaveProperty('description');
      expect(firstProduct).toHaveProperty('price');
      expect(typeof firstProduct.price).toBe('number');
      expect(firstProduct.price).toBeGreaterThan(0);
    });

    it('should throw error if CSV file not found', async () => {
      await expect(
        productService.loadProductsFromCSV('/nonexistent/file.csv')
      ).rejects.toThrow('CSV_LOAD_FAILED');
    });
  });

  describe('importProducts', () => {
    it('should import products into database', async () => {
      const testProducts = [
        { part_number: 'TEST-001', description: 'Test Product 1', price: 100.00 },
        { part_number: 'TEST-002', description: 'Test Product 2', price: 200.00 }
      ];

      db.query.mockResolvedValue([{ insertId: 1 }]);

      const result = await productService.importProducts(testProducts);

      expect(result.total).toBe(2);
      expect(result.inserted).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.failed).toBe(0);
      expect(db.query).toHaveBeenCalledTimes(2);
    });

    it('should skip duplicate products', async () => {
      const testProducts = [
        { part_number: 'TEST-001', description: 'Test Product 1', price: 100.00 },
        { part_number: 'TEST-001', description: 'Test Product 1 Duplicate', price: 150.00 }
      ];

      db.query
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockRejectedValueOnce({ code: 'ER_DUP_ENTRY', message: 'Duplicate entry' });

      const result = await productService.importProducts(testProducts);

      expect(result.total).toBe(2);
      expect(result.inserted).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('should throw error if products array is empty', async () => {
      await expect(
        productService.importProducts([])
      ).rejects.toThrow('Products array is required and must not be empty');
    });

    it('should handle database errors during import', async () => {
      const testProducts = [
        { part_number: 'TEST-001', description: 'Test Product 1', price: 100.00 }
      ];

      db.query.mockRejectedValue(new Error('Database error'));

      const result = await productService.importProducts(testProducts);

      expect(result.total).toBe(1);
      expect(result.inserted).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors.length).toBe(1);
    });
  });

  describe('getAllProducts', () => {
    it('should retrieve all products from database', async () => {
      const mockProducts = [
        { id: 1, part_number: 'TEST-001', description: 'Test Product 1', price: 100.00, created_at: new Date() },
        { id: 2, part_number: 'TEST-002', description: 'Test Product 2', price: 200.00, created_at: new Date() }
      ];

      db.query.mockResolvedValue(mockProducts);

      const products = await productService.getAllProducts();

      expect(products).toEqual(mockProducts);
      expect(db.query).toHaveBeenCalledWith(
        'SELECT id, part_number, description, price, created_at FROM products ORDER BY id ASC'
      );
    });

    it('should return empty array if no products exist', async () => {
      db.query.mockResolvedValue([]);

      const products = await productService.getAllProducts();

      expect(products).toEqual([]);
      expect(products.length).toBe(0);
    });

    it('should throw 503 error on database connection failure', async () => {
      db.query.mockRejectedValue({ code: 'ECONNREFUSED', message: 'Connection refused' });

      await expect(productService.getAllProducts()).rejects.toMatchObject({
        message: 'Database connection failed',
        code: 'DATABASE_CONNECTION_FAILED',
        statusCode: 503
      });
    });

    it('should throw 500 error on other database errors', async () => {
      db.query.mockRejectedValue(new Error('Query failed'));

      await expect(productService.getAllProducts()).rejects.toMatchObject({
        message: 'Failed to load products',
        code: 'PRODUCT_LOAD_FAILED',
        statusCode: 500
      });
    });
  });

  describe('getProductById', () => {
    it('should retrieve a product by ID', async () => {
      const mockProduct = {
        id: 1,
        part_number: 'TEST-001',
        description: 'Test Product 1',
        price: 100.00,
        created_at: new Date()
      };

      db.query.mockResolvedValue([mockProduct]);

      const product = await productService.getProductById(1);

      expect(product).toEqual(mockProduct);
      expect(db.query).toHaveBeenCalledWith(
        'SELECT id, part_number, description, price, created_at FROM products WHERE id = ?',
        [1]
      );
    });

    it('should return null if product not found', async () => {
      db.query.mockResolvedValue([]);

      const product = await productService.getProductById(9999);

      expect(product).toBeNull();
    });

    it('should throw 503 error on database connection failure', async () => {
      db.query.mockRejectedValue({ code: 'ECONNREFUSED', message: 'Connection refused' });

      await expect(productService.getProductById(1)).rejects.toMatchObject({
        message: 'Database connection failed',
        code: 'DATABASE_CONNECTION_FAILED',
        statusCode: 503
      });
    });

    it('should throw 500 error on other database errors', async () => {
      db.query.mockRejectedValue(new Error('Query failed'));

      await expect(productService.getProductById(1)).rejects.toMatchObject({
        message: 'Failed to load product',
        code: 'PRODUCT_LOAD_FAILED',
        statusCode: 500
      });
    });
  });

  describe('productExists', () => {
    it('should return true if product exists', async () => {
      db.query.mockResolvedValue([{ count: 1 }]);

      const exists = await productService.productExists(1);

      expect(exists).toBe(true);
      expect(db.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM products WHERE id = ?',
        [1]
      );
    });

    it('should return false if product does not exist', async () => {
      db.query.mockResolvedValue([{ count: 0 }]);

      const exists = await productService.productExists(9999);

      expect(exists).toBe(false);
    });

    it('should throw 503 error on database connection failure', async () => {
      db.query.mockRejectedValue({ code: 'ECONNREFUSED', message: 'Connection refused' });

      await expect(productService.productExists(1)).rejects.toMatchObject({
        message: 'Database connection failed',
        code: 'DATABASE_CONNECTION_FAILED',
        statusCode: 503
      });
    });

    it('should throw 500 error on other database errors', async () => {
      db.query.mockRejectedValue(new Error('Query failed'));

      await expect(productService.productExists(1)).rejects.toMatchObject({
        message: 'Failed to validate product',
        code: 'PRODUCT_VALIDATION_FAILED',
        statusCode: 500
      });
    });
  });
});
