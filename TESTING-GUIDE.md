# Testing Guide

This guide will walk you through testing all the implemented features of the Smiths Detection E-Commerce Platform.

## Quick Start

```bash
# 1. Set up the database
cd database
mysql -u root -p < schema.sql

# 2. Configure backend
cd ../backend
cp .env.example .env
# Edit .env with your MySQL credentials

# 3. Install dependencies and run tests
npm install
npm test

# 4. Start the backend server
npm start
```

## Table of Contents

1. [Running Automated Tests](#running-automated-tests)
2. [Testing the Database](#testing-the-database)
3. [Testing the Backend API](#testing-the-backend-api)
4. [Manual API Testing with curl](#manual-api-testing-with-curl)
5. [Testing with Postman/Insomnia](#testing-with-postmaninsomnia)
6. [Troubleshooting](#troubleshooting)

---

## Running Automated Tests

### Backend Tests (89 tests)

```bash
cd backend
npm test
```

**Expected Output:**
```
PASS  services/__tests__/csvParser.test.js
PASS  services/__tests__/productService.test.js
PASS  services/__tests__/cartService.test.js
PASS  __tests__/products-routes.test.js
PASS  __tests__/cart-routes.test.js
PASS  __tests__/server-startup.test.js

Test Suites: 6 passed, 6 total
Tests:       89 passed, 89 total
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

This will show you code coverage for all services and routes.

### Run Specific Test Suite

```bash
# Test only product service
npm test -- productService

# Test only cart routes
npm test -- cart-routes

# Test only CSV parser
npm test -- csvParser
```

### Watch Mode (for development)

```bash
npm test -- --watch
```

---

## Testing the Database

### 1. Verify Database Setup

```bash
mysql -u root -p
```

```sql
-- Check database exists
SHOW DATABASES LIKE 'smiths_detection_ecommerce';

-- Use the database
USE smiths_detection_ecommerce;

-- Check tables
SHOW TABLES;

-- Verify products table structure
DESCRIBE products;

-- Verify cart_items table structure
DESCRIBE cart_items;

-- Check foreign key constraints
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'smiths_detection_ecommerce'
AND REFERENCED_TABLE_NAME IS NOT NULL;
```

### 2. Verify Product Import

Start the backend server and check if products are imported:

```bash
cd backend
npm start
```

**Expected console output:**
```
[2026-03-07T...] Connecting to database...
[2026-03-07T...] Database connected successfully
[2026-03-07T...] Checking products table...
[2026-03-07T...] Found 0 products in database
[2026-03-07T...] Products table is empty, importing from CSV...
[2026-03-07T...] [ProductService] Loading products from .../product_list.csv
[2026-03-07T...] [CSV Parser] Parsed 74 products from .../product_list.csv
[2026-03-07T...] [ProductService] Importing 74 products into database
[2026-03-07T...] Product import completed successfully:
  - Total: 74
  - Inserted: 74
  - Skipped: 0
  - Failed: 0
[2026-03-07T...] Server running on port 5000
```

### 3. Query Products in Database

```sql
-- Count products
SELECT COUNT(*) FROM products;
-- Expected: 74

-- View first 5 products
SELECT id, part_number, description, price
FROM products
LIMIT 5;

-- Check for duplicates (should be 0)
SELECT part_number, COUNT(*) as count
FROM products
GROUP BY part_number
HAVING count > 1;
```

---

## Testing the Backend API

### Prerequisites

1. **Database is running** (MySQL on port 3306)
2. **Backend server is running** (port 5000)
3. **Products are imported** (74 products)

### Start the Backend Server

```bash
cd backend
npm start
```

Keep this terminal open. The server should show:
```
[2026-03-07T...] Server running on port 5000
```

---

## Manual API Testing with curl

Open a new terminal and run these commands:

### 1. Health Check

```bash
curl http://localhost:5000/health
```

**Expected Response:**
```json
{"status":"ok","message":"Server is running"}
```

### 2. List All Products (GET /api/products)

```bash
curl http://localhost:5000/api/products
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "part_number": "A9044-1",
      "description": "Kit, CHECK VALVE & T PIECE KIT",
      "price": 15234.00,
      "created_at": "2026-03-07T..."
    },
    // ... 73 more products
  ]
}
```

**Verify:**
- Response has `success: true`
- Data array contains 74 products
- Each product has id, part_number, description, price, created_at

### 3. Get Single Product (GET /api/products/:id)

```bash
curl http://localhost:5000/api/products/1
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "part_number": "A9044-1",
    "description": "Kit, CHECK VALVE & T PIECE KIT",
    "price": 15234.00,
    "created_at": "2026-03-07T..."
  }
}
```

**Test Error Case (Product Not Found):**
```bash
curl http://localhost:5000/api/products/9999
```

**Expected Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product with ID 9999 not found"
  }
}
```

### 4. Get Empty Cart (GET /api/cart)

```bash
curl http://localhost:5000/api/cart
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "items": [],
    "total": 0,
    "item_count": 0
  }
}
```

### 5. Add Item to Cart (POST /api/cart)

```bash
curl -X POST http://localhost:5000/api/cart \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "quantity": 2}'
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "product_id": 1,
    "quantity": 2,
    "created_at": "2026-03-07T...",
    "updated_at": "2026-03-07T..."
  },
  "message": "Item added to cart successfully"
}
```

### 6. Add Same Item Again (Should Increment)

```bash
curl -X POST http://localhost:5000/api/cart \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "quantity": 3}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "product_id": 1,
    "quantity": 5,
    "created_at": "2026-03-07T...",
    "updated_at": "2026-03-07T..."
  },
  "message": "Item added to cart successfully"
}
```

**Verify:** Quantity is now 5 (2 + 3)

### 7. Get Cart with Items (GET /api/cart)

```bash
curl http://localhost:5000/api/cart
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "quantity": 5,
        "product": {
          "id": 1,
          "part_number": "A9044-1",
          "description": "Kit, CHECK VALVE & T PIECE KIT",
          "price": 15234.00
        },
        "line_total": 76170.00,
        "created_at": "2026-03-07T...",
        "updated_at": "2026-03-07T..."
      }
    ],
    "total": 76170.00,
    "item_count": 5
  }
}
```

**Verify:**
- Items array has 1 item
- Product details are included
- line_total = quantity × price (5 × 15234 = 76170)
- total = sum of all line_totals
- item_count = sum of all quantities

### 8. Add Different Product

```bash
curl -X POST http://localhost:5000/api/cart \
  -H "Content-Type: application/json" \
  -d '{"product_id": 2, "quantity": 1}'
```

Then check cart again:
```bash
curl http://localhost:5000/api/cart
```

**Verify:**
- Items array now has 2 items
- total is sum of both line_totals
- item_count is sum of both quantities

### 9. Test Error Cases

**Invalid Product ID:**
```bash
curl -X POST http://localhost:5000/api/cart \
  -H "Content-Type: application/json" \
  -d '{"product_id": 9999, "quantity": 1}'
```

**Expected Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product with ID 9999 not found"
  }
}
```

**Invalid Quantity (zero):**
```bash
curl -X POST http://localhost:5000/api/cart \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "quantity": 0}'
```

**Expected Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_QUANTITY",
    "message": "Quantity must be a positive integer"
  }
}
```

