# Implementation Guide

## Overview

This guide provides a roadmap for implementing the Smiths Detection E-Commerce platform based on the completed specification documents. The implementation is organized into 4 phases with 16 major tasks and 47 sub-tasks.

## Prerequisites

Before starting implementation, ensure you have:

- Node.js 18.x or later installed
- MySQL 8.0 or later installed
- Git for version control
- Code editor (VS Code recommended)
- Basic knowledge of React, Node.js, Express, and MySQL

## Implementation Phases

### Phase 1: Foundation & Database (Tasks 1-2)

**Duration**: 1-2 days

**Objectives**:
- Set up project structure
- Initialize dependencies
- Create database schema
- Implement CSV import functionality

**Key Deliverables**:
- Project directory structure (backend/, frontend/, database/)
- Database tables (products, cart_items) with constraints
- CSV parser for product_list.csv
- ProductService with database operations

**Tasks**:
1. Set up project structure and database schema
2. Implement product data import and backend services
   - 2.1: Create CSV parser
   - 2.2: Write property test for CSV parsing
   - 2.3: Implement ProductService
   - 2.4: Implement product import on startup
   - 2.5: Write property test for product import

**Success Criteria**:
- Database schema created with all constraints
- Products successfully imported from CSV
- ProductService methods working correctly
- Property tests passing for CSV parsing and import

---

### Phase 2: Backend Services & API (Tasks 3-6)

**Duration**: 3-4 days

**Objectives**:
- Implement product API endpoints
- Implement cart service and API endpoints
- Add middleware (error handling, logging, CORS)
- Achieve backend test coverage goals

**Key Deliverables**:
- Product API (GET /api/products, GET /api/products/:id)
- Cart API (GET/POST/PUT/DELETE /api/cart)
- CartService with all operations
- Global error handler
- Request logger
- CORS configuration

**Tasks**:
3. Implement backend API endpoints for products
   - 3.1: Create GET /api/products endpoint
   - 3.2: Create GET /api/products/:id endpoint
   - 3.3: Write unit tests for product endpoints
4. Implement CartService and cart API endpoints
   - 4.1: Create CartService with core operations
   - 4.2: Write property test for cart item creation/update
   - 4.3: Write property test for cart persistence
   - 4.4: Create POST /api/cart endpoint
   - 4.5: Create GET /api/cart endpoint
   - 4.6: Create PUT /api/cart/:id endpoint
   - 4.7: Create DELETE /api/cart/:id endpoint
   - 4.8: Write unit tests for cart endpoints
5. **Checkpoint**: Ensure backend tests pass
6. Implement backend middleware and error handling
   - 6.1: Create global error handler middleware
   - 6.2: Create request logger middleware
   - 6.3: Configure CORS and body parser middleware
   - 6.4: Write property test for error response format

**Success Criteria**:
- All API endpoints functional and tested
- CartService operations working correctly
- Error handling consistent across all endpoints
- Backend tests passing with 80%+ coverage
- Middleware properly configured

---

### Phase 3: Frontend Components (Tasks 7-12)

**Duration**: 4-5 days

**Objectives**:
- Implement API client module
- Create shared components
- Implement page components (HomePage, ProductPage, CartPage)
- Achieve frontend test coverage goals

**Key Deliverables**:
- API client with request wrapper
- Navigation component with cart count
- ProductCard, QuantitySelector, ErrorMessage, LoadingSpinner
- HomePage with product grid
- ProductPage with add-to-cart functionality
- CartPage with cart management

**Tasks**:
7. Implement frontend API client module
   - 7.1: Create API client with request wrapper
   - 7.2: Create productsAPI methods
   - 7.3: Create cartAPI methods
8. Implement shared frontend components
   - 8.1: Create Navigation component
   - 8.2: Write property test for navigation
   - 8.3: Create ProductCard component
   - 8.4: Create QuantitySelector component
   - 8.5: Write property test for quantity selector
   - 8.6: Create ErrorMessage component
   - 8.7: Create LoadingSpinner component
9. Implement HomePage and product browsing
   - 9.1: Create HomePage component
   - 9.2: Write property test for product display
   - 9.3: Write property test for product navigation
   - 9.4: Write unit tests for HomePage
10. Implement ProductPage and add-to-cart functionality
    - 10.1: Create ProductPage component
    - 10.2: Write property test for product detail display
    - 10.3: Write property test for add-to-cart request
    - 10.4: Write property test for add-to-cart feedback
    - 10.5: Write unit tests for ProductPage
