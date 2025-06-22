# 🧪 ARCIS Testing Implementation Guide

## **Quick Start - Execute Tests in Order**

### **1. POSTMAN API TESTING (Start Here!)**

#### **Setup Postman Environment**
```bash
# Create new Postman environment with these variables:
base_url: http://localhost:5000/api
production_url: https://your-railway-app.up.railway.app/api
api_key: test-api-key-123
valid_detection_id: 1
```

#### **Essential Test Sequence:**
1. **API-001**: `GET {{base_url}}/health` ← Start here
2. **API-003**: `GET {{base_url}}/detections/test` ← Database check
3. **API-004**: `GET {{base_url}}/detections/all` ← Get existing data
4. **API-015**: Create manual detection ← Test data creation
5. **API-020**: Get metrics ← Test extended features

#### **Sample Request Bodies:**

**Manual Detection (API-015):**
```json
{
  "object_type": "Knife",
  "confidence": 0.85,
  "location": "Building A - Entrance",
  "description": "Security officer visual confirmation",
  "officer_id": 1,
  "officer_name": "Officer Johnson",
  "notes": "Test detection for STD validation"
}
```

**Jetson Detection (API-007):**
```json
{
  "detectedObjects": [{
    "class": "weapon",
    "label": "Pistol",
    "confidence": 0.89,
    "bbox": [100, 150, 80, 120]
  }],
  "frame": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "systemMetrics": {
    "cpu_usage": 45.2,
    "gpu_usage": 67.8,
    "ram_usage": 52.1
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "deviceId": "jetson-001"
}
```

---

### **2. JEST UNIT TESTING SETUP**

#### **Install Dependencies:**
```bash
cd frontend
npm install --save-dev jest @testing-library/jest-dom @testing-library/react @testing-library/user-event
```

#### **Create Test Configuration:**

**`frontend/jest.config.js`:**
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx)'
  ],
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/**/*.d.ts',
    '!src/main.tsx'
  ]
};
```

**`frontend/src/setupTests.ts`:**
```typescript
import '@testing-library/jest-dom';

// Mock environment variables
process.env.VITE_API_BASE_URL = 'http://localhost:5000/api';

// Mock ResizeObserver for Chakra UI
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
```

#### **Example Test File - Custom Hook:**

**`frontend/src/hooks/__tests__/useDetections.test.ts`:**
```typescript
import { renderHook, act } from '@testing-library/react';
import { useAllDetections } from '../useDetections';

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({
    data: {
      success: true,
      data: [
        {
          id: 1,
          weapon_type: 'Knife',
          confidence: 85,
          threat_level: 6,
          timestamp: '2024-01-15T10:30:00Z'
        }
      ]
    }
  }))
}));

describe('useAllDetections Hook (JEST-006)', () => {
  test('should return loading state initially', () => {
    const { result } = renderHook(() => useAllDetections(false));
    
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
  });

  test('should fetch detections when called', async () => {
    const { result } = renderHook(() => useAllDetections());
    
    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].weapon_type).toBe('Knife');
    expect(result.current.loading).toBe(false);
  });
});
```

#### **Example Test File - Utility Function:**

**`frontend/src/utils/__tests__/weaponUtils.test.ts`:**
```typescript
import { getThreatLevelColor, getWeaponTypeIcon, formatTimestamp } from '../weaponUtils';

describe('Weapon Utilities (JEST-001 to JEST-005)', () => {
  // JEST-004
  test('getThreatLevelColor returns correct colors', () => {
    expect(getThreatLevelColor(1)).toBe('green.500');
    expect(getThreatLevelColor(5)).toBe('yellow.500');
    expect(getThreatLevelColor(8)).toBe('red.500');
    expect(getThreatLevelColor(10)).toBe('red.700');
  });

  // JEST-003
  test('getWeaponTypeIcon returns correct icons', () => {
    expect(getWeaponTypeIcon('Knife')).toBe('🔪');
    expect(getWeaponTypeIcon('Pistol')).toBe('🔫');
    expect(getWeaponTypeIcon('rifle')).toBe('🔫');
    expect(getWeaponTypeIcon('unknown')).toBe('⚔️');
  });

  // JEST-002
  test('formatTimestamp formats correctly', () => {
    const isoString = '2024-01-15T10:30:00Z';
    const result = formatTimestamp(isoString);
    expect(result).toMatch(/Jan 15, 2024/);
  });
});
```

#### **Run Jest Tests:**
```bash
# Run all unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test useDetections.test.ts
```

---

### **3. REACT TESTING LIBRARY SETUP**

#### **Example Component Test:**

**`frontend/src/components/dashboard/__tests__/DetectionsList.test.tsx`:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import DetectionsList from '../DetectionsList';
import { Detection } from '../../../api/detections';

const mockDetections: Detection[] = [
  {
    id: 1,
    weapon_type: 'Knife',
    confidence: 85,
    threat_level: 6,
    location: 'Building A',
    timestamp: '2024-01-15T10:30:00Z',
    device: 'Camera 1',
    device_id: '1',
    bounding_box: { x: 100, y: 150, width: 50, height: 75 },
    comments: [],
    metadata: {}
  }
];

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ChakraProvider>{children}</ChakraProvider>
);

describe('DetectionsList Component (RTL-001 to RTL-002)', () => {
  // RTL-001
  test('renders detection cards correctly', () => {
    render(
      <TestWrapper>
        <DetectionsList 
          detections={mockDetections} 
          onRefresh={() => {}} 
        />
      </TestWrapper>
    );

    expect(screen.getByText('Knife')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('Building A')).toBeInTheDocument();
  });

  // RTL-011
  test('detection card click opens details', () => {
    render(
      <TestWrapper>
        <DetectionsList 
          detections={mockDetections} 
          onRefresh={() => {}} 
        />
      </TestWrapper>
    );

    const detectionCard = screen.getByText('Knife').closest('div');
    fireEvent.click(detectionCard!);
    
    // Verify detail view opened (look for expanded content)
    expect(screen.getByText(/Confidence:/)).toBeInTheDocument();
  });
});
```

