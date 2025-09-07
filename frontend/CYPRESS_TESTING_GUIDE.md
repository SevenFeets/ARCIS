# Cypress E2E Testing Guide - ARCIS Project

## 📋 Overview
This guide explains how to set up, run, and maintain Cypress end-to-end tests for the ARCIS weapon detection system.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Frontend application running on `http://localhost:5173`
- Backend API running on `http://localhost:5000` or deployed version
- Test user account with credentials

### Installation
Cypress and dependencies are already installed. If you need to reinstall:

```bash
cd frontend
npm install
```

## 🧪 Running Tests

### Interactive Mode (Recommended for Development)
```bash
npm run cypress:open
```
**Output:** Opens Cypress Test Runner with visual interface

### Headless Mode (CI/CD)
```bash
npm run cypress:run
```
**Output:** Runs all tests in headless mode with terminal output

### E2E Tests Only
```bash
npm run e2e
```
**Output:** Runs only E2E tests in headless mode

### Specific Test File
```bash
npx cypress run --spec "cypress/e2e/auth.cy.ts"
```

### With Specific Browser
```bash
npx cypress run --browser chrome
```

## 📁 Test Structure

### Test Files Organization
```
frontend/cypress/
├── e2e/
│   ├── auth.cy.ts              # Authentication tests (CYP-001 to CYP-004)
│   ├── navigation.cy.ts        # Navigation tests (CYP-005 to CYP-008)
│   ├── dashboard.cy.ts         # Dashboard tests (CYP-009 to CYP-012)
│   ├── api-integration.cy.ts   # API tests (CYP-013 to CYP-016)
│   └── user-workflows.cy.ts    # Workflow tests (CYP-017 to CYP-025)
├── fixtures/
│   ├── testData.json          # Test data and configurations
│   └── largeDataset.json      # Large dataset for performance testing
└── support/
    ├── commands.ts            # Custom Cypress commands
    ├── e2e.ts                 # E2E test setup
    └── component.ts           # Component test setup
```

### Test Categories
- **CYP-001 to CYP-004:** Authentication & User Management
- **CYP-005 to CYP-008:** Navigation & Routing
- **CYP-009 to CYP-012:** Dashboard Functionality
- **CYP-013 to CYP-016:** API Integration
- **CYP-017 to CYP-025:** Complete User Workflows

## 🔧 Configuration

### Cypress Configuration (`cypress.config.ts`)
```typescript
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    video: true,
    screenshot: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    env: {
      API_URL: 'http://localhost:5000/api',
      DEPLOYED_URL: 'https://arcis-production.up.railway.app/api'
    }
  }
})
```

### Environment Variables
Set in `cypress.config.ts` or via command line:
```bash
npx cypress run --env API_URL=http://localhost:5000/api
```

## 🎯 Custom Commands

### Available Custom Commands
```typescript
// Login with credentials
cy.login('email@example.com', 'password')

// Login as test user
cy.loginAsTestUser()

// Wait for API response
cy.waitForApiResponse()

// Check dashboard elements
cy.checkDashboardElements()
```

### Usage Examples
```typescript
describe('Dashboard Tests', () => {
  beforeEach(() => {
    cy.loginAsTestUser()
    cy.visit('/dashboard')
  })

  it('should display dashboard', () => {
    cy.checkDashboardElements()
  })
})
```

## 📊 Understanding Test Results

### Test Runner Interface
- **Green ✅** - Test passed
- **Red ❌** - Test failed
- **Yellow ⚠️** - Test skipped
- **Blue 🔄** - Test running

### Command Log
- Each Cypress command is logged with timing
- Failed commands are highlighted in red
- Hover over commands to see DOM snapshots

### Screenshots and Videos
- Screenshots taken on test failures
- Videos recorded for all test runs
- Located in `cypress/screenshots/` and `cypress/videos/`

## 🐛 Troubleshooting

### Common Issues

