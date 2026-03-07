# Architecture Documentation

## System Overview

The Smiths Detection E-Commerce solution implements a classic 3-tier web application architecture designed for single-server deployment with remote access capabilities.

## Architectural Principles

### Separation of Concerns
- **Presentation Layer**: Handles UI rendering and user interactions
- **Application Layer**: Manages business logic and API operations
- **Data Layer**: Provides persistent storage and data integrity

### Stateless API Design
- RESTful API endpoints follow HTTP semantics
- No server-side session management
- Cart state persisted in database

### Single Server Deployment
- All components run on one EC2 instance or server
- Simplified deployment and maintenance
- Suitable for initial rollout and testing

## Component Architecture

### Frontend (React)

#### Pages
1. **Home Page** (`/`)
   - Displays product catalog
   - Products loaded from backend API
   - Emoji icons for visual representation
   - Click-through to product details

2. **Product Page** (`/product/:id`)
   - Detailed product information
   - Price display
   - Quantity selector
   - Add to cart functionality
   - Sample user reviews

3. **Cart Page** (`/cart`)
   - List of cart items
   - Quantity update controls
   - Item removal buttons
   - Total cost calculation
   - Line item totals (quantity × price)

#### Component Structure
```
App
├── Navigation (cart count, page links)
├── HomePage
│   └── ProductList
│       └── ProductCard (multiple)
│           ├── Emoji Icon
│           ├── Product Name
│           └── Part Number
├── ProductPage
│   ├── ProductInfo
│   ├── QuantitySelector
│   │   ├── Input Field
│   │   ├── Increment Button
│   │   └── Decrement Button
│   ├── AddToCartButton
│   └── ReviewsList (sample reviews)
└── CartPage
    ├── CartItemList
    │   └── CartItem (multiple)
    │       ├── Product Info
    │       ├── QuantityControl
    │       ├── Line Total Display
    │       └── RemoveButton
    └── CartSummary
        ├── Item Count
        └── Total Cost

Shared Components:
├── Navigation
├── ProductCard
├── CartItem
├── QuantitySelector
├── ErrorMessage (Toast/Inline/Page)
└── LoadingSpinner
```

#### State Management Strategy
- **Product State**: Fetched from API, cached in component state
- **Cart State**: Fetched on cart page load, refetched after mutations
- **UI State**: Loading indicators, error messages, form validation
- **Navigation State**: Cart count stored in Navigation component

### Backend (Node.js + Express)

#### API Routes

**Product Routes**
```
GET /api/products
- Returns: Array of all products
- Response: 200 OK with product list

GET /api/products/:id
- Returns: Single product details
- Response: 200 OK with product data
- Response: 404 Not Found if product doesn't exist
```

**Cart Routes**
```
GET /api/cart
- Returns: All cart items with product details
- Response: 200 OK with cart items array

POST /api/cart
- Body: { productId, quantity }
- Action: Add item or increment quantity
- Response: 201 Created with cart item

PUT /api/cart/:id
- Body: { quantity }
- Action: Update cart item quantity
- Response: 200 OK with updated item
- Special: quantity=0 removes item

DELETE /api/cart/:id
- Action: Remove cart item
- Response: 204 No Content
```

#### Business Logic

**Product Service**
- `loadProductsFromCSV()`: Reads and parses product_list.csv file
- `importProducts(products)`: Bulk inserts products into database
- `getAllProducts()`: Retrieves all products from database
- `getProductById(id)`: Retrieves single product by ID
- `productExists(id)`: Validates product existence for cart operations

**Cart Service**
- `getCart()`: Retrieves all cart items with JOIN to products table
- `addItem(productId, quantity)`: Creates new cart item or increments existing
- `updateItemQuantity(itemId, quantity)`: Updates cart item (removes if quantity=0)
- `removeItem(itemId)`: Deletes cart item from database
- `calculateCartTotal(items)`: Computes total cost (sum of quantity × price)
- `getCartItemCount()`: Returns total quantity across all items

**Database Service**
- `connect()`: Establishes MySQL connection pool with retry logic
- `query(sql, params)`: Executes parameterized queries (prevents SQL injection)
- `transaction(callback)`: Wraps operations in database transaction
- `disconnect()`: Closes connection pool gracefully on shutdown