#### **Modal Component Test:**

**`frontend/src/components/dashboard/__tests__/SystemMetricsModal.test.tsx`:**
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import SystemMetricsModal from '../SystemMetricsModal';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SystemMetricsModal Component (RTL-007)', () => {
  test('displays system metrics when opened', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        success: true,
        metrics: {
          cpu_usage: 45,
          gpu_usage: 60,
          ram_usage: 55,
          cpu_temp: 65
        }
      }
    });

    render(
      <ChakraProvider>
        <SystemMetricsModal 
          isOpen={true}
          onClose={() => {}}
          detectionId={1}
        />
      </ChakraProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/CPU Usage/)).toBeInTheDocument();
      expect(screen.getByText(/45%/)).toBeInTheDocument();
      expect(screen.getByText(/GPU Usage/)).toBeInTheDocument();
      expect(screen.getByText(/60%/)).toBeInTheDocument();
    });
  });
});
```

---

### **4. CYPRESS E2E TESTING SETUP**

#### **Install Cypress:**
```bash
cd frontend
npm install --save-dev cypress
npx cypress open
```

#### **Cypress Configuration:**

**`frontend/cypress.config.ts`:**
```typescript
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: false,
    screenshot: false
  },
  env: {
    apiUrl: 'http://localhost:5000/api'
  }
})
```

#### **Example E2E Test:**

**`frontend/cypress/e2e/authentication.cy.ts`:**
```typescript
describe('Authentication Flow (E2E-001 to E2E-005)', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  // E2E-002
  it('should login successfully with valid credentials', () => {
    cy.get('[data-testid="login-button"]').click();
    cy.get('[data-testid="email-input"]').type('test@arcis.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="submit-login"]').click();
    
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-avatar"]').should('be.visible');
  });

  // E2E-005
  it('should redirect to login when accessing protected route', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/auth');
    cy.get('[data-testid="login-modal"]').should('be.visible');
  });
});
```

**`frontend/cypress/e2e/dashboard.cy.ts`:**
```typescript
describe('Dashboard Functionality (E2E-006 to E2E-010)', () => {
  beforeEach(() => {
    // Mock login
    cy.window().then((win) => {
      win.localStorage.setItem('auth-token', 'mock-token');
    });
    cy.visit('/dashboard');
  });

  // E2E-006
  it('should load detections data on dashboard', () => {
    cy.intercept('GET', '**/api/detections/all', {
      fixture: 'detections.json'
    }).as('getDetections');

    cy.wait('@getDetections');
    cy.get('[data-testid="detection-card"]').should('have.length.at.least', 1);
  });

  // E2E-008
  it('should open system metrics modal', () => {
    cy.get('[data-testid="metrics-button"]').first().click();
    cy.get('[data-testid="metrics-modal"]').should('be.visible');
    cy.get('[data-testid="cpu-usage"]').should('contain', '%');
  });
});
```

#### **Cypress Test Data:**

**`frontend/cypress/fixtures/detections.json`:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "weapon_type": "Knife",
      "confidence": 85,
      "threat_level": 6,
      "location": "Building A",
      "timestamp": "2024-01-15T10:30:00Z",
      "device": "Camera 1",
      "device_id": "1",
      "bounding_box": { "x": 100, "y": 150, "width": 50, "height": 75 },
      "comments": [],
      "metadata": {}
    }
  ]
}
```

#### **Run Cypress Tests:**
```bash
# Open Cypress UI
npx cypress open

# Run headless
npx cypress run

# Run specific test
npx cypress run --spec "cypress/e2e/authentication.cy.ts"
```

---

## **🎯 EXECUTION CHECKLIST**

### **Phase 1: API Testing (Day 1)**
- [ ] Set up Postman environment
- [ ] Execute API-001 to API-010 (Core functionality)
- [ ] Document any failing tests
- [ ] Test manual detection creation (API-015)

### **Phase 2: Unit Testing (Day 2)**
- [ ] Set up Jest configuration
- [ ] Create utility function tests (JEST-001 to JEST-005)
- [ ] Test custom hooks (JEST-006 to JEST-012)
- [ ] Achieve >80% test coverage

### **Phase 3: Component Testing (Day 3)**
- [ ] Set up React Testing Library
- [ ] Test dashboard components (RTL-001 to RTL-005)
- [ ] Test user interactions (RTL-011 to RTL-015)
- [ ] Test form functionality (RTL-021 to RTL-025)

### **Phase 4: E2E Testing (Day 4)**
- [ ] Set up Cypress
- [ ] Test authentication flow (E2E-001 to E2E-005)
- [ ] Test dashboard functionality (E2E-006 to E2E-010)
- [ ] Test complete workflows (E2E-021 to E2E-025)

### **Phase 5: Documentation (Day 5)**
- [ ] Update STD with actual results
- [ ] Document any bugs found
- [ ] Create test execution report
- [ ] Plan regression testing schedule

---

## **🚀 QUICK COMMANDS**

```bash
# Start all services for testing
npm run dev          # Frontend (localhost:5173)
cd backend/server && npm start  # Backend (localhost:5000)

# Run all test types
npm test            # Jest unit tests
npx cypress run     # E2E tests
# Postman collection # API tests (manual)

# Generate coverage reports
npm test -- --coverage
npx cypress run --record
```

This implementation guide provides everything you need to execute all 112 test cases from your STD document! 