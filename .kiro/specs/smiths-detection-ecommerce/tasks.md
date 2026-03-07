# Implementation Plan: Smiths Detection E-Commerce Platform

## Overview

This implementation plan breaks down the e-commerce platform into discrete coding tasks following the 3-tier architecture: database setup, backend API development, frontend React components, and integration. Each task builds incrementally, with testing integrated throughout to catch errors early.

## Tasks

- [x] 1. Set up project structure and database schema
  - Create project directory structure (backend/, frontend/, database/)
  - Initialize Node.js backend with Express, mysql2, and csv-parser dependencies
  - Initialize React frontend with React Router and fetch API
  - Create MySQL database schema with products and cart_items tables
  - Implement foreign key constraints and indexes as specified in design
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 1.1 Write property test for database schema
  - **Property 4: Product Storage Completeness**
  - **Validates: Requirements 2.3**

- [ ] 2. Implement product data import and backend services
  - [x] 2.1 Create CSV parser for product_list.csv
    - Implement CSV file reading and parsing logic
    - Handle malformed rows and empty lines
    - Map CSV columns to product model fields
    - _Requirements: 2.1, 2.2, 12.2, 12.3_

  - [ ]* 2.2 Write property test for CSV parsing
    - **Property 3: CSV Parsing Round-Trip**
    - **Validates: Requirements 2.2, 12.3**

  - [x] 2.3 Implement ProductService with database operations
    - Create loadProductsFromCSV() method
    - Create importProducts() bulk insert method
    - Create getAllProducts() retrieval method
    - Create getProductById() retrieval method
    - Create productExists() validation method
    - _Requirements: 2.3, 2.4, 2.5_

  - [x] 2.4 Implement product import on backend startup
    - Check if products table is empty on startup
    - Trigger CSV import if table is empty
    - Log import results and handle errors gracefully
    - _Requirements: 12.1, 12.4, 12.5_

  - [ ]* 2.5 Write property test for product import
    - **Property 20: Product Import Persistence**
    - **Validates: Requirements 12.4**

- [ ] 3. Implement backend API endpoints for products
  - [x] 3.1 Create GET /api/products endpoint
    - Implement route handler calling ProductService.getAllProducts()
    - Return standardized success response with product array
    - Handle database errors with 503 status
    - _Requirements: 2.4, 9.1_

  - [x] 3.2 Create GET /api/products/:id endpoint
    - Implement route handler calling ProductService.getProductById()
    - Return 404 for non-existent products
    - Return standardized success response with product object
    - _Requirements: 2.5, 9.2, 14.5_

  - [ ]* 3.3 Write unit tests for product endpoints
    - Test successful product list retrieval
    - Test successful single product retrieval
    - Test 404 for non-existent product
    - Test 503 for database errors
    - _Requirements: 9.7, 9.8_

- [ ] 4. Implement CartService and cart API endpoints
  - [x] 4.1 Create CartService with core operations
    - Implement getCart() with JOIN to products table
    - Implement addItem() with create-or-update logic
    - Implement updateItemQuantity() with zero-quantity removal
    - Implement removeItem() deletion method
    - Implement calculateCartTotal() helper method
    - Implement getCartItemCount() helper method
    - _Requirements: 4.2, 4.3, 5.1, 5.2, 5.3, 5.4_

  - [ ]* 4.2 Write property test for cart item creation/update
    - **Property 8: Cart Item Creation or Update**
    - **Validates: Requirements 4.2, 4.3**

  - [ ]* 4.3 Write property test for cart persistence
    - **Property 10: Cart Persistence Round-Trip**
    - **Validates: Requirements 5.2, 7.3, 8.3**

  - [x] 4.4 Create POST /api/cart endpoint
    - Validate request body (product_id, quantity)
    - Call CartService.addItem()
    - Return 201 Created with cart item data
    - Return 404 if product doesn't exist
    - Return 400 for invalid quantity
    - _Requirements: 4.1, 4.2, 4.4, 9.3_

  - [x] 4.5 Create GET /api/cart endpoint
    - Call CartService.getCart()
    - Return cart items with product details, line totals, and cart total
    - Handle database errors with 503 status
    - _Requirements: 5.3, 9.4_

  - [x] 4.6 Create PUT /api/cart/:id endpoint
    - Validate request body (quantity)
    - Call CartService.updateItemQuantity()
    - Return 200 OK with updated item or 204 No Content if removed
    - Return 404 if cart item doesn't exist
    - _Requirements: 7.2, 7.3, 7.4, 9.5_

  - [x] 4.7 Create DELETE /api/cart/:id endpoint
    - Call CartService.removeItem()
    - Return 204 No Content on success
    - Return 404 if cart item doesn't exist
    - _Requirements: 8.2, 8.3, 9.6_

  - [ ]* 4.8 Write unit tests for cart endpoints
    - Test add item to empty cart
    - Test increment existing cart item quantity
    - Test update cart item quantity
    - Test remove cart item when quantity set to zero
    - Test delete cart item
    - Test error responses (404, 400, 503)
    - _Requirements: 9.7, 9.8_