#### Data Import Process
```
Backend Initialization Sequence:
1. Load environment variables from .env file
2. Initialize database connection pool
3. Check if products table is empty
4. If empty:
   a. Read product_list.csv file
   b. Parse CSV rows (skip header row)
   c. Validate product data (part_number, description, price)
   d. Bulk insert products into database
   e. Log import results (success count, errors)
5. If CSV file not found:
   a. Log warning message
   b. Continue startup with empty catalog
6. Register middleware (CORS, body parser, logger)
7. Register API routes (products, cart)
8. Register global error handler
9. Start Express server on configured port
10. Log "Server ready" message with port number
```

### Database (MySQL)

#### Schema Design

**products table**
```sql
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    part_number VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**cart_items table**
```sql
CREATE TABLE cart_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

#### Data Relationships
- One-to-Many: products → cart_items
- Foreign key constraint ensures referential integrity
- Cascade delete removes cart items when product is deleted

### Reverse Proxy (Nginx)

#### Configuration Strategy

**Route Mapping**
```nginx
# Frontend - serve static React build
location / {
    proxy_pass http://localhost:3000;
}

# Backend API - proxy to Node.js
location /api/ {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

**Benefits**
- Single entry point for all traffic
- SSL/TLS termination point
- Load balancing capability (future)
- Static file caching
- Security layer

## Data Flow Patterns

### Product Browsing Flow
```
Customer → Nginx → React App → GET /api/products → Node.js → MySQL
                                                              ↓
Customer ← Nginx ← React App ← JSON Response ← Node.js ← Products
```

### Add to Cart Flow
```
Customer → Product Page → Add to Cart Button
    ↓
POST /api/cart { productId, quantity }
    ↓
Node.js Cart Service
    ↓
Check if item exists in cart
    ├─ Yes: UPDATE cart_items SET quantity = quantity + new_quantity
    └─ No: INSERT INTO cart_items (product_id, quantity)
    ↓
Return success response
    ↓
Update UI with confirmation
```

### Cart Update Flow
```
Customer → Cart Page → Update Quantity
    ↓
PUT /api/cart/:id { quantity }
    ↓
Node.js Cart Service
    ↓
Validate quantity > 0
    ├─ Yes: UPDATE cart_items SET quantity = new_quantity
    └─ No: DELETE FROM cart_items WHERE id = :id
    ↓
Return updated cart
    ↓
