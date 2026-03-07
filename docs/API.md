# API Documentation

## Implementation Status

**Last Updated:** March 7, 2026

| Endpoint | Method | Status | Tests |
|----------|--------|--------|-------|
| `/api/products` | GET | ✅ Implemented | ✅ 4 tests passing |
| `/api/products/:id` | GET | ✅ Implemented | ✅ 8 tests passing |
| `/api/cart` | POST | ✅ Implemented | ✅ 13 tests passing |
| `/api/cart` | GET | ✅ Implemented | ✅ 6 tests passing |
| `/api/cart/:id` | PUT | ⏳ Planned | - |
| `/api/cart/:id` | DELETE | ⏳ Planned | - |

**Total Backend Tests:** 89 passing

## Base URL
```
http://<server-address>/api
```

## Overview

The Smiths Detection E-Commerce API provides RESTful endpoints for managing products and shopping cart operations. All endpoints return JSON responses.

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

## HTTP Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `204 No Content` - Request succeeded with no response body
- `400 Bad Request` - Invalid request parameters
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Database connection failed

---

## Products API

### List All Products ✅

**Implementation Status:** Complete with comprehensive error handling

Retrieve the complete product catalog.

**Endpoint:** `GET /api/products`

**Request:**
```http
GET /api/products HTTP/1.1
Host: <server-address>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "part_number": "SD-1000",
      "description": "Advanced X-Ray Scanner for Airport Security",
      "price": 45000.00,
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "part_number": "SD-2000",
      "description": "Portable Explosive Trace Detector",
      "price": 12500.00,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Error Responses:**
- `503 Service Unavailable` - Database connection failed

---

### Get Product Details ✅

**Implementation Status:** Complete with ID validation and error handling

Retrieve detailed information about a specific product.

**Endpoint:** `GET /api/products/:id`

**Parameters:**
- `id` (path parameter) - Product ID

**Request:**
```http
GET /api/products/1 HTTP/1.1
Host: <server-address>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "part_number": "SD-1000",
    "description": "Advanced X-Ray Scanner for Airport Security",
    "price": 45000.00,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `404 Not Found` - Product does not exist
```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product with ID 1 not found"
  }
}
```

---

## Shopping Cart API

### Get Cart Contents ✅

**Implementation Status:** Complete with JOIN queries and calculated totals

Retrieve all items in the shopping cart with product details.

**Endpoint:** `GET /api/cart`

**Request:**
```http
GET /api/cart HTTP/1.1
Host: <server-address>
```

**Response:** `200 OK`
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
          "description": "Advanced X-Ray Scanner for Airport Security",
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

**Error Responses:**
- `503 Service Unavailable` - Database connection failed

---

### Add Item to Cart ✅

**Implementation Status:** Complete with create-or-update logic and validation

Add a product to the shopping cart or increment quantity if already exists.

**Endpoint:** `POST /api/cart`

**Request Body:**
```json
{
  "product_id": 1,
  "quantity": 2
}
```

**Request:**
```http
POST /api/cart HTTP/1.1
Host: <server-address>
Content-Type: application/json

{
  "product_id": 1,
  "quantity": 2
}
```

**Response:** `201 Created`
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

**Behavior:**
- If item already exists in cart, quantity is incremented
- If item is new, a new cart entry is created

**Error Responses:**
- `400 Bad Request` - Invalid request body
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "product_id and quantity are required"
  }
}
```

- `400 Bad Request` - Invalid quantity
```json
{
  "success": false,
  "error": {
    "code": "INVALID_QUANTITY",
    "message": "Quantity must be a positive integer"
  }
}
```

- `404 Not Found` - Product does not exist
```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product with ID 1 not found"
  }
}
```

---

### Update Cart Item Quantity ⏳

**Implementation Status:** Planned - CartService method exists, route not yet implemented

Update the quantity of an item in the cart.

**Endpoint:** `PUT /api/cart/:id`

**Parameters:**
- `id` (path parameter) - Cart item ID

**Request Body:**
```json
{
  "quantity": 5
}
```

**Request:**
```http
PUT /api/cart/1 HTTP/1.1
Host: <server-address>
Content-Type: application/json

