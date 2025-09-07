# Cypress E2E Testing - ARCIS Project

## 🎯 Overview
This directory contains end-to-end (E2E) tests for the ARCIS weapon detection system using Cypress. These tests verify complete user workflows from the browser perspective.

## 📁 Directory Structure
```
cypress/
├── e2e/                    # E2E test files
│   ├── auth.cy.ts         # Authentication tests (4 tests)
│   ├── navigation.cy.ts   # Navigation tests (4 tests)
│   ├── dashboard.cy.ts    # Dashboard tests (4 tests)
│   ├── api-integration.cy.ts # API integration tests (4 tests)
│   └── user-workflows.cy.ts  # Complete workflows (9 tests)
├── fixtures/              # Test data
│   ├── testData.json     # User credentials & test data
│   └── largeDataset.json # Performance testing data
└── support/               # Support files
    ├── commands.ts       # Custom Cypress commands
    ├── e2e.ts           # E2E test setup
    └── component.ts     # Component test setup (optional)
```

## 🚀 Quick Start

### 1. Prerequisites
Make sure the following are running:
- ✅ Frontend: `http://localhost:5173` (Vite dev server)
- ✅ Backend API: `http://localhost:5000` or deployed version
- ✅ Test user account configured

### 2. Start Cypress
```bash
# Interactive mode (recommended for development)
npm run cypress:open

# Headless mode (for CI/CD)
npm run cypress:run
```

### 3. First Test Run
1. Run `npm run cypress:open`
2. Click "E2E Testing"
3. Choose your browser (Chrome recommended)
4. Click on any test file (start with `auth.cy.ts`)
5. Watch the test execute!

## 🧪 Test Categories

### Authentication Tests (`auth.cy.ts`)
- **CYP-001:** User login flow
- **CYP-002:** User registration
- **CYP-003:** Password reset
- **CYP-004:** Logout functionality

### Navigation Tests (`navigation.cy.ts`)
- **CYP-005:** Main navigation
- **CYP-006:** Protected route access
- **CYP-007:** Responsive navigation
- **CYP-008:** Breadcrumb navigation

### Dashboard Tests (`dashboard.cy.ts`)
- **CYP-009:** Dashboard loading
- **CYP-010:** Real-time updates
- **CYP-011:** Detection filtering
- **CYP-012:** Detection details modal

### API Integration Tests (`api-integration.cy.ts`)
- **CYP-013:** API health check
- **CYP-014:** Detection API integration
- **CYP-015:** API authentication
- **CYP-016:** Data persistence

### User Workflows (`user-workflows.cy.ts`)
- **CYP-017:** Complete detection review
- **CYP-018:** Manual detection entry
- **CYP-019:** System metrics workflow
- **CYP-020:** Search and filter workflow
- **CYP-021:** Export and reporting
- **CYP-022:** User profile management
- **CYP-023:** Error recovery
- **CYP-024:** Mobile responsive
- **CYP-025:** Performance testing

## 🛠️ Custom Commands

### Available Commands
```typescript
// Login with specific credentials
cy.login('email@example.com', 'password')

// Login as predefined test user
cy.loginAsTestUser()

// Wait for API responses
cy.waitForApiResponse()

// Check dashboard elements are loaded
cy.checkDashboardElements()
```

### Usage Example
```typescript
describe('My Test', () => {
  beforeEach(() => {
    cy.loginAsTestUser()
    cy.visit('/dashboard')
  })

  it('should display dashboard', () => {
    cy.checkDashboardElements()
  })
})
```

## 📊 Running Tests

### Development Workflow
```bash
# Start interactive mode
npm run cypress:open

# Run specific test file
npx cypress run --spec "cypress/e2e/auth.cy.ts"

# Run with browser visible
npx cypress run --headed

# Run with specific browser
npx cypress run --browser chrome
```

### CI/CD Pipeline
```bash
# Run all tests headless
npm run cypress:run

# Run with recording (if Cypress Cloud configured)
npx cypress run --record

# Run specific environment
npx cypress run --env API_URL=https://api.staging.com
```

## 🔧 Configuration

