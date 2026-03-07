const fs = require('fs');
const path = require('path');
const { parseProductCSV, validateProduct, isEmptyRow, mapRowToProduct } = require('../csvParser');

describe('CSV Parser', () => {
  describe('isEmptyRow', () => {
    it('should return true for empty row', () => {
      const emptyRow = { col1: '', col2: '  ', col3: '' };
      expect(isEmptyRow(emptyRow)).toBe(true);
    });

    it('should return false for non-empty row', () => {
      const nonEmptyRow = { col1: 'value', col2: '', col3: '' };
      expect(isEmptyRow(nonEmptyRow)).toBe(false);
    });
  });

  describe('validateProduct', () => {
    it('should validate a valid product', () => {
      const validProduct = {
        part_number: 'SD-1000',
        description: 'Advanced X-Ray Scanner',
        price: 45000.00
      };
      expect(() => validateProduct(validProduct)).not.toThrow();
    });

    it('should reject product with missing part_number', () => {
      const invalidProduct = {
        description: 'Test Product',
        price: 100.00
      };
      expect(() => validateProduct(invalidProduct)).toThrow('Invalid part_number');
    });

    it('should reject product with missing description', () => {
      const invalidProduct = {
        part_number: 'SD-1000',
        price: 100.00
      };
      expect(() => validateProduct(invalidProduct)).toThrow('Invalid description');
    });

    it('should reject product with invalid price', () => {
      const invalidProduct = {
        part_number: 'SD-1000',
        description: 'Test Product',
        price: -100
      };
      expect(() => validateProduct(invalidProduct)).toThrow('Invalid price');
    });

    it('should reject product with part_number exceeding 100 characters', () => {
      const invalidProduct = {
        part_number: 'A'.repeat(101),
        description: 'Test Product',
        price: 100.00
      };
      expect(() => validateProduct(invalidProduct)).toThrow('exceeds maximum length');
    });
  });

  describe('mapRowToProduct', () => {
    it('should map valid CSV row to product object', () => {
      const row = {
        'Field Orderable Spare Part No': 'A9044-1',
        'Part/Material Description': 'Kit, CHECK VALVE & T PIECE KIT'
      };
      const product = mapRowToProduct(row, 1);

      expect(product).toBeDefined();
      expect(product.part_number).toBe('A9044-1');
      expect(product.description).toBe('Kit, CHECK VALVE & T PIECE KIT');
      expect(product.price).toBeGreaterThan(0);
      expect(typeof product.price).toBe('number');
    });

    it('should throw error for row with missing part number', () => {
      const row = {
        'Field Orderable Spare Part No': '',
        'Part/Material Description': 'Some description'
      };
      expect(() => mapRowToProduct(row, 1)).toThrow('Missing part number');
    });

    it('should throw error for row with missing description', () => {
      const row = {
        'Field Orderable Spare Part No': 'SD-1000',
        'Part/Material Description': ''
      };
      expect(() => mapRowToProduct(row, 1)).toThrow('Missing description');
    });

    it('should generate consistent prices for same part number', () => {
      const row = {
        'Field Orderable Spare Part No': 'TEST-123',
        'Part/Material Description': 'Test Product'
      };
      const product1 = mapRowToProduct(row, 1);
      const product2 = mapRowToProduct(row, 2);

      expect(product1.price).toBe(product2.price);
    });
  });

  describe('parseProductCSV', () => {
    const testCSVPath = path.join(__dirname, 'test-products.csv');

    beforeEach(() => {
      // Create a test CSV file
      const csvContent = `Field Orderable Spare Part No,Master Spare Part No,Part/Material Description,Quantity Required Per Unit
SD-1000,SD-1000,Advanced X-Ray Scanner for Airport Security,1
SD-2000,SD-2000,Portable Explosive Trace Detector,1

SD-3000,SD-3000,Handheld Metal Detector,1`;

      fs.writeFileSync(testCSVPath, csvContent);
    });

    afterEach(() => {
      // Clean up test file
      if (fs.existsSync(testCSVPath)) {
        fs.unlinkSync(testCSVPath);
      }
    });

    it('should parse valid CSV file', async () => {
      const products = await parseProductCSV(testCSVPath);

      expect(products).toHaveLength(3);
      expect(products[0].part_number).toBe('SD-1000');
      expect(products[0].description).toBe('Advanced X-Ray Scanner for Airport Security');
      expect(products[1].part_number).toBe('SD-2000');
      expect(products[2].part_number).toBe('SD-3000');
    });

    it('should skip empty rows', async () => {
      const products = await parseProductCSV(testCSVPath);
      // Should have 3 products, not 4 (empty row skipped)
      expect(products).toHaveLength(3);
    });

    it('should reject non-existent file', async () => {
      await expect(parseProductCSV('nonexistent.csv')).rejects.toThrow('CSV file not found');
    });

    it('should handle malformed rows gracefully', async () => {
      const malformedCSVPath = path.join(__dirname, 'malformed.csv');
      const csvContent = `Field Orderable Spare Part No,Master Spare Part No,Part/Material Description
SD-1000,SD-1000,Valid Product
,SD-2000,Missing Part Number
SD-3000,SD-3000,Another Valid Product`;

      fs.writeFileSync(malformedCSVPath, csvContent);

      const products = await parseProductCSV(malformedCSVPath);

      // Should have 2 valid products (malformed row skipped)
      expect(products).toHaveLength(2);
      expect(products[0].part_number).toBe('SD-1000');
      expect(products[1].part_number).toBe('SD-3000');

      fs.unlinkSync(malformedCSVPath);
    });
  });
});