Refresh cart display and total
```

## Visual Architecture Diagrams

For detailed visual representations of the architecture, see the [diagrams folder](../diagrams/):

- **Complete System Architecture** - Full 3-tier architecture overview
- **Backend Service Architecture** - Service layer details and dependencies
- **Data Flow - Product Browsing** - Step-by-step product browsing flow
- **Data Flow - Add to Cart** - Step-by-step cart addition flow
- **API Endpoints Status** - Implementation status of all endpoints
- **Testing Architecture** - Test infrastructure and organization

## Deployment Architecture

### Single Server Layout
```
┌─────────────────────────────────────┐
│     EC2 Instance / Server           │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Nginx (:80)                 │  │
│  │  - Reverse Proxy             │  │
│  │  - SSL Termination (future)  │  │
│  └──────────────────────────────┘  │
│           │              │          │
│           ↓              ↓          │
│  ┌─────────────┐  ┌─────────────┐  │
│  │ React App   │  │ Node.js API │  │
│  │ (:3000)     │  │ (:5000)     │  │
│  └─────────────┘  └─────────────┘  │
│                         │           │
│                         ↓           │
│                  ┌─────────────┐   │
│                  │ MySQL       │   │
│                  │ (:3306)     │   │
│                  └─────────────┘   │
└─────────────────────────────────────┘
```

### Port Allocation
- **80**: Nginx (external access)
- **3000**: React development server (internal)
- **5000**: Node.js API server (internal)
- **3306**: MySQL database (internal)

### Network Security
- Only port 80 exposed externally
- Internal services communicate via localhost
- Database not accessible from outside
- API only accessible through reverse proxy

## Scalability Considerations

### Current Architecture
- Single server deployment
- Suitable for initial rollout
- Simple maintenance and debugging

### Future Enhancements
- **Horizontal Scaling**: Add multiple backend servers behind load balancer
- **Database Replication**: Master-slave MySQL setup
- **Caching Layer**: Redis for session and cart data
- **CDN**: Static asset delivery
- **Containerization**: Docker for easier deployment

## Error Handling Strategy

### Frontend
- Display user-friendly error messages
- Retry failed API calls
- Graceful degradation
- Loading states for async operations

### Backend
- Structured error responses
- HTTP status codes (400, 404, 500, 503)
- Error logging
- Database connection retry logic

### Database
- Transaction support for cart operations
- Foreign key constraints for data integrity
- Backup and recovery procedures

## Security Considerations

### Current Implementation
- Input validation on backend
- SQL injection prevention (parameterized queries)
- CORS configuration
- Error message sanitization

### Future Enhancements
- HTTPS/SSL encryption
- Authentication and authorization
- Rate limiting
- CSRF protection
- XSS prevention
- Security headers

## Performance Optimization

### Frontend
- Code splitting
- Lazy loading
- Image optimization (emoji icons)
- Minification and bundling

### Backend
- Database connection pooling
- Query optimization
- Response caching
- Compression (gzip)

### Database
- Indexes on frequently queried columns
- Query optimization
- Connection pooling
- Regular maintenance

## Monitoring and Observability

### Recommended Metrics
- API response times
- Error rates
- Database query performance
- Server resource utilization
- Cart conversion rates

### Logging Strategy
- Application logs (Node.js)
- Access logs (Nginx)
- Error logs (all layers)
- Database query logs

## Technology Choices Rationale

### React
- Component-based architecture
- Large ecosystem
- Strong community support
- Excellent developer experience

### Node.js + Express
- JavaScript full-stack
- Non-blocking I/O
- Rich middleware ecosystem
- Easy API development

### MySQL
- ACID compliance
- Mature and stable
- Strong data integrity
- Wide hosting support

### Nginx
- High performance
- Low resource usage
- Proven reverse proxy
- Extensive documentation


## Service Layer Architecture

### ProductService

The ProductService handles all product-related operations:

**Methods**:
- `loadProductsFromCSV()`: Reads product_list.csv and returns parsed product array
- `importProducts(products)`: Bulk inserts products into database (used during startup)
- `getAllProducts()`: Returns all products from database
- `getProductById(id)`: Returns single product or throws PRODUCT_NOT_FOUND error
- `productExists(id)`: Boolean check for product existence (used by CartService)

**Responsibilities**:
- CSV file parsing and validation
- Product data persistence
- Product retrieval and lookup
- Input validation (part_number uniqueness, price format)

### CartService

The CartService manages shopping cart operations:

**Methods**:
- `getCart()`: Returns cart with items array, total, and item_count
- `addItem(productId, quantity)`: Creates or updates cart item
- `updateItemQuantity(itemId, quantity)`: Updates quantity (removes if 0)
- `removeItem(itemId)`: Deletes cart item
- `calculateCartTotal(items)`: Computes sum of (quantity × price)
- `getCartItemCount()`: Returns total quantity across all items

**Responsibilities**:
- Cart item CRUD operations
- Quantity validation (must be positive integer)
- Product existence validation (via ProductService)
- Cart total calculations
- Database transaction management

### DatabaseService

The DatabaseService provides database abstraction:

**Methods**:
- `connect()`: Establishes connection pool with retry logic
- `query(sql, params)`: Executes parameterized queries
- `transaction(callback)`: Wraps operations in transaction
- `disconnect()`: Closes connection pool gracefully

**Responsibilities**:
- Connection pool management
- Query execution with parameter binding (SQL injection prevention)
- Transaction support for atomic operations
- Connection retry with exponential backoff
- Error handling and logging

## Middleware Stack

### Request Processing Order

1. **CORS Middleware**: Handles cross-origin requests
2. **Body Parser**: Parses JSON request bodies
3. **Request Logger**: Logs method, path, timestamp
4. **Route Handler**: Executes business logic
5. **Error Handler**: Catches and formats errors

### CORS Configuration

```javascript
{
  origin: process.env.ALLOWED_ORIGINS || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}
