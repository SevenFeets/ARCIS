# Jest Testing Guide - ARCIS Project

## 📋 Overview
This guide explains how to set up, run, and maintain Jest unit tests for the ARCIS weapon detection system frontend.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- ARCIS frontend project setup

### Installation
Jest and testing dependencies are already installed. If you need to reinstall:

```bash
cd frontend
npm install
```

## 🧪 Running Tests

### Basic Commands

#### Run All Tests
```bash
npm test
```
**Output:** Runs all test suites once and shows results

#### Watch Mode (Development)
```bash
npm run test:watch
```
**Output:** Continuously watches files and re-runs tests on changes

#### Coverage Report
```bash
npm run test:coverage
```
**Output:** Generates detailed code coverage report in `coverage/` folder

### Command Options

#### Run Specific Test File
```bash
npm test -- apiService.test.ts
```

#### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="API URL"
```

#### Verbose Output
```bash
npm test -- --verbose
```

#### Run Tests in Specific Directory
```bash
npm test -- src/services/__tests__/
```

## 📁 Test Structure

### Current Test Files
```
frontend/src/
├── services/__tests__/
│   └── apiService.test.ts        # API service functions (8 tests)
├── hooks/__tests__/
│   └── useDetections.test.ts     # Custom React hooks (8 tests)
└── utils/__tests__/
    └── helpers.test.ts           # Utility functions (8 tests)
```

### Test Categories
- **JEST-001 to JEST-004:** API Service Tests
- **JEST-005 to JEST-008:** Hook Tests  
- **JEST-009 to JEST-016:** Utility Function Tests

## 🔧 Configuration Files

### Jest Configuration (`jest.config.js`)
```javascript
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/__mocks__/fileMock.js'
  },
  // ... other configurations
};
```

### Setup File (`src/setupTests.ts`)
- Global test setup
- Mock configurations
- Environment variable setup

## 📊 Understanding Test Results

### Successful Test Run
```
Test Suites: 3 passed, 3 total
Tests:       24 passed, 24 total
Snapshots:   0 total
Time:        5.295 s
```

### Test Result Indicators
- ✅ **PASS** - Test passed successfully
- ❌ **FAIL** - Test failed
- ⏭️ **SKIP** - Test was skipped
- 🔄 **RUNS** - Test is currently running

### Coverage Report Interpretation
```
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
apiService.ts       |   85.5  |   80.0   |   90.2  |   88.1  |
useDetections.ts    |   92.3  |   85.7   |   95.4  |   91.8  |
```

## 🐛 Troubleshooting

### Common Issues

#### "Cannot find module" Error
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript Compilation Errors
```bash
# Check TypeScript configuration
npx tsc --noEmit
```

#### Jest Configuration Issues
```bash
# Validate Jest config
npx jest --showConfig
```

### Mock Issues
If mocks aren't working:
1. Check `setupTests.ts` file
2. Verify mock file paths in `jest.config.js`
3. Clear Jest cache: `npx jest --clearCache`

### Environment Variable Issues
Ensure environment variables are set in `setupTests.ts`:
```typescript
Object.defineProperty(process.env, 'VITE_API_URL', {
    value: 'http://localhost:5000'
});
```

## 📝 Writing New Tests

### Test File Naming Convention
- `*.test.ts` or `*.test.tsx`
- `*.spec.ts` or `*.spec.tsx`
- Place in `__tests__/` folder

### Basic Test Structure
```typescript
describe('Component/Function Name', () => {
    beforeEach(() => {
        // Setup before each test
    });

    it('should do something specific', () => {
        // Test implementation
        expect(result).toBe(expected);
    });
});
```

### Mock Examples
```typescript
// Mock functions
const mockFn = jest.fn(() => 'return value');

// Mock modules
jest.mock('../module', () => ({
    functionName: jest.fn()
}));
```

## 🎯 Best Practices

### Test Organization
- Group related tests in `describe` blocks
- Use clear, descriptive test names
- Follow AAA pattern: Arrange, Act, Assert

### Test Coverage Goals
- **Statements:** >80%
- **Branches:** >75%
- **Functions:** >85%
- **Lines:** >80%

### Performance Tips
- Use `--watchAll=false` for specific file watching
- Run tests in parallel (default Jest behavior)
- Use `--maxWorkers=4` for CPU optimization

## 📋 Maintenance

### Regular Tasks
1. **Weekly:** Run full test suite with coverage
2. **Before commits:** Run affected tests
3. **Monthly:** Review and update test cases
4. **Release:** Full test suite + coverage report

### Updating Dependencies
```bash
# Update testing dependencies
npm update @testing-library/react @testing-library/jest-dom jest
```

## 🆘 Support

### Debugging Commands
```bash
# Debug specific test
npm test -- --runInBand --no-cache apiService.test.ts

# Generate detailed error logs
npm test -- --verbose --detectOpenHandles
```

### Useful Jest CLI Options
- `--bail` - Stop after first test failure
- `--silent` - Prevent tests from printing messages
- `--updateSnapshot` - Update snapshots
- `--watchAll` - Watch all files for changes

---

## 📞 Contact
For issues with Jest testing setup, refer to the main project documentation or contact the development team.

**Last Updated:** January 2025  
**Jest Version:** 29.x  
**Testing Framework:** Jest + React Testing Library
