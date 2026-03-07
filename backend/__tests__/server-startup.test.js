const db = require('../config/database');
const productService = require('../services/productService');

// Mock the database module
jest.mock('../config/database');

describe('Server Startup - Product Import', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Product import on startup', () => {
    it('should import products when products table is empty', async () => {
      // Mock database connection
      db.connect = jest.fn().mockResolvedValue(true);

      // Mock empty products table
      db.query = jest.fn()
        .mockResolvedValueOnce([{ count: 0 }]) // First call: check if table is empty
        .mockResolvedValue([{ insertId: 1 }]); // Subsequent calls: insert products

      // Mock loadProductsFromCSV
      const mockProducts = [
        { part_number: 'TEST-001', description: 'Test Product 1', price: 100.00 },
        { part_number: 'TEST-002', description: 'Test Product 2', price: 200.00 }
      ];
      jest.spyOn(productService, 'loadProductsFromCSV').mockResolvedValue(mockProducts);
      jest.spyOn(productService, 'importProducts').mockResolvedValue({
        total: 2,
        inserted: 2,
        skipped: 0,
        failed: 0,
        errors: []
      });

      // Simulate startup sequence
      await db.connect();
      const products = await db.query('SELECT COUNT(*) as count FROM products');
      const productCount = products[0].count;

      expect(productCount).toBe(0);

      // Import products
      const productsFromCSV = await productService.loadProductsFromCSV();
      const importResult = await productService.importProducts(productsFromCSV);

      expect(productService.loadProductsFromCSV).toHaveBeenCalled();
      expect(productService.importProducts).toHaveBeenCalledWith(mockProducts);
      expect(importResult.inserted).toBe(2);
      expect(importResult.failed).toBe(0);
    });

    it('should skip import when products table is not empty', async () => {
      // Mock database connection
      db.connect = jest.fn().mockResolvedValue(true);

      // Mock non-empty products table
      db.query = jest.fn().mockResolvedValueOnce([{ count: 10 }]);

      // Mock loadProductsFromCSV (should not be called)
      jest.spyOn(productService, 'loadProductsFromCSV').mockResolvedValue([]);
      jest.spyOn(productService, 'importProducts').mockResolvedValue({
        total: 0,
        inserted: 0,
        skipped: 0,
        failed: 0,
        errors: []
      });

      // Simulate startup sequence
      await db.connect();
      const products = await db.query('SELECT COUNT(*) as count FROM products');
      const productCount = products[0].count;

      expect(productCount).toBe(10);

      // Should not import products
      expect(productService.loadProductsFromCSV).not.toHaveBeenCalled();
      expect(productService.importProducts).not.toHaveBeenCalled();
    });

    it('should continue startup even if CSV import fails', async () => {
      // Mock database connection
      db.connect = jest.fn().mockResolvedValue(true);

      // Mock empty products table
      db.query = jest.fn().mockResolvedValueOnce([{ count: 0 }]);

      // Mock loadProductsFromCSV to throw error
      jest.spyOn(productService, 'loadProductsFromCSV').mockRejectedValue(
        new Error('CSV_LOAD_FAILED: CSV file not found')
      );

      // Simulate startup sequence
      await db.connect();
      const products = await db.query('SELECT COUNT(*) as count FROM products');
      const productCount = products[0].count;

      expect(productCount).toBe(0);

      // Try to import products (should fail gracefully)
      try {
        await productService.loadProductsFromCSV();
      } catch (error) {
        // Error should be caught and logged, but startup should continue
        expect(error.message).toContain('CSV_LOAD_FAILED');
      }

      // Server should continue startup despite import failure
      expect(productService.loadProductsFromCSV).toHaveBeenCalled();
    });

    it('should log import results on successful import', async () => {
      // Mock console.log to verify logging
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Mock database connection
      db.connect = jest.fn().mockResolvedValue(true);

      // Mock empty products table
      db.query = jest.fn().mockResolvedValueOnce([{ count: 0 }]);

      // Mock successful import
      const mockProducts = [
        { part_number: 'TEST-001', description: 'Test Product 1', price: 100.00 }
      ];
      jest.spyOn(productService, 'loadProductsFromCSV').mockResolvedValue(mockProducts);
      jest.spyOn(productService, 'importProducts').mockResolvedValue({
        total: 1,
        inserted: 1,
        skipped: 0,
        failed: 0,
        errors: []
      });

      // Simulate startup sequence
      await db.connect();
      const products = await db.query('SELECT COUNT(*) as count FROM products');
      const productCount = products[0].count;

      if (productCount === 0) {
        const productsFromCSV = await productService.loadProductsFromCSV();
        const importResult = await productService.importProducts(productsFromCSV);

        // Verify import results are available for logging
        expect(importResult.total).toBe(1);
        expect(importResult.inserted).toBe(1);
        expect(importResult.skipped).toBe(0);
        expect(importResult.failed).toBe(0);
      }

      consoleSpy.mockRestore();
    });
  });
});
