# Requirements Document

## Introduction

This document specifies the requirements for an e-commerce web application for Smiths Detection, a company specializing in detection equipment for defence and airports. The system will replace the current manual procurement process with an online shopping experience, allowing customers to browse products, add items to a shopping cart, and manage their purchases through a web interface.

The solution implements a 3-tier architecture with a React frontend, Node.js backend, and MySQL database, deployed on a single server with reverse proxy for remote access.

## Glossary

- **System**: The complete e-commerce web application including frontend, backend, and database
- **Frontend**: The React-based user interface layer
- **Backend**: The Node.js application server handling business logic
- **Database**: The MySQL database storing product and cart data
- **Product_Catalog**: The collection of detection equipment products available for purchase
- **Shopping_Cart**: A temporary collection of products selected by a customer for purchase
- **Cart_Item**: A single product entry in the Shopping_Cart with associated quantity
- **Product_Data_File**: The CSV file (product_list.csv) containing product information
- **Home_Page**: The main landing page displaying the product list
- **Product_Page**: The detailed view of a single product
- **Cart_Page**: The page displaying Shopping_Cart contents and management controls
- **Reverse_Proxy**: The network component enabling remote access to the application

## Requirements

### Requirement 1: Product Catalog Display

**User Story:** As a customer, I want to view all available detection equipment products on the home page, so that I can browse the product catalog.

#### Acceptance Criteria

1. THE Frontend SHALL display a product list on the Home_Page
2. THE Frontend SHALL load product data from the Product_Catalog
3. THE Frontend SHALL display an emoji icon for each product as a visual representation
4. THE Frontend SHALL display the product name for each product
5. THE Frontend SHALL display the product part number for each product
6. WHEN a customer clicks on a product, THE Frontend SHALL navigate to the Product_Page for that product

### Requirement 2: Product Data Management

**User Story:** As a system administrator, I want the system to load product data from the existing CSV file, so that product information is centralized and maintainable.

#### Acceptance Criteria

1. THE Backend SHALL load product data from the Product_Data_File during initialization
2. THE Backend SHALL parse CSV format product data into structured records
3. THE Database SHALL store product information including part number, description, and pricing
4. THE Backend SHALL provide an API endpoint to retrieve product list data
5. THE Backend SHALL provide an API endpoint to retrieve individual product details by identifier

### Requirement 3: Product Detail View

**User Story:** As a customer, I want to view detailed information about a specific product, so that I can make an informed purchase decision.

#### Acceptance Criteria

1. THE Frontend SHALL display the product description on the Product_Page
2. THE Frontend SHALL display the product price on the Product_Page
3. THE Frontend SHALL display a quantity selector on the Product_Page
4. THE Frontend SHALL display an add-to-cart button on the Product_Page
5. THE Frontend SHALL display sample user reviews on the Product_Page
6. WHEN the quantity selector value changes, THE Frontend SHALL update the displayed quantity value

### Requirement 4: Shopping Cart Addition

**User Story:** As a customer, I want to add products to my shopping cart with a specified quantity, so that I can collect items for purchase.

#### Acceptance Criteria

1. WHEN a customer clicks the add-to-cart button, THE Frontend SHALL send the product identifier and quantity to the Backend
2. WHEN the Backend receives an add-to-cart request, THE Backend SHALL create or update a Cart_Item in the Shopping_Cart
3. WHEN a Cart_Item already exists for a product, THE Backend SHALL increment the quantity by the specified amount
4. WHEN the Backend successfully adds an item, THE Backend SHALL return a success response to the Frontend
5. WHEN the Backend successfully adds an item, THE Frontend SHALL display a confirmation message to the customer

### Requirement 5: Shopping Cart Persistence

**User Story:** As a customer, I want my shopping cart to be saved, so that I can return to my cart later without losing my selections.

#### Acceptance Criteria

1. THE Database SHALL store Cart_Item records with product identifier, quantity, and timestamp
2. WHEN a Cart_Item is created or updated, THE Backend SHALL persist the changes to the Database
3. WHEN a customer navigates to the Cart_Page, THE Backend SHALL retrieve all Cart_Item records from the Database
4. THE Backend SHALL provide an API endpoint to retrieve the current Shopping_Cart contents

### Requirement 6: Shopping Cart Display

**User Story:** As a customer, I want to view all items in my shopping cart with pricing, so that I can review my purchase before proceeding.

#### Acceptance Criteria

1. THE Frontend SHALL display all Cart_Item entries on the Cart_Page
2. THE Frontend SHALL display the product name for each Cart_Item
3. THE Frontend SHALL display the quantity for each Cart_Item
4. THE Frontend SHALL display the unit price for each Cart_Item
5. THE Frontend SHALL display the line total (quantity × unit price) for each Cart_Item
6. THE Frontend SHALL calculate and display the total cost of all Cart_Item entries
7. WHEN the Shopping_Cart contents change, THE Frontend SHALL update the displayed total cost

### Requirement 7: Shopping Cart Quantity Management

**User Story:** As a customer, I want to update the quantity of items in my cart, so that I can adjust my order without removing and re-adding items.