11. Implement CartPage and cart management
    - 11.1: Create CartItem component
    - 11.2: Write property test for cart item display
    - 11.3: Create CartPage component
    - 11.4: Write property test for cart retrieval
    - 11.5: Write property test for cart total calculation
    - 11.6: Write property test for cart display reactivity
    - 11.7: Write property test for cart item controls
    - 11.8: Write property test for quantity update request
    - 11.9: Write property test for delete request
    - 11.10: Write unit tests for CartPage
12. **Checkpoint**: Ensure frontend tests pass

**Success Criteria**:
- All components rendering correctly
- User interactions working as expected
- API integration functional
- Frontend tests passing with 80%+ coverage
- All 25 correctness properties validated

---

### Phase 4: Integration & Deployment (Tasks 13-16)

**Duration**: 2-3 days

**Objectives**:
- Wire frontend components together
- Configure routing
- Set up deployment configuration
- Complete integration testing
- Verify all correctness properties

**Key Deliverables**:
- React Router configuration
- Nginx reverse proxy configuration
- Environment configuration files
- Database initialization script
- Complete integration test suite

**Tasks**:
13. Implement frontend routing and integration
    - 13.1: Create App component with React Router
    - 13.2: Wire frontend components together
    - 13.3: Write integration tests for frontend flows
14. Set up deployment configuration
    - 14.1: Create Nginx configuration
    - 14.2: Create environment configuration
    - 14.3: Create database initialization script
15. Final integration and testing
    - 15.1: Test complete system integration
    - 15.2: Verify all correctness properties
16. **Final Checkpoint**: Ensure all tests pass

**Success Criteria**:
- All routes working correctly
- Nginx properly routing requests
- Environment configuration documented
- All integration tests passing
- All 25 correctness properties verified
- System ready for deployment

---

## Testing Strategy

### Property-Based Testing

**Library**: fast-check

**Configuration**:
- Minimum 100 iterations per property test
- Tag format: `Feature: smiths-detection-ecommerce, Property {N}: {description}`

**25 Correctness Properties**:
1. Product Display Completeness
2. Product Navigation
3. CSV Parsing Round-Trip
4. Product Storage Completeness
5. Product Detail Display Completeness
6. Quantity Selector Reactivity
7. Add-to-Cart Request Formation
8. Cart Item Creation or Update
9. Add-to-Cart Success Feedback
10. Cart Persistence Round-Trip
11. Cart Item Storage Completeness
12. Cart Retrieval Completeness
13. Cart Item Display Completeness
14. Cart Total Calculation
15. Cart Display Reactivity
16. Cart Item Update Controls
17. Quantity Update Request Formation
18. Delete Request Formation
19. API Error Response Format
20. Product Import Persistence
21. Navigation Menu Presence
22. Navigation Link Functionality
23. Cart Count Display
24. Frontend Error Display
25. Non-Existent Product Error

### Unit Testing

**Frontend**: React Testing Library + Jest
**Backend**: Jest + Supertest

**Coverage Goals**:
- Line Coverage: 80%+
- Branch Coverage: 75%+
- Function Coverage: 85%+
- Critical Paths: 100%

### Integration Testing

**Test Flows**:
- Complete product browsing flow
- Complete add-to-cart flow
- Complete cart management flow

---

## Development Workflow

### Daily Workflow

1. **Start of Day**:
   - Pull latest changes from repository
   - Review task list in tasks.md
   - Select next task to implement

2. **During Development**:
   - Write failing test first (TDD approach)
   - Implement feature to pass test
   - Refactor if needed
   - Run tests frequently
   - Commit small, focused changes

3. **End of Day**:
   - Run full test suite
   - Update task status in tasks.md
   - Push changes to repository
   - Document any blockers or questions

### Checkpoint Protocol

At each checkpoint (tasks 5, 12, 16):

1. Run full test suite
2. Verify all tests pass
3. Check code coverage meets goals
4. Review code for quality issues
5. Document any issues or concerns
6. Get team review if needed
7. Update task status
8. Proceed to next phase only if checkpoint passes

### Git Workflow

**Branch Strategy**:
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: Feature branches (e.g., `feature/task-3-product-api`)

**Commit Messages**:
```
[Task X.Y] Brief description

- Detailed change 1
- Detailed change 2

Validates: Requirements A.B, C.D
```

