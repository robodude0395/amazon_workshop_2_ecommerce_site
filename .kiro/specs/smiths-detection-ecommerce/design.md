# Design Document: Smiths Detection E-Commerce Platform

## Overview

The Smiths Detection E-Commerce platform is a web-based shopping system that enables customers to browse detection equipment products, manage a shopping cart, and prepare orders for purchase. The system replaces a manual procurement process with a modern, user-friendly online experience.

### Design Goals

- Provide an intuitive product browsing and shopping experience
- Ensure data persistence and consistency across cart operations
- Maintain clear separation between presentation, business logic, and data layers
- Enable straightforward deployment on a single server infrastructure
- Support future scalability through modular architecture

### Key Design Decisions

**Single-Page Application (SPA) Architecture**: React provides component reusability, efficient DOM updates, and excellent developer experience. The SPA approach eliminates full page reloads, creating a smoother user experience.

**RESTful API Design**: Stateless API endpoints follow HTTP semantics, making the system easier to understand, test, and extend. This separation allows frontend and backend to evolve independently.

**Relational Database**: MySQL provides ACID guarantees essential for cart operations, ensuring data integrity through foreign key constraints and transactions. The structured nature of product and cart data fits naturally into a relational model.

**CSV-Based Product Import**: Leveraging the existing product_list.csv file minimizes disruption to current workflows while providing a path to more sophisticated product management in the future.

## Architecture

### System Architecture

The system implements a classic 3-tier architecture:

```
┌─────────────────────────────────────────────────────────┐
│                     Client Browser                       │
│                    (React SPA)                          │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTP/HTTPS
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    Nginx Reverse Proxy                   │
│              (Port 80, SSL Termination)                 │
└─────────────────────────────────────────────────────────┘
                    │                    │
         Static     │                    │ API Requests
         Assets     │                    │ (/api/*)
                    ↓                    ↓
         ┌──────────────────┐  ┌──────────────────┐
         │  React Build     │  │  Node.js/Express │
         │  (Static Files)  │  │  (Port 5000)     │
         └──────────────────┘  └──────────────────┘
                                        │
                                        │ SQL Queries
                                        ↓
                               ┌──────────────────┐
                               │  MySQL Database  │
                               │  (Port 3306)     │
                               └──────────────────┘
```

### Component Interaction Flow

**Product Browsing Flow**:
1. User navigates to home page
2. React app requests product list from `/api/products`
3. Node.js backend queries MySQL products table
4. Backend returns JSON product array
5. React renders product cards with emoji icons

**Add to Cart Flow**:
1. User selects quantity and clicks "Add to Cart"
2. React sends POST request to `/api/cart` with product_id and quantity
3. Backend validates product exists
4. Backend checks if cart item already exists for product
5. If exists: increment quantity; if new: create cart item
6. Backend persists to MySQL and returns success
7. React displays confirmation message

**Cart Management Flow**:
1. User navigates to cart page
2. React requests cart contents from `/api/cart`
3. Backend queries cart_items with JOIN to products table
4. Backend calculates line totals and cart total
5. React renders cart items with update/delete controls
6. User modifications trigger PUT or DELETE requests
7. Backend updates database and returns updated cart state

### Technology Stack Rationale

**Frontend: React 18+**
- Component-based architecture promotes reusability
- Virtual DOM provides efficient rendering for dynamic cart updates
- Rich ecosystem of libraries (React Router for navigation)
- Hooks API simplifies state management
- Strong TypeScript support for type safety

**Backend: Node.js with Express**
- JavaScript full-stack reduces context switching
- Non-blocking I/O handles concurrent requests efficiently
- Express middleware ecosystem (body-parser, cors, error handling)
- Easy integration with MySQL through mysql2 library
- Simple CSV parsing with built-in or lightweight libraries

**Database: MySQL 8.0+**
- ACID compliance ensures cart operation consistency
- Foreign key constraints maintain referential integrity
- Mature, well-documented, widely supported
- Excellent performance for read-heavy workloads
- Built-in support for transactions