#### Acceptance Criteria

1. THE Frontend SHALL display a quantity update control for each Cart_Item on the Cart_Page
2. WHEN a customer changes a Cart_Item quantity, THE Frontend SHALL send the updated quantity to the Backend
3. WHEN the Backend receives a quantity update request, THE Backend SHALL update the Cart_Item quantity in the Database
4. WHEN the quantity is updated to zero, THE Backend SHALL remove the Cart_Item from the Shopping_Cart
5. WHEN the Backend successfully updates the quantity, THE Frontend SHALL refresh the Cart_Page display

### Requirement 8: Shopping Cart Item Removal

**User Story:** As a customer, I want to remove items from my shopping cart, so that I can eliminate products I no longer wish to purchase.

#### Acceptance Criteria

1. THE Frontend SHALL display a delete button for each Cart_Item on the Cart_Page
2. WHEN a customer clicks the delete button, THE Frontend SHALL send a removal request to the Backend
3. WHEN the Backend receives a removal request, THE Backend SHALL delete the Cart_Item from the Database
4. WHEN the Backend successfully removes the item, THE Frontend SHALL remove the Cart_Item from the Cart_Page display
5. WHEN the Backend successfully removes the item, THE Frontend SHALL update the total cost

### Requirement 9: Backend API Architecture

**User Story:** As a developer, I want a RESTful API for cart operations, so that the frontend can interact with the backend in a standard way.

#### Acceptance Criteria

1. THE Backend SHALL expose a GET endpoint to retrieve all products
2. THE Backend SHALL expose a GET endpoint to retrieve a single product by identifier
3. THE Backend SHALL expose a POST endpoint to add items to the Shopping_Cart
4. THE Backend SHALL expose a GET endpoint to retrieve Shopping_Cart contents
5. THE Backend SHALL expose a PUT endpoint to update Cart_Item quantities
6. THE Backend SHALL expose a DELETE endpoint to remove Cart_Item entries
7. WHEN an API request fails, THE Backend SHALL return an appropriate HTTP error status code
8. WHEN an API request fails, THE Backend SHALL return an error message in the response body

### Requirement 10: Database Schema

**User Story:** As a developer, I want a normalized database schema, so that product and cart data is stored efficiently and consistently.

#### Acceptance Criteria

1. THE Database SHALL contain a products table with columns for product identifier, part number, description, and price
2. THE Database SHALL contain a cart_items table with columns for item identifier, product identifier, quantity, and timestamp
3. THE Database SHALL enforce a foreign key relationship between cart_items and products
4. THE Database SHALL use the product identifier as the primary key for the products table
5. THE Database SHALL use an auto-incrementing identifier as the primary key for the cart_items table

### Requirement 11: Deployment Architecture

**User Story:** As a system administrator, I want the application deployed on a single server with remote access, so that customers can access the system from any location.

#### Acceptance Criteria

1. THE System SHALL run on a single server or EC2 instance
2. THE Reverse_Proxy SHALL route incoming HTTP requests to the Frontend
3. THE Reverse_Proxy SHALL route API requests to the Backend
4. THE Backend SHALL connect to the Database on the same server
5. THE System SHALL be accessible via HTTP from remote clients

### Requirement 12: Product Data Import

**User Story:** As a system administrator, I want the system to automatically import product data from the CSV file on startup, so that the product catalog is always current.

#### Acceptance Criteria

1. WHEN the Backend starts, THE Backend SHALL check if the products table is empty
2. WHEN the products table is empty, THE Backend SHALL read the Product_Data_File
3. WHEN the Backend reads the Product_Data_File, THE Backend SHALL parse each row into a product record
4. WHEN the Backend parses product records, THE Backend SHALL insert them into the Database
5. IF the Product_Data_File cannot be read, THEN THE Backend SHALL log an error and continue startup with an empty catalog

### Requirement 13: User Interface Navigation

**User Story:** As a customer, I want to navigate between pages easily, so that I can move through the shopping experience smoothly.

#### Acceptance Criteria

1. THE Frontend SHALL display a navigation menu on all pages
2. THE Frontend SHALL provide a link to the Home_Page in the navigation menu
3. THE Frontend SHALL provide a link to the Cart_Page in the navigation menu
4. WHEN a customer clicks a navigation link, THE Frontend SHALL navigate to the corresponding page
5. THE Frontend SHALL display the current cart item count in the navigation menu

### Requirement 14: Error Handling

**User Story:** As a customer, I want to see clear error messages when something goes wrong, so that I understand what happened and what to do next.

#### Acceptance Criteria

1. WHEN a Backend API call fails, THE Frontend SHALL display an error message to the customer
2. WHEN a product cannot be added to the cart, THE Frontend SHALL display a specific error message
3. WHEN the Shopping_Cart cannot be loaded, THE Frontend SHALL display an error message on the Cart_Page
4. IF the Database connection fails, THEN THE Backend SHALL return a 503 Service Unavailable status code
5. IF a requested product does not exist, THEN THE Backend SHALL return a 404 Not Found status code