- [x] 5. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement backend middleware and error handling
  - [x] 6.1 Create global error handler middleware
    - Log error details with stack traces
    - Return standardized error response format
    - Map error types to appropriate HTTP status codes
    - Prevent sensitive information leakage
    - _Requirements: 9.7, 9.8_

  - [x] 6.2 Create request logger middleware
    - Log all incoming requests (method, path, timestamp)
    - Log response status and duration
    - _Requirements: N/A (operational requirement)_

  - [x] 6.3 Configure CORS and body parser middleware
    - Enable CORS for frontend origin
    - Parse JSON request bodies
    - Limit request body size
    - _Requirements: N/A (technical requirement)_

  - [ ]* 6.4 Write property test for error response format
    - **Property 19: API Error Response Format**
    - **Validates: Requirements 9.7, 9.8**

- [ ] 7. Implement frontend API client module
  - [x] 7.1 Create API client with request wrapper
    - Implement apiRequest() function with fetch
    - Handle response parsing and error extraction
    - Throw errors with user-friendly messages
    - _Requirements: 14.1_

  - [x] 7.2 Create productsAPI methods
    - Implement getAll() for GET /api/products
    - Implement getById(id) for GET /api/products/:id
    - _Requirements: 1.2, 3.1_

  - [x] 7.3 Create cartAPI methods
    - Implement get() for GET /api/cart
    - Implement add(productId, quantity) for POST /api/cart
    - Implement update(itemId, quantity) for PUT /api/cart/:id
    - Implement remove(itemId) for DELETE /api/cart/:id
    - _Requirements: 4.1, 5.3, 7.2, 8.2_

- [ ] 8. Implement shared frontend components
  - [x] 8.1 Create Navigation component
    - Display navigation menu with links to Home and Cart pages
    - Fetch and display cart item count badge
    - Implement responsive design
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [ ]* 8.2 Write property test for navigation
    - **Property 21: Navigation Menu Presence**
    - **Property 22: Navigation Link Functionality**
    - **Property 23: Cart Count Display**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5**

  - [x] 8.3 Create ProductCard component
    - Display product emoji icon
    - Display product name and part number
    - Handle click to navigate to product details
    - _Requirements: 1.3, 1.4, 1.5, 1.6_

  - [x] 8.4 Create QuantitySelector component
    - Render input field with increment/decrement buttons
    - Validate positive integer input
    - Update displayed quantity on change
    - _Requirements: 3.3, 3.6_

  - [ ]* 8.5 Write property test for quantity selector
    - **Property 6: Quantity Selector Reactivity**
    - **Validates: Requirements 3.6**

  - [x] 8.6 Create ErrorMessage component
    - Display user-friendly error messages
    - Implement dismissible notification
    - Auto-dismiss after timeout
    - _Requirements: 14.1, 14.2, 14.3_

  - [x] 8.7 Create LoadingSpinner component
    - Display loading indicator during async operations
    - Consistent styling across pages
    - _Requirements: N/A (UX requirement)_

- [ ] 9. Implement HomePage and product browsing
  - [x] 9.1 Create HomePage component
    - Fetch products from API on mount
    - Display product grid using ProductCard components
    - Handle loading and error states
    - Navigate to ProductPage on product click
    - _Requirements: 1.1, 1.2, 1.6_

  - [ ]* 9.2 Write property test for product display
    - **Property 1: Product Display Completeness**
    - **Validates: Requirements 1.3, 1.4, 1.5**

  - [ ]* 9.3 Write property test for product navigation
    - **Property 2: Product Navigation**
    - **Validates: Requirements 1.6**

  - [ ]* 9.4 Write unit tests for HomePage
    - Test product list rendering
    - Test loading state display
    - Test error state display
    - Test navigation on product click
    - _Requirements: 1.1, 1.2, 1.6_

- [ ] 10. Implement ProductPage and add-to-cart functionality
  - [x] 10.1 Create ProductPage component
    - Fetch product details by ID from URL parameter
    - Display product description, price, and sample reviews
    - Render QuantitySelector component
    - Render add-to-cart button
    - Handle add-to-cart button click
    - Display confirmation message on success
    - Handle loading and error states
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.5_

  - [ ]* 10.2 Write property test for product detail display
    - **Property 5: Product Detail Display Completeness**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

  - [ ]* 10.3 Write property test for add-to-cart request
    - **Property 7: Add-to-Cart Request Formation**
    - **Validates: Requirements 4.1**

  - [ ]* 10.4 Write property test for add-to-cart feedback
    - **Property 9: Add-to-Cart Success Feedback**
    - **Validates: Requirements 4.4, 4.5**

  - [ ]* 10.5 Write unit tests for ProductPage
    - Test product details rendering
    - Test add-to-cart with valid quantity
    - Test add-to-cart error handling
    - Test confirmation message display
    - _Requirements: 3.1, 3.2, 4.1, 4.5, 14.2_