### Environment Variables
Set in `cypress.config.ts`:
```typescript
env: {
  API_URL: 'http://localhost:5000/api',
  DEPLOYED_URL: 'https://arcis-production.up.railway.app/api'
}
```

### Test Data
Update `fixtures/testData.json`:
```json
{
  "users": {
    "testUser": {
      "email": "test@arcis.com",
      "password": "testpassword123"
    }
  },
  "api": {
    "baseUrl": "http://localhost:5000/api",
    "apiKey": "test-api-key-123"
  }
}
```

## 🎯 Writing New Tests

### Test File Template
```typescript
/// <reference types="cypress" />

describe('Feature Name', () => {
  beforeEach(() => {
    cy.loginAsTestUser()
    cy.visit('/page')
  })

  describe('Sub-feature', () => {
    it('should do something specific', () => {
      cy.get('[data-testid="element"]').should('be.visible')
      cy.get('[data-testid="button"]').click()
      cy.url().should('include', '/expected-path')
    })
  })
})
```

### Best Practices
1. **Use data-testid attributes** for reliable element selection
2. **Group related tests** in describe blocks
3. **Use beforeEach** for common setup
4. **Write descriptive test names**
5. **Test complete user workflows**

### Adding data-testid to Components
```jsx
// In your React components
<button data-testid="login-button">Login</button>
<div data-testid="dashboard">Dashboard Content</div>
<form data-testid="contact-form">Contact Form</form>
```

## 🐛 Troubleshooting

### Common Issues

#### Tests Won't Start
```bash
# Check if Cypress is installed
npx cypress verify

# Check if frontend is running
curl http://localhost:5173

# Check if backend is running
curl http://localhost:5000/api/health
```

#### Element Not Found
```typescript
// Wait for element with timeout
cy.get('[data-testid="element"]', { timeout: 10000 }).should('exist')

// Wait for loading to finish
cy.get('[data-testid="loading"]').should('not.exist')
```

#### API Connection Issues
```typescript
// Check API health in test
cy.request('GET', `${Cypress.env('API_URL')}/health`)
  .then((response) => {
    expect(response.status).to.eq(200)
  })
```

### Debug Mode
```bash
# Run with debug info
npx cypress run --headed --no-exit

# Open browser console
npx cypress open --e2e

# Clear cache
npx cypress cache clear
```

## 📈 Test Results

### Success Metrics
- ✅ **25 E2E Tests** covering critical user paths
- ✅ **Authentication flows** fully tested
- ✅ **API integration** verified
- ✅ **Mobile responsiveness** confirmed
- ✅ **Error handling** validated

### Expected Results
All tests should pass with:
- Authentication working correctly
- Navigation functioning properly
- Dashboard loading and updating
- API calls successful
- User workflows complete end-to-end

## 🔄 Maintenance

### Regular Tasks
- **Weekly:** Run full test suite
- **Before releases:** Test on staging environment
- **Monthly:** Update test data and selectors
- **Quarterly:** Update Cypress version

### Updating Tests
```bash
# Update Cypress
npm update cypress

# Update testing library
npm update @testing-library/cypress
```

## 📚 Resources

### Documentation
- [Cypress Documentation](https://docs.cypress.io/)
- [Testing Library Cypress](https://testing-library.com/docs/cypress-testing-library/intro/)
- [Best Practices](https://docs.cypress.io/guides/references/best-practices)

### Commands Reference
```bash
npm run cypress:open      # Interactive mode
npm run cypress:run       # Headless mode
npm run e2e              # E2E tests only
npm run e2e:open         # E2E interactive mode
npx cypress info         # System information
npx cypress verify       # Verify installation
```

---

## 🎉 Getting Started Checklist

- [ ] Frontend running on `http://localhost:5173`
- [ ] Backend API accessible
- [ ] Test user account configured
- [ ] Run `npm run cypress:open`
- [ ] Select "E2E Testing"
- [ ] Choose browser
- [ ] Click on `auth.cy.ts` to run first test
- [ ] Verify tests pass ✅

**Happy Testing!** 🚀

*Last Updated: January 2025*