**Missing Fields:**
```bash
curl -X POST http://localhost:5000/api/cart \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1}'
```

**Expected Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_QUANTITY",
    "message": "Quantity must be a positive integer"
  }
}
```

---

## Testing with Postman/Insomnia

### Import Collection

Create a new collection with these requests:

#### 1. Get All Products
- **Method:** GET
- **URL:** `http://localhost:5000/api/products`
- **Headers:** None

#### 2. Get Product by ID
- **Method:** GET
- **URL:** `http://localhost:5000/api/products/1`
- **Headers:** None

#### 3. Get Cart
- **Method:** GET
- **URL:** `http://localhost:5000/api/cart`
- **Headers:** None

#### 4. Add to Cart
- **Method:** POST
- **URL:** `http://localhost:5000/api/cart`
- **Headers:** `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "product_id": 1,
  "quantity": 2
}
```

### Test Scenarios

1. **Happy Path:**
   - Get all products → Success
   - Get product 1 → Success
   - Add product 1 to cart → Success
   - Get cart → Shows product 1 with quantity 2

2. **Error Handling:**
   - Get product 9999 → 404 Not Found
   - Add product 9999 to cart → 404 Not Found
   - Add with quantity 0 → 400 Bad Request
   - Add with missing fields → 400 Bad Request

