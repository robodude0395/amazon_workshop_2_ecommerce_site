require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/database');
const productService = require('./services/productService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// API Routes
const productsRouter = require('./routes/products');
app.use('/api/products', productsRouter);

const cartRouter = require('./routes/cart');
app.use('/api/cart', cartRouter);

// Error handler middleware (must be last)
app.use((err, req, res, next) => {
  console.error('[ERROR]', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred',
    },
  });
});

/**
 * Initialize server and import products if needed
 */
async function initializeServer() {
  try {
    // 1. Connect to database
    console.log(`[${new Date().toISOString()}] Connecting to database...`);
    await db.connect();

    // 2. Check if products table is empty
    console.log(`[${new Date().toISOString()}] Checking products table...`);
    const products = await db.query('SELECT COUNT(*) as count FROM products');
    const productCount = products[0].count;

    console.log(`[${new Date().toISOString()}] Found ${productCount} products in database`);

    // 3. If empty, trigger CSV import
    if (productCount === 0) {
      console.log(`[${new Date().toISOString()}] Products table is empty, importing from CSV...`);

      try {
        // Load products from CSV
        const productsFromCSV = await productService.loadProductsFromCSV();

        // Import products to database
        const importResult = await productService.importProducts(productsFromCSV);

        // Log import results
        console.log(`[${new Date().toISOString()}] Product import completed successfully:`);
        console.log(`  - Total: ${importResult.total}`);
        console.log(`  - Inserted: ${importResult.inserted}`);
        console.log(`  - Skipped: ${importResult.skipped}`);
        console.log(`  - Failed: ${importResult.failed}`);

        if (importResult.errors.length > 0) {
          console.error(`[${new Date().toISOString()}] Import errors:`, importResult.errors);
        }
      } catch (importError) {
        // Handle import errors gracefully - log and continue
        console.error(`[${new Date().toISOString()}] Failed to import products from CSV:`, importError.message);
        console.error(`[${new Date().toISOString()}] Server will continue with empty product catalog`);
      }
    } else {
      console.log(`[${new Date().toISOString()}] Products already loaded, skipping import`);
    }

    // 4. Start Express server
    app.listen(PORT, () => {
      console.log(`[${new Date().toISOString()}] Server running on port ${PORT}`);
    });
  } catch (error) {
    // Handle critical startup errors
    console.error(`[${new Date().toISOString()}] Failed to initialize server:`, error.message);
    console.error(`[${new Date().toISOString()}] Server startup aborted`);
    process.exit(1);
  }
}

// Initialize server
initializeServer();

module.exports = app;
