# Architecture Diagrams Guide

## Overview

This guide explains the architecture diagrams available in the `diagrams/` folder and how to use them for understanding the Smiths Detection E-Commerce platform.

## Diagram Catalog

### 1. Complete System Architecture
**File:** `diagrams/complete-system-architecture.png`

**Purpose:** Provides a bird's-eye view of the entire system

**Shows:**
- User/customer interaction layer
- Nginx reverse proxy (port 80)
- React frontend SPA (port 3000)
- Express backend API (port 5000)
- Backend services (ProductService, CartService, CSVParser)
- MySQL database (port 3306)
- CSV data file
- All connections and data flows

**Use when:**
- Onboarding new team members
- Explaining the system to stakeholders
- Planning infrastructure changes
- Understanding component relationships

---

### 2. Backend Service Architecture
**File:** `diagrams/backend-service-architecture.png`

**Purpose:** Deep dive into the backend service layer

**Shows:**
- Express API server entry point
- Routes layer (Products routes, Cart routes)
- Service layer (ProductService, CartService, CSVParser)
- Database configuration and connection pooling
- Data sources (MySQL, CSV file)
- Request flow through layers
- CSV import process on startup

**Use when:**
- Implementing new backend features
- Debugging service interactions
- Understanding business logic flow
- Planning service refactoring

---

### 3. Data Flow - Product Browsing
**File:** `diagrams/data-flow-product-browsing.png`

**Purpose:** Step-by-step flow for browsing products

**Shows:**
1. Customer initiates browse action
2. React app sends GET /api/products
3. Express routes to ProductService
4. Service queries MySQL database
5. Data returns through layers
6. Product catalog displayed to user

**Use when:**
- Understanding the product browsing feature
- Debugging product display issues
- Optimizing query performance
- Implementing caching strategies

---

### 4. Data Flow - Add to Cart
**File:** `diagrams/data-flow-add-to-cart.png`

**Purpose:** Step-by-step flow for adding items to cart

**Shows:**
1. Customer clicks "Add to Cart"
2. React app sends POST /api/cart with product_id and quantity
3. CartService validates product exists via ProductService
4. Database INSERT or UPDATE on cart_items table
5. Success response flows back
6. UI shows confirmation

**Use when:**
- Understanding cart functionality
- Debugging cart operations
- Implementing cart validation
- Troubleshooting cart persistence

---

### 5. API Endpoints Status
**File:** `diagrams/api-endpoints-status.png`

**Purpose:** Visual status of all API endpoints

**Shows:**
- ✅ Implemented endpoints (GET /api/products, GET /api/products/:id, GET /api/cart, POST /api/cart)
- ⏳ Planned endpoints (PUT /api/cart/:id, DELETE /api/cart/:id)
- Test counts for each endpoint
- Database connections
- Implementation progress

**Use when:**
- Planning development sprints
- Tracking implementation progress
- Identifying gaps in API coverage
- Prioritizing endpoint development

---

### 6. Testing Architecture
**File:** `diagrams/testing-architecture.png`

**Purpose:** Overview of testing infrastructure

**Shows:**
- Test suites (89 passing tests)
- Integration tests (server startup, routes)
- Service tests (ProductService, CartService, CSVParser)
- Property-based tests using fast-check
- Test infrastructure (Jest, Supertest)
- Code under test

**Use when:**
- Understanding test organization
- Adding new tests
- Improving test coverage
- Debugging test failures

---

## Diagram Conventions

### Visual Elements

**Icons:**
- 👤 User icon = Customer/end user
- 🖥️ Server icon = Application components
- 🗄️ Database icon = MySQL database
- 📄 Document icon = CSV file
- ⚙️ Gear icon = Services/business logic

**Colors:**
- Blue = Frontend components
- Green = Backend services
- Orange = Data layer
- Gray = Infrastructure

**Line Styles:**
- Solid lines = Implemented connections
- Dashed lines = Planned connections
- Arrows = Data flow direction
- Labels = Request/response descriptions

### Reading the Diagrams

**Top-to-Bottom Flow:**
- User at top
- Frontend layer
- Backend layer
- Database at bottom

**Left-to-Right Flow:**
- Request initiation on left
- Processing in middle
- Response on right

---

## Using Diagrams in Documentation

### In Markdown Files
```markdown
![Complete System Architecture](../diagrams/complete-system-architecture.png)
```

### In Presentations
- Export diagrams as PNG (already done)
- Import into PowerPoint/Keynote
- Add annotations as needed

### In Code Reviews
- Reference specific diagrams when discussing changes
- Link to diagram files in PR descriptions
- Use diagrams to explain architectural decisions

---

## Updating Diagrams

### When to Update

Update diagrams when:
- New components are added
- Service interactions change
- API endpoints are implemented
- Database schema changes
- Testing infrastructure evolves
- Deployment architecture changes

### How to Update

1. Use the AWS Diagram MCP server
2. Modify the diagram generation code
3. Regenerate the diagram
4. Copy to `diagrams/` folder
5. Update `diagrams/README.md`
6. Update this guide if needed

### Diagram Generation

Diagrams are generated using Python's `diagrams` library:

```python
from diagrams import Diagram, Cluster, Edge
from diagrams.onprem.client import User
from diagrams.onprem.network import Nginx
from diagrams.onprem.database import Mysql
from diagrams.programming.framework import React
from diagrams.programming.language import Nodejs

with Diagram("Complete System Architecture", show=False):
    # Diagram code here
    pass
```

---

## Related Documentation

- [Architecture Documentation](./ARCHITECTURE.md) - Detailed architecture description
- [API Documentation](./API.md) - API endpoint specifications
- [Implementation Guide](./IMPLEMENTATION-GUIDE.md) - Development guidelines
- [Testing Guide](../TESTING-GUIDE.md) - Testing procedures

---

## Diagram Maintenance

**Responsibility:** Development team
**Review Frequency:** After each major feature implementation
**Version Control:** All diagrams are tracked in Git
**Format:** PNG (for universal compatibility)

---

## Tips for Using Diagrams

1. **Start with Complete System Architecture** - Get the big picture first
2. **Drill down to specific flows** - Use data flow diagrams for detailed understanding
3. **Reference during development** - Keep diagrams open while coding
4. **Update as you go** - Don't let diagrams become outdated
5. **Use in meetings** - Visual aids improve communication
6. **Link in documentation** - Connect diagrams to relevant docs

---

**Last Updated:** March 7, 2026
**Diagram Count:** 6
**Total Components Visualized:** 50+