{
  "quantity": 5
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "product_id": 1,
    "quantity": 5,
    "created_at": "2024-01-20T14:30:00Z",
    "updated_at": "2024-01-20T16:00:00Z"
  },
  "message": "Cart item updated successfully"
}
```

**Special Behavior:**
- If `quantity` is set to `0`, the item is removed from the cart (same as DELETE)

**Response when quantity = 0:** `204 No Content`

**Error Responses:**
- `400 Bad Request` - Invalid quantity
```json
{
  "success": false,
  "error": {
    "code": "INVALID_QUANTITY",
    "message": "Quantity must be a non-negative integer"
  }
}
```

- `404 Not Found` - Cart item does not exist
```json
{
  "success": false,
  "error": {
    "code": "CART_ITEM_NOT_FOUND",
    "message": "Cart item with ID 1 not found"
  }
}
```

---

### Remove Item from Cart ⏳

**Implementation Status:** Planned - CartService method exists, route not yet implemented

Remove an item from the shopping cart.

**Endpoint:** `DELETE /api/cart/:id`

**Parameters:**
- `id` (path parameter) - Cart item ID

**Request:**
```http
DELETE /api/cart/1 HTTP/1.1
Host: <server-address>
```

**Response:** `204 No Content`

No response body is returned on success.

**Error Responses:**
- `404 Not Found` - Cart item does not exist
```json
{
  "success": false,
  "error": {
    "code": "CART_ITEM_NOT_FOUND",
    "message": "Cart item with ID 1 not found"
  }
}
```

---

## Data Models

### Product
```typescript
{
  id: number;              // Unique product identifier
  part_number: string;     // Product part number (unique)
  description: string;     // Product description
  price: number;           // Price in currency units (e.g., USD)
  created_at: string;      // ISO 8601 timestamp
}
```

### Cart Item
```typescript
{
  id: number;              // Unique cart item identifier
  product_id: number;      // Foreign key to products table
  quantity: number;        // Quantity of product (positive integer)
  created_at: string;      // ISO 8601 timestamp
  updated_at: string;      // ISO 8601 timestamp
}
```

### Cart Response
```typescript
{
  items: Array<{
    id: number;
    product_id: number;
    quantity: number;
    product: Product;      // Joined product details
    line_total: number;    // quantity × product.price
    created_at: string;
    updated_at: string;
  }>;
  total: number;           // Sum of all line_totals
  item_count: number;      // Total quantity across all items
}
```

---

## Example Usage

### Complete Shopping Flow

#### 1. Browse Products
```bash
curl -X GET http://localhost/api/products
```

#### 2. View Product Details
```bash
curl -X GET http://localhost/api/products/1
```

#### 3. Add Product to Cart
```bash
curl -X POST http://localhost/api/cart \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "quantity": 2}'
```

#### 4. View Cart
```bash
curl -X GET http://localhost/api/cart
```

#### 5. Update Quantity
```bash
curl -X PUT http://localhost/api/cart/1 \
  -H "Content-Type: application/json" \
  -d '{"quantity": 5}'
```

#### 6. Remove Item
```bash
curl -X DELETE http://localhost/api/cart/1
```

---

## Rate Limiting

Currently not implemented. Future versions may include rate limiting to prevent abuse.

## Authentication

Currently not implemented. All endpoints are publicly accessible. Future versions will include authentication and user-specific carts.

## CORS Configuration

The API supports Cross-Origin Resource Sharing (CORS) to allow frontend access from different origins during development.

**Allowed Origins:** Configurable (default: all origins in development)
**Allowed Methods:** GET, POST, PUT, DELETE
**Allowed Headers:** Content-Type, Authorization

## Error Handling Best Practices

### Client-Side Handling
```javascript
try {
  const response = await fetch('/api/products');
  const data = await response.json();

  if (!response.ok) {
    // Handle HTTP error
    console.error(data.error.message);
    return;
  }

  // Process successful response
  console.log(data.data);
} catch (error) {
  // Handle network error
  console.error('Network error:', error);
}
```

### Retry Logic
For transient errors (503 Service Unavailable), implement exponential backoff:
```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status !== 503) return response;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

## Versioning

Current API version: **v1** (implicit)

Future versions may include explicit versioning in the URL path (e.g., `/api/v2/products`).

## Support

For API issues or questions, contact the development team or refer to the main project documentation.