**Reverse Proxy: Nginx**
- High-performance static file serving
- Efficient request routing
- SSL/TLS termination
- Future-ready for load balancing and caching

## Components and Interfaces

### Frontend Components

#### Page Components

**HomePage** (`/`)
- Displays product catalog grid
- Fetches products from API on mount
- Handles loading and error states
- Navigates to ProductPage on product click

**ProductPage** (`/product/:id`)
- Displays detailed product information
- Manages quantity selection state
- Handles add-to-cart action
- Shows sample reviews (static for MVP)
- Navigates back to home or to cart

**CartPage** (`/cart`)
- Displays all cart items
- Calculates and displays totals
- Handles quantity updates
- Handles item removal
- Shows empty cart message when no items

#### Shared Components

**Navigation**
- Displays on all pages
- Links to Home and Cart pages
- Shows cart item count badge
- Responsive design for mobile/desktop

**ProductCard**
- Displays product emoji icon
- Shows product name and part number
- Clickable to navigate to product details
- Reusable across product lists

**CartItem**
- Displays product information
- Shows quantity with update control
- Displays unit price and line total
- Includes remove button
- Handles optimistic UI updates

**QuantitySelector**
- Input field for quantity entry
- Increment/decrement buttons
- Validates positive integers
- Reusable across product and cart pages

**ErrorMessage**
- Displays user-friendly error messages
- Dismissible notification
- Different styles for error types
- Auto-dismiss after timeout

**LoadingSpinner**
- Indicates async operations in progress
- Consistent loading experience
- Prevents duplicate submissions

#### State Management

**Product State**
- Fetched from API and cached in component state
- No global state needed (products are read-only)
- Refetch on navigation or manual refresh

**Cart State**
- Fetched from API on cart page load
- Local state for optimistic updates
- Refetch after mutations to ensure consistency
- Cart count stored in navigation component

**UI State**
- Loading indicators for async operations
- Error messages for failed operations
- Form validation states

### Backend Components

#### API Routes

**Product Routes** (`/api/products`)

```javascript
GET /api/products
- Handler: ProductController.getAllProducts()
- Returns: Array of product objects
- Status: 200 OK, 503 Service Unavailable

GET /api/products/:id
- Handler: ProductController.getProductById(id)
- Returns: Single product object
- Status: 200 OK, 404 Not Found, 503 Service Unavailable
```

**Cart Routes** (`/api/cart`)

```javascript
GET /api/cart
- Handler: CartController.getCart()
- Returns: Cart object with items array and totals
- Status: 200 OK, 503 Service Unavailable

POST /api/cart
- Handler: CartController.addItem(product_id, quantity)
- Body: { product_id: number, quantity: number }
- Returns: Created/updated cart item
- Status: 201 Created, 400 Bad Request, 404 Not Found

PUT /api/cart/:id
- Handler: CartController.updateItem(id, quantity)
- Body: { quantity: number }
- Returns: Updated cart item or 204 if removed
- Status: 200 OK, 204 No Content, 400 Bad Request, 404 Not Found

DELETE /api/cart/:id
- Handler: CartController.removeItem(id)
- Returns: No content
- Status: 204 No Content, 404 Not Found
```

#### Service Layer

**ProductService**
- `loadProductsFromCSV()`: Reads and parses product_list.csv
- `importProducts(products)`: Bulk inserts products into database
- `getAllProducts()`: Retrieves all products from database
- `getProductById(id)`: Retrieves single product by ID
- `productExists(id)`: Validates product existence

**CartService**
- `getCart()`: Retrieves all cart items with product details
- `addItem(productId, quantity)`: Creates or updates cart item
- `updateItemQuantity(itemId, quantity)`: Updates existing cart item
- `removeItem(itemId)`: Deletes cart item
- `calculateCartTotal(items)`: Computes total cost
- `getCartItemCount()`: Returns total quantity across all items

