# Design Summary

## Overview

This document provides a high-level summary of the Smiths Detection E-Commerce platform design, created from the detailed design document in `.kiro/specs/smiths-detection-ecommerce/design.md`.

## Architecture at a Glance

**Pattern**: 3-Tier Architecture (Presentation, Application, Data)

**Technology Stack**:
- Frontend: React 18+ (SPA)
- Backend: Node.js + Express
- Database: MySQL 8.0+
- Reverse Proxy: Nginx

**Deployment**: Single server/EC2 instance

## Key Design Decisions

### 1. Single-Page Application (React)
**Why**: Eliminates page reloads, provides smooth user experience, enables component reusability

### 2. RESTful API Design
**Why**: Stateless endpoints, easy to test, frontend/backend can evolve independently

### 3. Service Layer Pattern
**Why**: Separates business logic from routes, improves testability, enables code reuse

### 4. MySQL with ACID Guarantees
**Why**: Ensures cart operation consistency, foreign key constraints maintain data integrity

### 5. CSV-Based Product Import
**Why**: Leverages existing product_list.csv, minimizes workflow disruption

## Component Architecture

### Frontend Components

**Pages**:
- HomePage: Product catalog grid
- ProductPage: Product details, reviews, add-to-cart
- CartPage: Cart items, totals, quantity management

**Shared Components**:
- Navigation: Cart count badge, page links
- ProductCard: Emoji icon, name, part number
- CartItem: Quantity control, remove button
- QuantitySelector: Input with +/- buttons
- ErrorMessage: Toast/inline/page errors
- LoadingSpinner: Async operation indicator

### Backend Services

**ProductService**:
- Load products from CSV
- Import products to database
- Retrieve all products
- Get product by ID
- Validate product existence

**CartService**:
- Get cart with totals
- Add item (create or increment)
- Update item quantity
- Remove item
- Calculate cart total

**DatabaseService**:
- Connection pool management
- Parameterized query execution
- Transaction support
- Retry logic with exponential backoff

### Middleware Stack

1. CORS Handler
2. Body Parser (JSON)
3. Request Logger
4. Route Handler
5. Error Handler

## Database Schema

### products table
```sql
- id (PK, AUTO_INCREMENT)
- part_number (UNIQUE, indexed)
- description (TEXT)
- price (DECIMAL 10,2)
- created_at (TIMESTAMP)
```

### cart_items table
```sql
- id (PK, AUTO_INCREMENT)
- product_id (FK → products.id, ON DELETE CASCADE)
- quantity (INT, CHECK > 0)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Relationship**: products (1) → (N) cart_items

## API Endpoints

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details

### Cart
- `GET /api/cart` - Get cart contents
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update item quantity
- `DELETE /api/cart/:id` - Remove item

## Error Handling

### HTTP Status Codes
- **200 OK**: Successful request
- **201 Created**: Resource created
- **204 No Content**: Successful deletion
- **400 Bad Request**: Invalid input
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Unexpected error
- **503 Service Unavailable**: Database unavailable

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

### Frontend Error Display
- **Toast Notifications**: Transient errors (auto-dismiss)
- **Inline Errors**: Form validation errors (persistent)
- **Error Pages**: Critical failures (cart load failure)

## Data Flow Examples

### Product Browsing
1. User navigates to home page
2. React requests `GET /api/products`
3. ProductService queries database
4. Backend returns product array
5. React renders ProductCard components

### Add to Cart
1. User selects quantity, clicks "Add to Cart"
2. React sends `POST /api/cart` with product_id and quantity
3. CartService validates product exists
4. CartService creates or updates cart item
5. Backend persists to database
6. React displays confirmation message

### Cart Management
1. User navigates to cart page
2. React requests `GET /api/cart`
3. CartService queries cart_items JOIN products
4. Backend calculates line totals and cart total
5. React renders cart items with controls
6. User updates trigger `PUT` or `DELETE` requests
7. Backend updates database, returns new state

## Correctness Properties

The design defines **25 correctness properties** that must hold true across all valid executions:

**Categories**:
- Product Display (Properties 1-2)
- CSV Import (Property 3)
- Product Storage (Properties 4-5)
- Cart Operations (Properties 6-18)
- API Behavior (Property 19)
- Product Import (Property 20)
- Navigation (Properties 21-23)
- Error Handling (Properties 24-25)

Each property will be validated through property-based testing with 100+ randomized test cases using the fast-check library.

## Testing Strategy

### Dual Approach

**Property-Based Testing**:
- Library: fast-check
- Iterations: 100+ per property
- Coverage: All 25 correctness properties
- Purpose: Verify universal properties across random inputs

**Unit Testing**:
- Frontend: React Testing Library + Jest
- Backend: Jest + Supertest
- Coverage Goals: 80% line, 75% branch, 85% function
- Purpose: Verify specific examples and edge cases

### Test Categories
- Component rendering
- User interactions
- API endpoints
- Service layer logic
- Database schema
- Error handling
- End-to-end integration

## Deployment Architecture

### Single Server Layout
```
┌─────────────────────────────────┐
│  Nginx (:80)                    │
│  - Reverse Proxy                │
│  - SSL Termination              │
└─────────────────────────────────┘
         │              │
         ↓              ↓
┌──────────────┐  ┌──────────────┐
│ React Build  │  │ Node.js API  │
│ (:3000)      │  │ (:5000)      │
└──────────────┘  └──────────────┘
                       │
                       ↓
                ┌──────────────┐
                │ MySQL        │
                │ (:3306)      │
                └──────────────┘
```

### Port Allocation
- **80**: Nginx (external access)
- **3000**: React dev server (internal)
- **5000**: Node.js API (internal)
- **3306**: MySQL (internal)

### Process Management
- Use PM2 for Node.js process management
- Automatic restart on failure
- Log rotation
- Cluster mode for scaling

## Security Considerations

**Current**:
- Parameterized queries (SQL injection prevention)
- Input validation
- CORS configuration
- Error message sanitization

**Future**:
- HTTPS/SSL encryption
- Authentication and authorization
- Rate limiting
- CSRF protection
- Security headers

## Performance Optimization

**Frontend**:
- Code splitting
- Lazy loading
- Image optimization (emoji icons)
- Minification and bundling

**Backend**:
- Database connection pooling
- Query optimization
- Response caching
- Compression (gzip)

**Database**:
- Indexes on frequently queried columns
- Query optimization
- Regular maintenance

## Future Enhancements

**Scalability**:
- Horizontal scaling with load balancer
- Database replication (master-slave)
- Caching layer (Redis)
- CDN for static assets

**Features**:
- User authentication and accounts
- Order checkout and payment
- Product categories and search
- Multiple product images
- Inventory management

## Documentation References

- **Requirements**: `.kiro/specs/smiths-detection-ecommerce/requirements.md`
- **Design**: `.kiro/specs/smiths-detection-ecommerce/design.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **API**: `docs/API.md`
- **Deployment**: `docs/DEPLOYMENT.md`
- **Diagrams**: `generated-diagrams/`

## Next Steps

1. Review and approve design document
2. Create implementation tasks from design
3. Set up development environment
4. Implement backend services
5. Implement frontend components
6. Write property-based tests (25 properties)
7. Write unit tests (80%+ coverage)
8. Integration testing
9. Deploy to test environment
10. User acceptance testing
