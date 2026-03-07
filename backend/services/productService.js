const path = require('path');
const db = require('../config/database');
const { parseProductCSV, validateProduct } = require('./csvParser');

/**
 * ProductService
 * Handles product data operations including CSV import and database queries
 */

/**
 * Load products from CSV file
 * @param {string} csvFilePath - Path to CSV file (optional, defaults to product_list.csv in root)
 * @returns {Promise<Array>} Array of product objects
 */
async function loadProductsFromCSV(csvFilePath = null) {
  try {
    // Default to product_list.csv in project root
    const filePath = csvFilePath || path.join(__dirname, '../../product_list.csv');

    console.log(`[ProductService] Loading products from ${filePath}`);
    const products = await parseProductCSV(filePath);

    // Validate all products
    for (const product of products) {
      validateProduct(product);
    }

    console.log(`[ProductService] Successfully loaded ${products.length} products from CSV`);
    return products;
  } catch (error) {
    console.error('[ProductService] Failed to load products from CSV:', error.message);
    throw new Error(`CSV_LOAD_FAILED: ${error.message}`);
  }
}

/**
 * Import products into database (bulk insert)
 * @param {Array} products - Array of product objects
 * @returns {Promise<Object>} Import results with count of inserted products
 */
async function importProducts(products) {
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error('Products array is required and must not be empty');
  }

  try {
    console.log(`[ProductService] Importing ${products.length} products into database`);

    let insertedCount = 0;
    let skippedCount = 0;
    const errors = [];

    // Insert products one by one to handle duplicates gracefully
    for (const product of products) {
      try {
        await db.query(
          'INSERT INTO products (part_number, description, price) VALUES (?, ?, ?)',
          [product.part_number, product.description, product.price]
        );
        insertedCount++;
      } catch (error) {
        // Skip duplicate entries (unique constraint violation)
        if (error.code === 'ER_DUP_ENTRY') {
          skippedCount++;
          console.log(`[ProductService] Skipping duplicate product: ${product.part_number}`);
        } else {
          errors.push({
            part_number: product.part_number,
            error: error.message
          });
          console.error(`[ProductService] Failed to insert product ${product.part_number}:`, error.message);
        }
      }
    }

    const result = {
      total: products.length,
      inserted: insertedCount,
      skipped: skippedCount,
      failed: errors.length,
      errors: errors
    };

    console.log(`[ProductService] Import complete: ${insertedCount} inserted, ${skippedCount} skipped, ${errors.length} failed`);
    return result;
  } catch (error) {
    console.error('[ProductService] Import failed:', error.message);
    throw new Error(`PRODUCT_IMPORT_FAILED: ${error.message}`);
  }
}

/**
 * Get all products from database
 * @returns {Promise<Array>} Array of all products
 */
async function getAllProducts() {
  try {
    const products = await db.query(
      'SELECT id, part_number, description, price, created_at FROM products ORDER BY id ASC'
    );

    console.log(`[ProductService] Retrieved ${products.length} products`);
    return products;
  } catch (error) {
    console.error('[ProductService] Failed to get all products:', error.message);

    // Check for connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      const dbError = new Error('Database connection failed');
      dbError.code = 'DATABASE_CONNECTION_FAILED';
      dbError.statusCode = 503;
      throw dbError;
    }

    const dbError = new Error('Failed to load products');
    dbError.code = 'PRODUCT_LOAD_FAILED';
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Get a single product by ID
 * @param {number} id - Product ID
 * @returns {Promise<Object|null>} Product object or null if not found
 */
async function getProductById(id) {
  try {
    const products = await db.query(
      'SELECT id, part_number, description, price, created_at FROM products WHERE id = ?',
      [id]
    );

    if (products.length === 0) {
      console.log(`[ProductService] Product not found: ${id}`);
      return null;
    }

    console.log(`[ProductService] Retrieved product: ${id}`);
    return products[0];
  } catch (error) {
    console.error('[ProductService] Failed to get product by ID:', error.message);

    // Check for connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      const dbError = new Error('Database connection failed');
      dbError.code = 'DATABASE_CONNECTION_FAILED';
      dbError.statusCode = 503;
      throw dbError;
    }

    const dbError = new Error('Failed to load product');
    dbError.code = 'PRODUCT_LOAD_FAILED';
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Check if a product exists by ID
 * @param {number} id - Product ID
 * @returns {Promise<boolean>} True if product exists, false otherwise
 */
async function productExists(id) {
  try {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM products WHERE id = ?',
      [id]
    );

    const exists = result[0].count > 0;
    console.log(`[ProductService] Product ${id} exists: ${exists}`);
    return exists;
  } catch (error) {
    console.error('[ProductService] Failed to check product existence:', error.message);

    // Check for connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      const dbError = new Error('Database connection failed');
      dbError.code = 'DATABASE_CONNECTION_FAILED';
      dbError.statusCode = 503;
      throw dbError;
    }

    const dbError = new Error('Failed to validate product');
    dbError.code = 'PRODUCT_VALIDATION_FAILED';
    dbError.statusCode = 500;
    throw dbError;
  }
}

module.exports = {
  loadProductsFromCSV,
  importProducts,
  getAllProducts,
  getProductById,
  productExists
};