**DatabaseService**
- `connect()`: Establishes MySQL connection pool
- `query(sql, params)`: Executes parameterized queries
- `transaction(callback)`: Wraps operations in transaction
- `disconnect()`: Closes connection pool gracefully

#### Middleware

**Error Handler**
- Catches unhandled errors
- Logs error details
- Returns standardized error response
- Prevents sensitive information leakage

**Request Logger**
- Logs incoming requests (method, path, timestamp)
- Logs response status and duration
- Useful for debugging and monitoring

**CORS Handler**
- Allows cross-origin requests during development
- Configurable allowed origins
- Handles preflight requests

**Body Parser**
- Parses JSON request bodies
- Validates content-type headers
- Limits request body size

#### Initialization Sequence

```
1. Load environment variables (.env file)
2. Initialize database connection pool
3. Check if products table is empty
4. If empty:
   a. Read product_list.csv
   b. Parse CSV rows
   c. Validate product data
   d. Insert products into database
   e. Log import results
5. Register middleware (CORS, body parser, logger)
6. Register API routes
7. Register error handler
8. Start Express server on configured port
9. Log server ready message
```

### Database Schema

#### Products Table

```sql
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    part_number VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_part_number (part_number)
);
```

**Design Rationale**:
- `id`: Auto-incrementing primary key for efficient joins
- `part_number`: Unique constraint ensures no duplicate products
- `description`: TEXT type accommodates long product descriptions
- `price`: DECIMAL(10,2) ensures precise currency calculations
- `created_at`: Audit trail for product additions
- Index on `part_number` for potential future search features

#### Cart Items Table

```sql
CREATE TABLE cart_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id)
);
```

**Design Rationale**:
- `id`: Primary key for cart item identification
- `product_id`: Foreign key ensures referential integrity
- `quantity`: CHECK constraint enforces positive values
- `created_at`: Tracks when item was added to cart
- `updated_at`: Automatically updates on quantity changes
- `ON DELETE CASCADE`: Removes cart items if product is deleted
- Index on `product_id` optimizes JOIN operations

#### Relationship Model

```
products (1) ──────< (N) cart_items

One product can appear in multiple cart items
Each cart item references exactly one product
```

**Future Considerations**:
- Add `users` table for multi-user support
- Add `orders` and `order_items` tables for checkout
- Add `product_categories` for product organization
- Add `product_images` for multiple images per product

### API Interface Contracts

#### Request/Response Formats

**Standard Success Response**:
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

**Standard Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

#### Product API

**GET /api/products**

Response (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "part_number": "SD-1000",
      "description": "Advanced X-Ray Scanner",
      "price": 45000.00,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**GET /api/products/:id**

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "part_number": "SD-1000",
    "description": "Advanced X-Ray Scanner",
    "price": 45000.00,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

Response (404 Not Found):
```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product with ID 1 not found"
  }
}
```

#### Cart API

**GET /api/cart**

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "quantity": 2,
        "product": {
          "id": 1,
          "part_number": "SD-1000",
          "description": "Advanced X-Ray Scanner",
          "price": 45000.00
        },
        "line_total": 90000.00,
        "created_at": "2024-01-20T14:30:00Z",
        "updated_at": "2024-01-20T15:45:00Z"
      }
    ],
    "total": 90000.00,
    "item_count": 2
  }
}
```

**POST /api/cart**

Request:
```json
{
  "product_id": 1,
  "quantity": 2
}
```

Response (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "product_id": 1,
    "quantity": 2,
    "created_at": "2024-01-20T14:30:00Z",
    "updated_at": "2024-01-20T14:30:00Z"
  },
  "message": "Item added to cart successfully"
}
```

**PUT /api/cart/:id**

Request:
```json
{
  "quantity": 5
}
```

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "product_id": 1,
    "quantity": 5,
    "updated_at": "2024-01-20T16:00:00Z"
  },
  "message": "Cart item updated successfully"
}
```

Response (204 No Content) when quantity = 0:
- No response body

**DELETE /api/cart/:id**

Response (204 No Content):
- No response body

### Frontend-Backend Integration

**API Client Module**:
```javascript
// api/client.js
const API_BASE_URL = '/api';

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  return data.data;
}