```

### Error Handler

Global error handler catches all unhandled errors:
- Logs error details (message, stack, request info)
- Determines appropriate HTTP status code
- Returns standardized error response
- Prevents sensitive information leakage

## Testing Strategy

### Manual API Testing

The project includes a comprehensive API test script (`test-api.sh`) that validates all implemented endpoints:

```bash
./test-api.sh
```

**Features:**
- Tests all 4 implemented endpoints (GET /api/products, GET /api/products/:id, GET /api/cart, POST /api/cart)
- Validates HTTP status codes (200, 201, 404, 400)
- Tests error handling (invalid product IDs, invalid quantities)
- Verifies cart operations (add, increment, multiple items)
- Displays formatted JSON responses
- Shows cart totals and item counts
- No external dependencies (uses Python's built-in json.tool)

**Requirements:**
- Server running on http://localhost:5000
- Python 3 (pre-installed on macOS)
- curl command-line tool

### Property-Based Testing

**Library**: fast-check (JavaScript/TypeScript)

**Configuration**:
- Minimum 100 iterations per property test
- Each test references design document property number
- Tag format: `Feature: smiths-detection-ecommerce, Property {N}: {description}`

**Coverage**: All 25 correctness properties from design document

**Example Property Test**:
```javascript
describe('Property 8: Cart item creation or update', () => {
  it('should create new or increment existing cart item', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 100 }),
        async (productId, quantity) => {
          await createTestProduct(productId);
          const initialCart = await cartService.getCart();
          const existingItem = initialCart.items.find(
            item => item.product_id === productId
          );

          await cartService.addItem(productId, quantity);

          const updatedCart = await cartService.getCart();
          const updatedItem = updatedCart.items.find(
            item => item.product_id === productId
          );

          if (existingItem) {
            expect(updatedItem.quantity).toBe(
              existingItem.quantity + quantity
            );
          } else {
            expect(updatedItem.quantity).toBe(quantity);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing

**Frontend**: React Testing Library + Jest
**Backend**: Jest + Supertest

**Coverage Goals**:
- Line Coverage: 80%+
- Branch Coverage: 75%+
- Function Coverage: 85%+
- Critical Paths: 100%

**Test Categories**:
- Component rendering tests
- User interaction tests
- API endpoint tests
- Service layer tests
- Database schema tests
- Error handling tests
- Integration tests

## Correctness Properties

The design document defines 25 correctness properties that must hold true across all valid executions:

**Product Display** (Properties 1-2):
- Product cards include emoji, name, part number
- Product navigation works correctly

**CSV Import** (Property 3):
- Round-trip CSV parsing preserves data

**Product Storage** (Properties 4-5):
- Database stores all required fields
- Product detail page displays all information

**Cart Operations** (Properties 6-18):
- Quantity selector updates correctly
- Add-to-cart creates or updates items
- Cart persistence works correctly
- Cart display shows all required information
- Cart totals calculate correctly
- Update and delete operations work correctly

**API Behavior** (Property 19):
- Error responses include status code and message

**Navigation** (Properties 21-23):
- Navigation menu present on all pages
- Navigation links work correctly
- Cart count displays correctly

**Error Handling** (Properties 24-25):
- Frontend displays error messages
- Backend returns 404 for missing products

Each property will be validated through property-based tests with 100+ randomized test cases.

## Deployment Considerations

### Environment Variables

Required environment variables:
```
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_USER=ecommerce_user
DB_PASSWORD=<secure_password>
DB_NAME=smiths_ecommerce
CSV_FILE_PATH=../product_list.csv
```

### Process Management

Use PM2 for process management:
- Automatic restart on failure
- Log rotation
- Cluster mode for multiple instances
- Startup script for system boot

### Monitoring

Recommended metrics:
- API response times
- Error rates by endpoint
- Database query performance
- Cart conversion rates
- Server resource utilization

### Backup Strategy

- Daily database backups (automated via cron)
- Retain 7 days of backups
- Test restore procedure monthly
- Backup product_list.csv with version control