3. **Cart Accumulation:**
   - Add product 1, quantity 2 → Success
   - Add product 1, quantity 3 → Quantity becomes 5
   - Get cart → Shows quantity 5

---

## Troubleshooting

### Backend Won't Start

**Error:** `ECONNREFUSED` or database connection failed

**Solution:**
1. Check MySQL is running: `mysql -u root -p`
2. Verify database exists: `SHOW DATABASES;`
3. Check `.env` file has correct credentials
4. Verify port 3306 is not blocked

**Error:** `Port 5000 already in use`

**Solution:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=5001 npm start
```

### Tests Failing

**Error:** Database connection errors in tests

**Solution:**
Tests use mocked database, so this shouldn't happen. If it does:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm test
```

**Error:** CSV file not found

**Solution:**
```bash
# Verify CSV file exists
ls -la product_list.csv

# Check path in .env
cat backend/.env | grep CSV_FILE_PATH
```

### Products Not Importing

**Check logs when starting server:**
```bash
npm start 2>&1 | grep -i "import\|csv\|product"
```

**Manually check database:**
```sql
USE smiths_detection_ecommerce;
SELECT COUNT(*) FROM products;
```

If count is 0, check:
1. CSV file exists at root: `ls product_list.csv`
2. Server has read permissions
3. No errors in server logs

### API Returns Empty Responses

**Check server is running:**
```bash
curl http://localhost:5000/health
```

**Check database has data:**
```sql
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM cart_items;
```

**Check server logs:**
Look for error messages in the terminal where `npm start` is running.

---

## Complete Test Workflow

Here's a complete end-to-end test you can run:

```bash
#!/bin/bash

echo "=== Smiths Detection E-Commerce API Test ==="
echo ""

echo "1. Health Check"
curl -s http://localhost:5000/health | jq
echo ""

echo "2. Get All Products (showing first 2)"
curl -s http://localhost:5000/api/products | jq '.data[0:2]'
echo ""

echo "3. Get Product ID 1"
curl -s http://localhost:5000/api/products/1 | jq
echo ""

echo "4. Get Empty Cart"
curl -s http://localhost:5000/api/cart | jq
echo ""

echo "5. Add Product 1 (quantity 2) to Cart"
curl -s -X POST http://localhost:5000/api/cart \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "quantity": 2}' | jq
echo ""

echo "6. Add Product 1 (quantity 3) to Cart Again"
curl -s -X POST http://localhost:5000/api/cart \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "quantity": 3}' | jq
echo ""

echo "7. Get Cart with Items"
curl -s http://localhost:5000/api/cart | jq
echo ""

echo "8. Test Error: Invalid Product ID"
curl -s -X POST http://localhost:5000/api/cart \
  -H "Content-Type: application/json" \
  -d '{"product_id": 9999, "quantity": 1}' | jq
echo ""

echo "=== Test Complete ==="
```

Save this as `test-api.sh`, make it executable, and run:
```bash
chmod +x test-api.sh
./test-api.sh
```

**Note:** Requires `jq` for JSON formatting. Install with:
- macOS: `brew install jq`
- Linux: `apt-get install jq`

---

## Success Criteria

✅ All 89 automated tests pass
✅ Server starts without errors
✅ 74 products imported from CSV
✅ GET /api/products returns 74 products
✅ GET /api/products/:id returns single product
✅ POST /api/cart creates cart item
✅ POST /api/cart increments existing item
✅ GET /api/cart returns items with product details
✅ Error responses have correct status codes
✅ Database foreign keys work correctly

---

## Next Steps

Once you've verified everything works:

1. Review the [Implementation Status](./docs/IMPLEMENTATION-STATUS.md)
2. Check the [API Documentation](./docs/API.md) for complete endpoint specs
3. See [Architecture Diagrams](./generated-diagrams/) for system overview
4. Continue with remaining tasks in [tasks.md](./.kiro/specs/smiths-detection-ecommerce/tasks.md)

---

## Support

If you encounter issues not covered here:
1. Check server logs for detailed error messages
2. Review [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) (if exists)
3. Verify all prerequisites are installed
4. Check database connection and permissions
