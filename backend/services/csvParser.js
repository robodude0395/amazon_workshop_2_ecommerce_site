const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

/**
 * CSV Parser for product_list.csv
 * Handles reading, parsing, and mapping CSV data to product model
 */

/**
 * Parse CSV file and return array of product objects
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<Array>} Array of product objects
 */
function parseProductCSV(filePath) {
  return new Promise((resolve, reject) => {
    const products = [];
    const errors = [];
    let lineNumber = 0;
    let headers = null;

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`CSV file not found: ${filePath}`));
    }

    const parser = csv({
      mapHeaders: ({ header, index }) => {
        // Store original headers for debugging
        if (!headers) {
          headers = [];
        }
        headers[index] = header;

        // Rename empty headers to avoid conflicts
        if (header === '') {
          return `_unnamed_${index}`;
        }
        return header;
      }
    });

    fs.createReadStream(filePath)
      .pipe(parser)
      .on('headers', (headerList) => {
        console.log('[CSV Parser] Headers detected:', headerList);
      })
      .on('data', (row) => {
        lineNumber++;

        // Skip empty rows
        if (isEmptyRow(row)) {
          return;
        }

        try {
          const product = mapRowToProduct(row, lineNumber);
          if (product) {
            products.push(product);
          }
        } catch (error) {
          errors.push({
            line: lineNumber,
            error: error.message,
            row: row
          });
          console.warn(`[CSV Parser] Skipping malformed row ${lineNumber}: ${error.message}`);
        }
      })
      .on('end', () => {
        console.log(`[CSV Parser] Parsed ${products.length} products from ${filePath}`);
        if (errors.length > 0) {
          console.warn(`[CSV Parser] Skipped ${errors.length} malformed rows`);
        }
        resolve(products);
      })
      .on('error', (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      });
  });
}

/**
 * Check if a row is empty (all values are empty or whitespace)
 * @param {Object} row - CSV row object
 * @returns {boolean} True if row is empty
 */
function isEmptyRow(row) {
  return Object.values(row).every(value =>
    !value || value.trim() === ''
  );
}

/**
 * Map CSV row to product object
 * @param {Object} row - CSV row object
 * @param {number} lineNumber - Line number for error reporting
 * @returns {Object|null} Product object or null if invalid
 */
function mapRowToProduct(row, lineNumber) {
  // Extract part number - try different possible field names
  const partNumber = (
    row['Field Orderable Spare Part No'] ||
    row['Field Orderable Spare Part No'] ||  // Try with exact spacing
    row[Object.keys(row)[0]] ||  // Fallback to first column
    ''
  ).trim();

  // Extract description - try Part/Material Description or the unnamed column
  const description = (
    row['Part/Material Description'] ||
    row['_unnamed_2'] ||  // The unnamed column that contains product type/description
    ''
  ).trim();

  // Validate required fields
  if (!partNumber) {
    throw new Error('Missing part number');
  }

  if (!description) {
    throw new Error('Missing description');
  }

  // Generate placeholder price
  const price = generatePlaceholderPrice(partNumber);

  return {
    part_number: partNumber,
    description: description,
    price: price
  };
}

/**
 * Generate a consistent placeholder price based on part number
 * This ensures the same part number always gets the same price
 * @param {string} partNumber - Product part number
 * @returns {number} Price with 2 decimal places
 */
function generatePlaceholderPrice(partNumber) {
  // Use a simple hash of the part number to generate consistent prices
  let hash = 0;
  for (let i = 0; i < partNumber.length; i++) {
    hash = ((hash << 5) - hash) + partNumber.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Generate price between 1000 and 50000
  const minPrice = 1000;
  const maxPrice = 50000;
  const price = minPrice + (Math.abs(hash) % (maxPrice - minPrice));

  // Round to 2 decimal places
  return parseFloat(price.toFixed(2));
}

/**
 * Validate product object
 * @param {Object} product - Product object to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validateProduct(product) {
  if (!product.part_number || typeof product.part_number !== 'string') {
    throw new Error('Invalid part_number: must be a non-empty string');
  }

  if (product.part_number.length > 100) {
    throw new Error('Invalid part_number: exceeds maximum length of 100 characters');
  }

  if (!product.description || typeof product.description !== 'string') {
    throw new Error('Invalid description: must be a non-empty string');
  }

  if (typeof product.price !== 'number' || product.price <= 0) {
    throw new Error('Invalid price: must be a positive number');
  }

  // Validate price has at most 2 decimal places
  const priceStr = product.price.toString();
  const decimalIndex = priceStr.indexOf('.');
  if (decimalIndex !== -1 && priceStr.length - decimalIndex - 1 > 2) {
    throw new Error('Invalid price: must have at most 2 decimal places');
  }

  return true;
}

module.exports = {
  parseProductCSV,
  validateProduct,
  mapRowToProduct,
  isEmptyRow
};