- [ ] 11. Implement CartPage and cart management
  - [x] 11.1 Create CartItem component
    - Display product name, quantity, unit price, and line total
    - Render quantity update control
    - Render delete button
    - Handle quantity update with optimistic UI
    - Handle item removal with optimistic UI
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 7.1, 8.1_

  - [ ]* 11.2 Write property test for cart item display
    - **Property 13: Cart Item Display Completeness**
    - **Validates: Requirements 6.2, 6.3, 6.4, 6.5**

  - [x] 11.3 Create CartPage component
    - Fetch cart contents from API on mount
    - Display all cart items using CartItem components
    - Calculate and display cart total
    - Display empty cart message when no items
    - Handle cart updates and refresh display
    - Handle loading and error states
    - _Requirements: 5.3, 6.1, 6.6, 6.7, 7.5, 8.4, 8.5, 14.3_

  - [ ]* 11.4 Write property test for cart retrieval
    - **Property 12: Cart Retrieval Completeness**
    - **Validates: Requirements 5.3, 6.1**

  - [ ]* 11.5 Write property test for cart total calculation
    - **Property 14: Cart Total Calculation**
    - **Validates: Requirements 6.6**

  - [ ]* 11.6 Write property test for cart display reactivity
    - **Property 15: Cart Display Reactivity**
    - **Validates: Requirements 6.7, 7.5, 8.4, 8.5**

  - [ ]* 11.7 Write property test for cart item controls
    - **Property 16: Cart Item Update Controls**
    - **Validates: Requirements 7.1, 8.1**

  - [ ]* 11.8 Write property test for quantity update request
    - **Property 17: Quantity Update Request Formation**
    - **Validates: Requirements 7.2**

  - [ ]* 11.9 Write property test for delete request
    - **Property 18: Delete Request Formation**
    - **Validates: Requirements 8.2**

  - [ ]* 11.10 Write unit tests for CartPage
    - Test cart items rendering
    - Test cart total calculation
    - Test empty cart message
    - Test quantity update
    - Test item removal
    - Test error handling
    - _Requirements: 6.1, 6.6, 7.5, 8.4, 14.3_

- [x] 12. Checkpoint - Ensure frontend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement frontend routing and integration
  - [x] 13.1 Create App component with React Router
    - Configure routes for HomePage (/), ProductPage (/product/:id), and CartPage (/cart)
    - Render Navigation component on all routes
    - Handle 404 for unknown routes
    - _Requirements: 13.1, 13.4_

  - [x] 13.2 Wire frontend components together
    - Connect all components with proper props and state management
    - Ensure navigation flows work correctly
    - Test end-to-end user flows
    - _Requirements: 1.6, 13.4_

  - [ ]* 13.3 Write integration tests for frontend flows
    - Test complete product browsing flow
    - Test complete add-to-cart flow
    - Test complete cart management flow
    - _Requirements: 1.1, 1.6, 4.1, 4.5, 6.1, 7.5, 8.4_

- [ ] 14. Set up deployment configuration
  - [x] 14.1 Create Nginx configuration
    - Configure reverse proxy for frontend static files
    - Configure API request routing to backend (/api/*)
    - Set up port 80 for HTTP access
    - _Requirements: 11.1, 11.2, 11.3, 11.5_

  - [x] 14.2 Create environment configuration
    - Create .env file for backend configuration (database credentials, port)
    - Create production build script for React frontend
    - Document deployment steps
    - _Requirements: 11.1, 11.4_

  - [x] 14.3 Create database initialization script
    - Write SQL script to create database and tables
    - Include schema with constraints and indexes
    - Document database setup steps
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 15. Final integration and testing
  - [x] 15.1 Test complete system integration
    - Start backend server and verify product import
    - Build and serve frontend
    - Test all user flows end-to-end
    - Verify error handling across all scenarios
    - _Requirements: All requirements_

  - [x] 15.2 Verify all correctness properties
    - Run all property-based tests
    - Verify all 25 properties pass
    - Document any edge cases discovered
    - _Requirements: All requirements_

- [x] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based and unit tests that can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Checkpoints ensure incremental validation at key milestones
- The implementation follows a bottom-up approach: database → backend → frontend → integration
- All 14 requirements and 25 correctness properties are covered by implementation and test tasks