**Pull Request Process**:
1. Create PR from feature branch to develop
2. Include task number in PR title
3. Reference requirements validated
4. Ensure all tests pass
5. Request code review
6. Address review comments
7. Merge when approved

---

## Common Patterns

### Backend Service Pattern

```javascript
class ServiceName {
  constructor(db) {
    this.db = db;
  }

  async methodName(params) {
    try {
      // Validate inputs
      // Query database
      // Process results
      // Return data
    } catch (error) {
      // Handle errors
      throw new ServiceError('ERROR_CODE', statusCode);
    }
  }
}
```

### API Endpoint Pattern

```javascript
router.get('/endpoint', async (req, res, next) => {
  try {
    // Validate request
    // Call service method
    // Return success response
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error); // Pass to error handler
  }
});
```

### React Component Pattern

```javascript
function ComponentName({ props }) {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    // Fetch data on mount
    // Cleanup on unmount
  }, [dependencies]);

  const handleAction = async () => {
    try {
      // Call API
      // Update state
      // Show success message
    } catch (error) {
      // Show error message
    }
  };

  return (
    // JSX
  );
}
```

### Property Test Pattern

```javascript
describe('Feature: smiths-detection-ecommerce, Property N: Description', () => {
  it('should verify property holds for all valid inputs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.generator1(),
        fc.generator2(),
        async (input1, input2) => {
          // Setup
          // Execute
          // Verify property holds
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

---

## Troubleshooting

### Common Issues

**Database Connection Fails**:
- Check MySQL is running
- Verify credentials in .env file
- Check database exists
- Verify network connectivity

**CSV Import Fails**:
- Check product_list.csv exists
- Verify CSV format (headers, columns)
- Check file permissions
- Review error logs

**Tests Failing**:
- Run tests individually to isolate issue
- Check test database is clean
- Verify test fixtures are correct
- Review error messages carefully

**Frontend Not Loading**:
- Check backend is running
- Verify API endpoints are accessible
- Check browser console for errors
- Verify CORS configuration

**Cart Operations Failing**:
- Verify product exists before adding to cart
- Check foreign key constraints
- Review database logs
- Test with simple cases first

---

## Resources

### Documentation
- Requirements: `.kiro/specs/smiths-detection-ecommerce/requirements.md`
- Design: `.kiro/specs/smiths-detection-ecommerce/design.md`
- Tasks: `.kiro/specs/smiths-detection-ecommerce/tasks.md`
- API: `docs/API.md`
- Architecture: `docs/ARCHITECTURE.md`
- Deployment: `docs/DEPLOYMENT.md`

### Diagrams
- All diagrams: `generated-diagrams/`
- Implementation roadmap: `generated-diagrams/implementation-roadmap.png`
- Testing strategy: `generated-diagrams/testing-strategy-overview.png`

### External Resources
- React Documentation: https://react.dev/
- Express Documentation: https://expressjs.com/
- MySQL Documentation: https://dev.mysql.com/doc/
- fast-check Documentation: https://fast-check.dev/
- React Testing Library: https://testing-library.com/react

---

## Success Metrics

### Code Quality
- All tests passing
- Code coverage meets goals (80%+ line, 75%+ branch)
- No linter errors
- Code reviewed and approved

### Functionality
- All 14 requirements implemented
- All 25 correctness properties verified
- All user flows working end-to-end
- Error handling comprehensive

### Performance
- API response times < 200ms
- Page load times < 2 seconds
- Database queries optimized
- No memory leaks

### Documentation
- All code documented
- API documentation complete
- Deployment guide accurate
- README up to date

---

## Next Steps After Implementation

1. **User Acceptance Testing**:
   - Test with real users
   - Gather feedback
   - Identify usability issues

2. **Performance Testing**:
   - Load testing
   - Stress testing
   - Optimization

3. **Security Review**:
   - Penetration testing
   - Security audit
   - Vulnerability scanning

4. **Production Deployment**:
   - Set up production environment
   - Configure monitoring
   - Deploy application
   - Monitor for issues

5. **Maintenance Plan**:
   - Bug fix process
   - Feature enhancement process
   - Regular updates
   - Performance monitoring

---

## Support

For questions or issues during implementation:
- Review specification documents first
- Check troubleshooting section
- Consult team members
- Document blockers in tasks.md
- Escalate critical issues promptly