#### Application Not Running
```bash
# Start frontend
npm run dev

# Start backend (if testing locally)
cd ../backend/server
npm start
```

#### Element Not Found
```typescript
// Wait for element to exist
cy.get('[data-testid="element"]', { timeout: 10000 }).should('exist')

// Use more specific selectors
cy.get('[data-testid="specific-element"]').should('be.visible')
```

#### API Connection Issues
```typescript
// Check API health before tests
cy.request('GET', `${Cypress.env('API_URL')}/health`)
```

#### Timing Issues
```typescript
// Use proper waits
cy.intercept('GET', '/api/**').as('apiCall')
cy.wait('@apiCall')

// Wait for specific conditions
cy.get('[data-testid="loading"]').should('not.exist')
```

### Debugging Commands
```bash
# Run with debug mode
npx cypress run --headed --no-exit

# Run specific test with browser console
npx cypress open --e2e

# Clear cache and run
npx cypress cache clear && npm run cypress:run
```

## 📝 Writing New Tests

### Test File Structure
```typescript
/// <reference types="cypress" />

describe('Feature Tests', () => {
  beforeEach(() => {
    // Setup before each test
    cy.loginAsTestUser()
    cy.visit('/page')
  })

  describe('Sub-feature Tests', () => {
    it('should do something specific', () => {
      // Test implementation
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
4. **Write descriptive test names** that explain what's being tested
5. **Test user workflows** end-to-end, not just individual features

### Data Test IDs
Add to your React components:
```jsx
<button data-testid="login-button">Login</button>
<div data-testid="dashboard">Dashboard Content</div>
```

## 🚦 Test Execution Strategy

### Local Development
```bash
# Quick test run
npm run cypress:open

# Full test suite
npm run cypress:run
```

### CI/CD Pipeline
```bash
# Headless with recording
npm run cypress:headless

# Specific environment
npx cypress run --env API_URL=https://api.production.com
```

### Test Data Management
- Use fixtures for consistent test data
- Clean up test data after runs
- Use unique identifiers for test data

## 📋 Maintenance

### Regular Tasks
1. **Weekly:** Run full E2E test suite
2. **Before releases:** Complete test run on staging
3. **Monthly:** Review and update test selectors
4. **Quarterly:** Update Cypress version and dependencies

### Updating Dependencies
```bash
# Update Cypress
npm update cypress

# Update testing library
npm update @testing-library/cypress
```

### Performance Optimization
```bash
# Run tests in parallel (Cypress Cloud)
npx cypress run --record --parallel

# Optimize test execution
npx cypress run --headless --browser electron
```

## 🎯 Test Coverage Goals

### E2E Test Coverage
- **Critical User Paths:** 100%
- **Authentication Flows:** 100%
- **API Integration:** 95%
- **UI Components:** 85%
- **Error Scenarios:** 80%

### Success Metrics
- **Test Reliability:** >95% pass rate
- **Execution Time:** <10 minutes for full suite
- **Flaky Tests:** <2% of total tests
- **Bug Detection:** E2E tests catch issues before production

## 📞 Support and Resources

### Useful Commands
```bash
# Generate test code
npx cypress open

# Test specific URL
npx cypress run --config baseUrl=https://staging.example.com

# Debug failing tests
npx cypress run --headed --browser chrome
```

### Environment Setup
```bash
# Development
export CYPRESS_baseUrl=http://localhost:5173
export CYPRESS_API_URL=http://localhost:5000/api

# Staging
export CYPRESS_baseUrl=https://staging.arcis.com
export CYPRESS_API_URL=https://api-staging.arcis.com
```

---

## 📝 Test Results Documentation

### Expected Test Results
All 25 Cypress E2E tests should pass with:
- ✅ Authentication flows working
- ✅ Navigation and routing functional
- ✅ Dashboard loading and updating
- ✅ API integration successful
- ✅ User workflows complete end-to-end

**Last Updated:** January 2025  
**Cypress Version:** 15.x  
**Test Framework:** Cypress + Testing Library