export const productsAPI = {
  getAll: () => apiRequest('/products'),
  getById: (id) => apiRequest(`/products/${id}`),
};

export const cartAPI = {
  get: () => apiRequest('/cart'),
  add: (productId, quantity) =>
    apiRequest('/cart', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity }),
    }),
  update: (itemId, quantity) =>
    apiRequest(`/cart/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),
  remove: (itemId) =>
    apiRequest(`/cart/${itemId}`, { method: 'DELETE' }),
};
```

## Data Models

### Product Model

```typescript
interface Product {
  id: number;
  part_number: string;
  description: string;
  price: number;
  created_at: string; // ISO 8601 timestamp
}
```

**Validation Rules**:
- `part_number`: Required, unique, max 100 characters
- `description`: Required, non-empty
- `price`: Required, positive number with 2 decimal places
- `id` and `created_at`: Auto-generated

### Cart Item Model

```typescript
interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}
```

**Validation Rules**:
- `product_id`: Required, must reference existing product
- `quantity`: Required, positive integer
- `id`, `created_at`, `updated_at`: Auto-generated

### Cart Response Model

```typescript
interface CartResponse {
  items: Array<{
    id: number;
    product_id: number;
    quantity: number;
    product: Product;
    line_total: number;
    created_at: string;
    updated_at: string;
  }>;
  total: number;
  item_count: number;
}
```

**Computed Fields**:
- `line_total`: quantity × product.price
- `total`: Sum of all line_totals
- `item_count`: Sum of all quantities

### CSV Product Data Format

```csv
part_number,description,price
SD-1000,Advanced X-Ray Scanner for Airport Security,45000.00
SD-2000,Portable Explosive Trace Detector,12500.00
```

**Parsing Rules**:
- First row contains headers (skipped during import)
- Fields separated by commas
- Prices parsed as decimal numbers
- Empty rows ignored
- Malformed rows logged and skipped


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Product Display Completeness

*For any* product in the catalog, when displayed on the home page, the product card SHALL include an emoji icon, product name, and part number.

**Validates: Requirements 1.3, 1.4, 1.5**

### Property 2: Product Navigation

*For any* product displayed on the home page, clicking on the product SHALL navigate to the product detail page with the correct product identifier.

**Validates: Requirements 1.6**

### Property 3: CSV Parsing Round-Trip

*For any* valid product record, converting it to CSV format and then parsing it back SHALL produce an equivalent product record with the same part number, description, and price.

**Validates: Requirements 2.2, 12.3**

### Property 4: Product Storage Completeness

*For any* product inserted into the database, retrieving it SHALL return all required fields: product identifier, part number, description, and price.

**Validates: Requirements 2.3**

### Property 5: Product Detail Display Completeness

*For any* product, the product detail page SHALL display the description, price, quantity selector, add-to-cart button, and sample reviews.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 6: Quantity Selector Reactivity

*For any* quantity value entered in the quantity selector, the displayed quantity value SHALL update to match the entered value.

**Validates: Requirements 3.6**

### Property 7: Add-to-Cart Request Formation

*For any* product and positive quantity, clicking the add-to-cart button SHALL send a POST request to `/api/cart` with the correct product_id and quantity in the request body.

**Validates: Requirements 4.1**

### Property 8: Cart Item Creation or Update

*For any* valid add-to-cart request, the backend SHALL either create a new cart item if the product is not in the cart, or increment the existing cart item's quantity if the product is already in the cart.

**Validates: Requirements 4.2, 4.3**

### Property 9: Add-to-Cart Success Feedback

*For any* successful add-to-cart operation, the backend SHALL return a success response AND the frontend SHALL display a confirmation message to the user.

**Validates: Requirements 4.4, 4.5**

### Property 10: Cart Persistence Round-Trip

*For any* cart operation (create, update, or delete), the changes SHALL persist to the database such that retrieving the cart immediately after the operation reflects the changes.

**Validates: Requirements 5.2, 7.3, 8.3**

### Property 11: Cart Item Storage Completeness

*For any* cart item stored in the database, retrieving it SHALL return all required fields: item identifier, product identifier, quantity, and timestamps.

**Validates: Requirements 5.1**

### Property 12: Cart Retrieval Completeness

*For any* cart state, navigating to the cart page SHALL retrieve and display all cart items from the database.

**Validates: Requirements 5.3, 6.1**

### Property 13: Cart Item Display Completeness

*For any* cart item displayed on the cart page, the display SHALL include the product name, quantity, unit price, and line total (quantity × unit price).

**Validates: Requirements 6.2, 6.3, 6.4, 6.5**

### Property 14: Cart Total Calculation

*For any* cart state with one or more items, the displayed total cost SHALL equal the sum of all line totals (Σ(quantity × unit price) for all items).

**Validates: Requirements 6.6**

### Property 15: Cart Display Reactivity

*For any* cart modification (add, update quantity, or remove item), the cart display SHALL update to reflect the new state, including updated line totals, cart total, and item count.

**Validates: Requirements 6.7, 7.5, 8.4, 8.5**

### Property 16: Cart Item Update Controls

*For any* cart item displayed on the cart page, the display SHALL include a quantity update control and a delete button.

**Validates: Requirements 7.1, 8.1**

### Property 17: Quantity Update Request Formation

*For any* cart item and new quantity value, changing the quantity SHALL send a PUT request to `/api/cart/:id` with the correct item identifier and new quantity.

**Validates: Requirements 7.2**

### Property 18: Delete Request Formation

*For any* cart item, clicking the delete button SHALL send a DELETE request to `/api/cart/:id` with the correct item identifier.

**Validates: Requirements 8.2**

### Property 19: API Error Response Format

*For any* failed API request, the backend SHALL return an appropriate HTTP error status code (400, 404, 500, 503) AND an error response body containing an error code and human-readable message.

**Validates: Requirements 9.7, 9.8**

### Property 20: Product Import Persistence

*For any* set of valid product records parsed from the CSV file, all records SHALL be inserted into the database and retrievable via the products API.

**Validates: Requirements 12.4**

### Property 21: Navigation Menu Presence

*For any* page in the application (home, product detail, cart), a navigation menu SHALL be displayed containing links to the home page and cart page.

**Validates: Requirements 13.1, 13.2, 13.3**

### Property 22: Navigation Link Functionality

*For any* navigation link clicked, the application SHALL navigate to the corresponding page (home or cart).

**Validates: Requirements 13.4**

### Property 23: Cart Count Display

*For any* cart state, the navigation menu SHALL display the current total quantity of items in the cart (sum of all item quantities).

**Validates: Requirements 13.5**

### Property 24: Frontend Error Display

*For any* failed backend API call, the frontend SHALL display an error message to the user.

**Validates: Requirements 14.1**

### Property 25: Non-Existent Product Error

*For any* request for a product that does not exist in the database, the backend SHALL return a 404 Not Found status code.

**Validates: Requirements 14.5**

## Error Handling

### Error Categories

**Client Errors (4xx)**:
- **400 Bad Request**: Invalid request body, missing required fields, invalid data types
- **404 Not Found**: Requested product or cart item does not exist

**Server Errors (5xx)**:
- **500 Internal Server Error**: Unexpected server errors, unhandled exceptions
- **503 Service Unavailable**: Database connection failures, service dependencies unavailable

### Error Response Structure

All error responses follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Error Codes

**Product Errors**:
- `PRODUCT_NOT_FOUND`: Requested product does not exist
- `PRODUCT_LOAD_FAILED`: Failed to load products from database

**Cart Errors**:
- `CART_ITEM_NOT_FOUND`: Requested cart item does not exist
- `INVALID_QUANTITY`: Quantity must be a positive integer
- `INVALID_PRODUCT_ID`: Product ID is required and must be valid
- `CART_LOAD_FAILED`: Failed to load cart from database
- `CART_UPDATE_FAILED`: Failed to update cart item

**Database Errors**:
- `DATABASE_CONNECTION_FAILED`: Cannot connect to database
- `DATABASE_QUERY_FAILED`: Database query execution failed

**CSV Import Errors**:
- `CSV_FILE_NOT_FOUND`: Product CSV file not found
- `CSV_PARSE_ERROR`: Failed to parse CSV file

### Frontend Error Handling

**API Call Wrapper**:
```javascript
async function handleAPICall(apiFunction, errorMessage) {
  try {
    return await apiFunction();
  } catch (error) {
    // Display user-friendly error message
    showErrorNotification(errorMessage || error.message);
    // Log detailed error for debugging
    console.error('API Error:', error);
    throw error;
  }
}
```

**Error Display Strategy**:
- **Toast Notifications**: Temporary messages for transient errors (auto-dismiss after 5 seconds)
- **Inline Errors**: Persistent messages for form validation errors
- **Error Pages**: Full-page errors for critical failures (e.g., cart load failure)

**User-Friendly Error Messages**:
- `PRODUCT_NOT_FOUND`: "Sorry, this product is no longer available."
- `CART_UPDATE_FAILED`: "Unable to update cart. Please try again."
- `DATABASE_CONNECTION_FAILED`: "Service temporarily unavailable. Please try again later."
- `INVALID_QUANTITY`: "Please enter a valid quantity (positive number)."

### Backend Error Handling

**Global Error Handler Middleware**:
```javascript
function errorHandler(err, req, res, next) {
  // Log error details
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred',
    },
  });
}
```

**Database Error Handling**:
```javascript
async function queryWithErrorHandling(sql, params) {
  try {
    return await db.query(sql, params);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new DatabaseError('DATABASE_CONNECTION_FAILED', 503);
    }
    if (error.code === 'ER_DUP_ENTRY') {
      throw new DatabaseError('DUPLICATE_ENTRY', 400);
    }
    throw new DatabaseError('DATABASE_QUERY_FAILED', 500);
  }
}
```

**CSV Import Error Handling**:
```javascript
async function importProductsFromCSV() {
  try {
    const fileContent = await fs.readFile(CSV_FILE_PATH, 'utf-8');
    const products = parseCSV(fileContent);
    await insertProducts(products);
    console.log(`Imported ${products.length} products successfully`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('CSV file not found, starting with empty catalog');
      return; // Continue startup
    }
    console.error('CSV import failed:', error.message);
    // Continue startup with empty catalog
  }
}
```

### Validation

**Request Validation**:
- Validate all request bodies against expected schema
- Reject requests with missing required fields
- Validate data types (e.g., quantity must be integer)
- Validate ranges (e.g., quantity must be positive)

**Database Validation**:
- Foreign key constraints prevent invalid product references
- CHECK constraints enforce positive quantities
- UNIQUE constraints prevent duplicate part numbers
- NOT NULL constraints ensure required fields

**Business Logic Validation**:
- Verify product exists before adding to cart
- Verify cart item exists before updating or deleting
- Validate quantity is positive integer
- Validate price is positive decimal

### Retry Logic

**Database Connection Retry**:
```javascript
async function connectWithRetry(maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await db.connect();
      console.log('Database connected successfully');
      return;
    } catch (error) {
      console.error(`Connection attempt ${i + 1} failed:`, error.message);
      if (i < maxRetries - 1) {
        await sleep(delay * Math.pow(2, i)); // Exponential backoff
      }
    }
  }
  throw new Error('Failed to connect to database after multiple attempts');
}
```

**Frontend API Retry** (for 503 errors):
```javascript
async function fetchWithRetry(url, options, maxRetries = 2) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status !== 503 || i === maxRetries) {
        return response;
      }
      await sleep(1000 * Math.pow(2, i));
    } catch (error) {
      if (i === maxRetries) throw error;
    }
  }
}
```

### Logging Strategy

**Log Levels**:
- **ERROR**: Critical errors requiring immediate attention
- **WARN**: Warning conditions that should be reviewed
- **INFO**: Informational messages about normal operations
- **DEBUG**: Detailed debugging information

**What to Log**:
- All API requests (method, path, status, duration)
- All errors with stack traces
- Database connection events
- CSV import results
- Cart operations (add, update, delete)

**Log Format**:
```
[TIMESTAMP] [LEVEL] [COMPONENT] Message
[2024-01-20T14:30:00Z] [ERROR] [CartService] Failed to update cart item 123: Database connection lost
```

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit testing and property-based testing to ensure comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, and error conditions
- **Property Tests**: Verify universal properties across all inputs through randomized testing

Both approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing

**Library Selection**:
- **Frontend (JavaScript/React)**: `fast-check` library for property-based testing
- **Backend (Node.js)**: `fast-check` library for property-based testing

**Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `Feature: smiths-detection-ecommerce, Property {number}: {property_text}`

**Example Property Test Structure**:
```javascript
// Backend: Property 8 - Cart Item Creation or Update
describe('Feature: smiths-detection-ecommerce, Property 8: Cart item creation or update', () => {
  it('should create new cart item or increment existing quantity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }), // product_id
        fc.integer({ min: 1, max: 100 }),  // quantity
        async (productId, quantity) => {
          // Setup: ensure product exists
          await createTestProduct(productId);

          // Get initial cart state
          const initialCart = await cartService.getCart();
          const existingItem = initialCart.items.find(
            item => item.product_id === productId
          );

          // Execute: add to cart
          await cartService.addItem(productId, quantity);

          // Verify: check cart state
          const updatedCart = await cartService.getCart();
          const updatedItem = updatedCart.items.find(
            item => item.product_id === productId
          );

          if (existingItem) {
            // Should increment quantity
            expect(updatedItem.quantity).toBe(
              existingItem.quantity + quantity
            );
          } else {
            // Should create new item
            expect(updatedItem).toBeDefined();
            expect(updatedItem.quantity).toBe(quantity);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Property Test Coverage**:
- All 25 correctness properties will have corresponding property-based tests
- Tests will generate random valid inputs to verify properties hold universally
- Edge cases (empty carts, zero quantities, large numbers) will be included in generators

### Unit Testing

**Unit Test Focus**:
- Specific examples demonstrating correct behavior
- Edge cases (empty cart, single item, maximum quantities)
- Error conditions (invalid inputs, database failures, missing products)
- Integration points between components
- API endpoint existence and response formats

**Frontend Unit Tests** (React Testing Library + Jest):
```javascript
// Example: Product card display
describe('ProductCard', () => {
  it('should display product name, part number, and emoji', () => {
    const product = {
      id: 1,
      part_number: 'SD-1000',
      description: 'X-Ray Scanner',
      price: 45000.00,
    };

    render(<ProductCard product={product} />);

    expect(screen.getByText('SD-1000')).toBeInTheDocument();
    expect(screen.getByText(/X-Ray Scanner/)).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument(); // emoji
  });

  it('should navigate to product page on click', () => {
    const product = { id: 1, part_number: 'SD-1000' };
    const navigate = jest.fn();

    render(<ProductCard product={product} navigate={navigate} />);
    fireEvent.click(screen.getByRole('button'));

    expect(navigate).toHaveBeenCalledWith('/product/1');
  });
});
```

**Backend Unit Tests** (Jest):
```javascript
// Example: Cart service
describe('CartService', () => {
  it('should add new item to empty cart', async () => {
    const result = await cartService.addItem(1, 2);

    expect(result).toMatchObject({
      product_id: 1,
      quantity: 2,
    });
  });

  it('should return 404 for non-existent product', async () => {
    await expect(
      cartService.addItem(9999, 1)
    ).rejects.toThrow('PRODUCT_NOT_FOUND');
  });

  it('should remove item when quantity set to zero', async () => {
    const item = await cartService.addItem(1, 5);
    await cartService.updateItemQuantity(item.id, 0);

    const cart = await cartService.getCart();
    expect(cart.items).toHaveLength(0);
  });
});
```

**Database Tests**:
```javascript
// Example: Foreign key constraint
describe('Database Schema', () => {
  it('should enforce foreign key constraint on cart_items', async () => {
    await expect(
      db.query(
        'INSERT INTO cart_items (product_id, quantity) VALUES (?, ?)',
        [9999, 1]
      )
    ).rejects.toThrow(/foreign key constraint/i);
  });

  it('should auto-increment cart_items id', async () => {
    const result1 = await db.query(
      'INSERT INTO cart_items (product_id, quantity) VALUES (?, ?)',
      [1, 1]
    );
    const result2 = await db.query(
      'INSERT INTO cart_items (product_id, quantity) VALUES (?, ?)',
      [1, 1]
    );

    expect(result2.insertId).toBe(result1.insertId + 1);
  });
});
```

**Integration Tests**:
```javascript
// Example: End-to-end cart flow
describe('Cart Integration', () => {
  it('should complete full cart workflow', async () => {
    // Add item
    const addResponse = await request(app)
      .post('/api/cart')
      .send({ product_id: 1, quantity: 2 })
      .expect(201);

    const itemId = addResponse.body.data.id;

    // Get cart
    const cartResponse = await request(app)
      .get('/api/cart')
      .expect(200);

    expect(cartResponse.body.data.items).toHaveLength(1);
    expect(cartResponse.body.data.total).toBeGreaterThan(0);

    // Update quantity
    await request(app)
      .put(`/api/cart/${itemId}`)
      .send({ quantity: 5 })
      .expect(200);

    // Delete item
    await request(app)
      .delete(`/api/cart/${itemId}`)
      .expect(204);

    // Verify empty cart
    const emptyCart = await request(app)
      .get('/api/cart')
      .expect(200);

    expect(emptyCart.body.data.items).toHaveLength(0);
  });
});
```

### Test Data Management

**Test Database**:
- Separate test database instance
- Reset database before each test suite
- Seed with known test data
- Clean up after tests

**Test Fixtures**:
```javascript
const testProducts = [
  {
    id: 1,
    part_number: 'TEST-001',
    description: 'Test Product 1',
    price: 100.00,
  },
  {
    id: 2,
    part_number: 'TEST-002',
    description: 'Test Product 2',
    price: 200.00,
  },
];

async function seedTestData() {
  await db.query('DELETE FROM cart_items');
  await db.query('DELETE FROM products');

  for (const product of testProducts) {
    await db.query(
      'INSERT INTO products (id, part_number, description, price) VALUES (?, ?, ?, ?)',
      [product.id, product.part_number, product.description, product.price]
    );
  }
}
```

### Test Coverage Goals

- **Line Coverage**: Minimum 80%
- **Branch Coverage**: Minimum 75%
- **Function Coverage**: Minimum 85%
- **Critical Paths**: 100% (cart operations, product display, error handling)

### Continuous Integration

**CI Pipeline**:
1. Run linter (ESLint)
2. Run unit tests
3. Run property-based tests
4. Run integration tests
5. Generate coverage report
6. Fail build if coverage below threshold

**Pre-commit Hooks**:
- Run linter
- Run unit tests for changed files
- Verify no console.log statements in production code

### Manual Testing Checklist

- [ ] Browse products on home page
- [ ] Click product to view details
- [ ] Add product to cart with various quantities
- [ ] View cart with multiple items
- [ ] Update cart item quantities
- [ ] Remove items from cart
- [ ] Verify cart total calculations
- [ ] Test navigation between pages
- [ ] Test error scenarios (invalid product, network failure)
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile devices
- [ ] Test with empty cart
- [ ] Test with large quantities
- [ ] Verify CSV import on fresh database

