# Project Structure

## Directory Organization

```
.
├── backend/                    # Node.js/Express API server
│   ├── config/
│   │   └── database.js        # MySQL connection pool
│   ├── routes/
│   │   ├── products.js        # Product API routes
│   │   └── cart.js            # Cart API routes
│   ├── services/
│   │   ├── productService.js  # Product business logic
│   │   ├── cartService.js     # Cart business logic
│   │   └── csvParser.js       # CSV parsing utility
│   ├── __tests__/             # Integration tests
│   ├── server.js              # Main entry point
│   ├── .env                   # Environment config (gitignored)
│   └── package.json
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── App.js             # Main app component
│   │   ├── index.js           # React entry point
│   │   └── *.css              # Component styles
│   ├── public/
│   │   └── index.html         # HTML template
│   └── package.json
├── database/
│   ├── schema.sql             # MySQL schema definition
│   └── README.md              # Database setup instructions
├── docs/                       # Project documentation
│   ├── API.md                 # API endpoint specs
│   ├── ARCHITECTURE.md        # Architecture details
│   ├── DESIGN-SUMMARY.md      # Design overview
│   └── IMPLEMENTATION-*.md    # Implementation guides
├── generated-diagrams/         # Architecture diagrams (PNG)
├── .kiro/
│   ├── specs/                 # Spec-driven development files
│   │   └── smiths-detection-ecommerce/
│   │       ├── requirements.md
│   │       ├── design.md
│   │       └── tasks.md
│   └── steering/              # AI assistant guidance (this folder)
└── product_list.csv           # Product catalog (74 products)
```

## Architecture Pattern

**3-Tier Architecture**:
1. **Presentation Layer**: React components (frontend/)
2. **Application Layer**: Express routes + services (backend/)
3. **Data Layer**: MySQL database + schema (database/)

## Code Organization Principles

### Backend Service Layer Pattern
- **Routes**: Handle HTTP requests/responses, minimal logic
- **Services**: Contain business logic, reusable across routes
- **Config**: Database connections, environment setup

### Frontend Component Structure (Planned)
- **Pages**: Top-level route components (HomePage, ProductPage, CartPage)
- **Components**: Reusable UI components (ProductCard, CartItem, Navigation)
- **Shared**: Common utilities (ErrorMessage, LoadingSpinner, QuantitySelector)

### Test Organization
- **Backend**: `__tests__/` folders alongside source files
- **Frontend**: `__tests__/` folders or `.test.js` files next to components
- **Property-based tests**: Use fast-check with 100+ iterations per property

## File Naming Conventions

- **Services**: `camelCase.js` (e.g., `productService.js`, `cartService.js`)
- **Routes**: `lowercase.js` (e.g., `products.js`, `cart.js`)
- **Components**: `PascalCase.js` (e.g., `ProductCard.js`, `CartPage.js`)
- **Tests**: `*.test.js` or in `__tests__/` directory
- **Config**: `lowercase.js` (e.g., `database.js`)

## Key Files

- `backend/server.js`: Main entry point, initializes DB and imports CSV
- `product_list.csv`: Source of truth for product catalog
- `database/schema.sql`: Database schema definition
- `.kiro/specs/smiths-detection-ecommerce/`: Spec files (requirements, design, tasks)

## Import/Export Patterns

### Backend (CommonJS)
```javascript
const express = require('express');
module.exports = { functionName };
```

### Frontend (ES6 Modules)
```javascript
import React from 'react';
export default ComponentName;
```

## Configuration Files

- `backend/.env`: Environment variables (not in git)
- `backend/.env.example`: Template for environment setup
- `backend/jest.config.js`: Jest test configuration
- `frontend/package.json`: React scripts configuration
