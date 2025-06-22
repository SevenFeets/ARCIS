# ARCIS Weapon Detection System - Software Test Design (STD)

## 1. Introduction

### 1.1 Purpose
This Software Test Design (STD) document outlines comprehensive testing strategies and test cases for the ARCIS (Advanced Real-time Comprehensive Intelligence System) weapon detection platform. The document covers all critical system components including API endpoints, database operations, user interface functionality, and end-to-end system workflows.

### 1.2 Scope
The testing covers:
- **Backend API Testing** (Postman) - Database integration, endpoint functionality, data validation
- **Frontend Unit Testing** (Jest + React Testing Library) - Component functionality, hooks, utilities
- **Integration Testing** (Cypress) - User workflows, authentication, real-time features
- **End-to-End Testing** (Cypress) - Complete system functionality from detection to alert management

---

## 2. System Overview

### 2.1 System Description
ARCIS is a real-time weapon detection system that processes video feeds from security devices (Jetson Nano, Raspberry Pi) to identify weapons and generate threat alerts. The system provides comprehensive security monitoring through AI-powered detection, manual entry capabilities, user authentication, threat analysis, and reporting dashboard.

**Core Functionality:**
- Real-time weapon detection from video streams
- Automated threat level calculation and alerting
- Manual detection entry by security personnel
- User authentication and role-based access control
- Comprehensive dashboard with analytics and reporting

### 2.2 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ARCIS System Architecture                │
├─────────────────────────────────────────────────────────────┤
│  Detection Devices                                          │
│  ┌───────────┐    ┌──────────────┐    ┌─────────────┐      │
│  │ Jetson    │    │ Raspberry Pi │    │ Manual Entry│      │
│  │ Nano      │────│ + Cloud     │────│ Interface   │      │
│  │ (YOLOv5)  │    │ Vision API   │    │ (Officers)  │      │
│  └───────────┘    └──────────────┘    └─────────────┘      │
│         │                 │                    │           │
│         └─────────────────┼────────────────────┘           │
│                           │                                │
├─────────────────────────────────────────────────────────────┤
│  Backend API Server (Node.js + Express)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Detection   │  │ Authentication│  │ Alert       │        │
│  │ Processing  │  │ & Authorization│  │ Management  │        │
│  │ Routes      │  │ Middleware   │  │ System      │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  Database Layer (PostgreSQL + Supabase)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Detection   │  │ User &      │  │ System      │        │
│  │ Data        │  │ Device      │  │ Metrics     │        │
│  │ Storage     │  │ Management  │  │ Storage     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  Frontend Dashboard (React + TypeScript)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Real-time   │  │ Manual      │  │ Analytics & │        │
│  │ Threat      │  │ Detection   │  │ Reporting   │        │
│  │ Dashboard   │  │ Entry       │  │ Interface   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Key Features
- **Feature 1**: Real-time weapon detection (Knife, Pistol, weapon, rifle) with threat level calculation
- **Feature 2**: Multi-device support (Jetson Nano AI processing, Raspberry Pi with Cloud Vision)
- **Feature 3**: Comprehensive dashboard with threat alerts, system metrics, and manual entry capabilities
- **Feature 4**: Role-based authentication with Firebase integration
- **Feature 5**: Complete audit trail with comments, detection history, and system performance metrics

---

## 3. Test Environment

### 3.1 Hardware Requirements
**Minimum Specifications:**
- **Processor**: Intel i5 4-core 2.4GHz or AMD equivalent
- **Memory**: 8GB RAM (16GB recommended for development)
- **Storage**: 20GB available disk space
- **Network**: Broadband internet connection (100Mbps recommended)
- **Graphics**: Integrated graphics sufficient (dedicated GPU recommended for AI testing)

**Detection Device Requirements:**
- **Jetson Nano**: 4GB RAM, microSD card (64GB+), USB camera
- **Raspberry Pi 4**: 4GB RAM, microSD card (32GB+), Pi camera module

### 3.2 Software Requirements
**Operating System:**
- Windows 10/11, macOS 10.15+, or Ubuntu 18.04+
- Docker support (optional for containerized testing)

**Dependencies:**
- Node.js 18.0+ and npm 8.0+
- PostgreSQL 12+ (or Supabase cloud database)
- Git for version control
- Postman for API testing

**Browsers** (for web interface testing):
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

**Database:**
- PostgreSQL with ARCIS schema
- Supabase cloud database (recommended)
- Redis for session management (optional)

### 3.3 Test Data Requirements
**Sample User Accounts:**
- Admin user: `admin@arcis.com` / `admin123`
- Analyst user: `analyst@arcis.com` / `analyst123`
- Operator user: `operator@arcis.com` / `operator123`

**Test Datasets:**
- Sample weapon detection images (knife, pistol, rifle)
- Mock detection payloads for Jetson/Pi devices
- System metrics test data

**Configuration Files:**
- Environment variables (.env files)
- Database connection strings
- Firebase authentication credentials

---

## 4. Test Strategy

### 4.1 Testing Levels
- **Unit Testing**: Individual functions, utilities, and custom hooks using Jest
- **Integration Testing**: Component interactions and API endpoint testing using React Testing Library
- **System Testing**: End-to-end workflow validation using Cypress
- **User Acceptance Testing**: Validation against security personnel requirements

### 4.2 Testing Types
- **Functional Testing**: Verify weapon detection, alerting, and user management features
- **Performance Testing**: Validate response times under concurrent detection loads
- **Security Testing**: Authentication, authorization, and data protection validation
- **Usability Testing**: Dashboard interface and workflow evaluation
- **Compatibility Testing**: Multi-browser and device compatibility validation

### 4.3 Entry and Exit Criteria

**Entry Criteria:**
- Code development completed for target features
- Backend API endpoints implemented and accessible
- Frontend components developed and integrated
- Test environment prepared with database and dependencies
- Test data and user accounts created

**Exit Criteria:**
- All high and medium priority test cases executed
- Critical and high severity defects resolved
- Performance benchmarks met (API response < 2 seconds)
- Security testing passed with no critical vulnerabilities
- User acceptance criteria validated
- Test coverage >80% for unit tests

---

## 5. Risk Assessment

### 5.1 Testing Risks

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|-------------------|
| Incomplete device integration | High | Medium | Mock device payloads, simulation testing |
| Database connectivity issues | High | Low | Backup Supabase instance, local PostgreSQL |
| Performance under load | Medium | Medium | Performance testing with concurrent users |
| Authentication service outage | High | Low | Firebase backup, local authentication fallback |

### 5.2 Technical Risks
- **AI Model Accuracy**: False positives/negatives in weapon detection
- **Real-time Processing**: Latency in detection pipeline
- **Data Security**: Protection of sensitive detection data
- **System Scalability**: Performance with multiple concurrent devices

---

## 6. Test Schedule

| Phase | Start Date | End Date | Duration | Deliverable |
|-------|------------|----------|----------|-------------|
| Test Planning | Week 1 | Week 1 | 2 days | Test Plan Complete |
| API Testing Setup | Week 1 | Week 1 | 1 day | Postman Collection |
| Unit Testing | Week 2 | Week 2 | 3 days | Jest Test Suite |
| Component Testing | Week 2 | Week 3 | 2 days | RTL Test Suite |
| E2E Testing | Week 3 | Week 3 | 2 days | Cypress Test Suite |
| Performance Testing | Week 4 | Week 4 | 1 day | Performance Report |
| Test Reporting | Week 4 | Week 4 | 1 day | Final Test Report |

---

## 7. Acceptance Criteria

### 7.1 Functional Acceptance
- All weapon types (Knife, Pistol, weapon, rifle) detected correctly
- Threat level calculation accurate within ±1 level
- Manual detection entry saves with complete officer information
- User authentication and authorization working across all roles
- Real-time dashboard updates within 5 seconds of detection

### 7.2 Performance Acceptance
- API response time <2 seconds for 95% of requests
- Dashboard loads within 3 seconds on standard broadband
- System supports minimum 10 concurrent detection devices
- Database queries execute within 500ms average

### 7.3 Quality Acceptance
- Zero critical security vulnerabilities
- Code coverage >80% for all unit tests
- All high-priority test cases pass
- User interface responsive on desktop and tablet devices
- Complete audit trail for all detection activities

---

## 8. TEST CASES

The following sections contain detailed test cases organized by testing framework and scope.

---

## 8.1 POSTMAN API TESTING

### Test Environment Setup
- **Base URL**: `http://localhost:5000/api` (Development) / `https://your-railway-app.up.railway.app/api` (Production)
- **Authentication**: API Key via `X-API-Key` header or Bearer token for user endpoints
- **Database**: PostgreSQL with ARCIS schema

### 8.1.1 Health Check & System Status Tests

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Actual Result |
|--------------|-------------|---------------|------------|------------------|---------------|
| API-001 | Server Health Check | Server running | GET `/health` | Status 200, JSON response with timestamp | |
| API-002 | API Root Endpoint | Server running | GET `/` | Status 200, ARCIS welcome message with endpoints list | |
| API-003 | Database Connection Test | Database connected | GET `/detections/test` | Status 200, connection successful message | |

### 8.1.2 Detection Management Tests

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Actual Result |
|--------------|-------------|---------------|------------|------------------|---------------|
| API-004 | Get All Detections | Database has data | GET `/detections/all` | Status 200, array of detection objects | |
| API-005 | Get Detection by ID | Valid detection exists | GET `/detections/{id}` | Status 200, specific detection object | |
| API-006 | Get Non-existent Detection | Invalid ID | GET `/detections/999999` | Status 404, "Detection not found" error | |
| API-007 | Create Detection via Jetson | Valid payload | POST `/detections/jetson-detection` with weapon data | Status 201, detection created successfully | |
| API-008 | Create Detection via Raspberry Pi | Valid payload | POST `/detections/raspberry-detection` with cloud vision data | Status 201, detection created successfully | |
| API-009 | Invalid Weapon Type | Invalid object_type | POST `/detections/` with invalid weapon type | Status 400, validation error | |
| API-010 | Missing Required Fields | Incomplete payload | POST `/detections/` missing object_type | Status 400, "Missing required fields" error | |

### 8.1.3 Threat Analysis Tests

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Actual Result |
|--------------|-------------|---------------|------------|------------------|---------------|
| API-011 | Get High-Priority Threats | Threats exist in DB | GET `/detections/threats` | Status 200, array of high-threat detections (level ≥6) | |
| API-012 | Get Threats by Weapon Type | Specific weapon detections exist | GET `/detections/weapons/Pistol` | Status 200, filtered detections by weapon type | |
| API-013 | Empty Threats Response | No high threats in DB | GET `/detections/threats` | Status 200, empty threats array | |
| API-014 | Invalid Weapon Type Filter | Invalid weapon type | GET `/detections/weapons/InvalidWeapon` | Status 400, invalid weapon type error | |

### 8.1.4 Manual Detection Entry Tests

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Actual Result |
|--------------|-------------|---------------|------------|------------------|---------------|
| API-015 | Create Manual Detection | User authenticated | POST `/detections/manual` with complete data | Status 201, manual detection created | |
| API-016 | Get Manual Detections | Manual entries exist | GET `/detections/manual` | Status 200, array of manual detection entries | |
| API-017 | Invalid Confidence Value | Out of range confidence | POST `/detections/manual` with confidence > 1.0 | Status 400, validation error | |
| API-018 | Missing Location Field | No location provided | POST `/detections/manual` without location | Status 400, "Missing required fields" error | |
| API-019 | Valid Officer Information | Complete officer data | POST `/detections/manual` with officer_id and officer_name | Status 201, detection with officer info saved | |

### 8.1.5 System Metrics & Frame Data Tests

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Actual Result |
|--------------|-------------|---------------|------------|------------------|---------------|
| API-020 | Get Detection Metrics | Detection with metrics exists | GET `/detections/{id}/metrics` | Status 200, system metrics object | |
| API-021 | Get Detection Frame | Detection with frame data exists | GET `/detections/{id}/frame` | Status 200, base64 encoded frame data | |
| API-022 | Metrics for Non-existent Detection | Invalid detection ID | GET `/detections/999999/metrics` | Status 404, detection not found | |
| API-023 | Frame for Manual Detection | Manual detection (no frame) | GET `/detections/{manual_id}/frame` | Status 200, placeholder frame or null | |

### 8.1.6 Comment & Interaction Tests

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Actual Result |
|--------------|-------------|---------------|------------|------------------|---------------|
| API-024 | Add Comment to Detection | Valid detection exists | PUT `/detections/{id}/comment` with comment data | Status 200, comment added successfully | |
| API-025 | Empty Comment | Blank comment text | PUT `/detections/{id}/comment` with empty comment | Status 400, "Comment text is required" error | |
| API-026 | Delete Detection | Detection exists | DELETE `/detections/{id}` | Status 200, detection deleted successfully | |
| API-027 | Delete Non-existent Detection | Invalid ID | DELETE `/detections/999999` | Status 404, detection not found | |

### 8.1.7 Batch Operations Tests

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Actual Result |
|--------------|-------------|---------------|------------|------------------|---------------|
| API-028 | Batch Detection Upload | Multiple detection objects | POST `/detections/batch` with detections array | Status 200, batch processed successfully | |
| API-029 | Empty Batch Request | No detections array | POST `/detections/batch` with empty array | Status 400, invalid batch format error | |
| API-030 | Mixed Valid/Invalid Batch | Some valid, some invalid detections | POST `/detections/batch` with mixed data | Status 200, partial success with error details | |

### 8.1.8 Device Status Tests

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Actual Result |
|--------------|-------------|---------------|------------|------------------|---------------|
| API-031 | Update Device Status | Valid API key | POST `/detections/device-status` with status data | Status 200, device status updated | |
| API-032 | Missing API Key | No authentication | POST `/detections/device-status` without X-API-Key | Status 401, API key required error | |
| API-033 | Heartbeat with Metrics | Device with system metrics | POST `/detections/device-status` with system_metrics | Status 200, status and metrics updated | |

### 8.1.9 Statistics & Analytics Tests

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Actual Result |
|--------------|-------------|---------------|------------|------------------|---------------|
| API-034 | Get Detection Statistics | Historical data exists | GET `/detections/stats` | Status 200, statistics object with counts and breakdowns | |
| API-035 | Stats with No Data | Empty database | GET `/detections/stats` | Status 200, zero statistics | |
| API-036 | Recent Activity Filter | Data from last 24h | GET `/detections/stats?timeframe=24h` | Status 200, filtered statistics | |

### 8.1.10 Error Handling & Edge Cases

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Actual Result |
|--------------|-------------|---------------|------------|------------------|---------------|
| API-037 | Invalid JSON Payload | Malformed request | POST `/detections/` with invalid JSON | Status 400, JSON parsing error | |
| API-038 | SQL Injection Attempt | Malicious input | GET `/detections/{id}` with SQL injection string | Status 400 or 404, no database compromise | |
| API-039 | Large Payload Test | Oversized request | POST `/detections/` with very large payload | Status 413 or 400, payload too large error | |
| API-040 | Concurrent Requests | Multiple simultaneous requests | Send 10 parallel requests to `/detections/all` | All return Status 200, no conflicts | |

---

## 8.2 POSTMAN COLLECTION SETUP

### Environment Variables
```json
{
  "base_url": "http://localhost:5000/api",
  "api_key": "test-api-key-123",
  "valid_detection_id": "1",
  "invalid_detection_id": "999999"
}
```

### Pre-request Scripts
```javascript
// For authenticated endpoints
pm.request.headers.add({
    key: 'X-API-Key',
    value: pm.environment.get('api_key')
});

// Generate timestamp for test data
pm.globals.set('timestamp', new Date().toISOString());
```

### Test Scripts Examples

#### Health Check Test
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response contains timestamp", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('timestamp');
});
```

#### Detection Creation Test
```javascript
pm.test("Detection created successfully", function () {
    pm.response.to.have.status(201);
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData).to.have.property('detection_id');
    
    // Store detection ID for subsequent tests
    pm.environment.set('last_detection_id', jsonData.detection_id);
});
```

---

## 8.3 JEST UNIT TESTING

### Test Environment Setup
- **Framework**: Jest + React Testing Library
- **Test Files**: `*.test.ts`, `*.test.tsx` in `frontend/src/`
- **Configuration**: `jest.config.js`, `setupTests.ts`

### 8.3.1 Utility Functions Tests

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Actual Result |
|--------------|-------------|---------------|------------|------------------|---------------|
| JEST-001 | Calculate Threat Level Function | Valid weapon type and confidence | Call `calculateThreatLevel('Pistol', 0.85)` | Returns integer 7-8 | |
| JEST-002 | Format Timestamp Function | Valid ISO timestamp | Call `formatTimestamp(isoString)` | Returns readable date string | |
| JEST-003 | Get Weapon Type Icon Function | Valid weapon type | Call `getWeaponTypeIcon('Knife')` | Returns correct icon component | |
| JEST-004 | Threat Level Color Function | Threat level 1-10 | Call `getThreatLevelColor(8)` | Returns appropriate color code | |
| JEST-005 | Invalid Weapon Type Handling | Invalid weapon type | Call utility with invalid type | Returns default/fallback value | |

### 8.3.2 Custom Hooks Tests

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Actual Result |
|--------------|-------------|---------------|------------|------------------|---------------|
| JEST-006 | useAllDetections Hook | Mock API response | Render hook, check loading states | Returns data, loading, error states | |
| JEST-007 | useThreats Hook | Mock threats API | Render hook with immediate=true | Fetches threats on mount | |
| JEST-008 | useCreateManualDetection Hook | Valid form data | Call createManualDetection function | Returns success response | |
| JEST-009 | useAddComment Hook | Valid comment data | Call addComment function | Updates detection with comment | |
| JEST-010 | useDeleteDetection Hook | Valid detection ID | Call deleteDetection function | Removes detection successfully | |
| JEST-011 | useDetectionMetrics Hook | Valid detection ID | Call fetchMetrics function | Returns system metrics data | |
| JEST-012 | Hook Error Handling | Network error | Simulate API failure | Sets error state correctly | |

### 8.3.3 Authentication Context Tests

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Actual Result |
|--------------|-------------|---------------|------------|------------------|---------------|
| JEST-013 | Login Function | Valid credentials | Call login with email/password | Sets currentUser state | |
| JEST-014 | Logout Function | User logged in | Call logout function | Clears currentUser state | |
| JEST-015 | Google Login Function | Mock Google auth | Call loginWithGoogle | Authenticates with Google | |
| JEST-016 | Password Reset Function | Valid email | Call resetPassword | Sends reset email | |
| JEST-017 | Auth State Persistence | User logged in | Refresh page/component | Maintains auth state | |

### 8.3.4 API Service Functions Tests

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Actual Result |
|--------------|-------------|---------------|------------|------------------|---------------|
| JEST-018 | Fetch Detections Service | Mock API response | Call fetchDetections() | Returns detection array | |
| JEST-019 | Create Detection Service | Valid detection data | Call createDetection(data) | Returns created detection | |
| JEST-020 | API Error Handling | Mock 500 error | Call API service function | Throws appropriate error | |
| JEST-021 | Network Timeout Handling | Mock timeout | Call API with delay | Handles timeout gracefully | |
| JEST-022 | Response Data Validation | Invalid API response | Call API service | Validates/sanitizes data | |

### 8.3.5 Component Logic Tests (No UI)

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Actual Result |
|--------------|-------------|---------------|------------|------------------|---------------|
| JEST-023 | Detection Filtering Logic | Array of detections | Filter by weapon type | Returns filtered array | |
| JEST-024 | Statistics Calculation | Detection data | Calculate weapon type stats | Returns correct percentages | |
| JEST-025 | Form Validation Logic | Form data object | Validate manual detection form | Returns validation errors | |
| JEST-026 | Date Range Filtering | Detection timestamps | Filter by date range | Returns detections in range | |
| JEST-027 | Threat Level Sorting | Mixed threat levels | Sort by threat level desc | Returns sorted array | |

---

## 8.4 REACT TESTING LIBRARY - COMPONENT TESTING

### Test Environment Setup
- **Framework**: Jest + React Testing Library
- **Test Location**: `frontend/src/components/**/*.test.tsx`
- **Utilities**: `render`, `screen`, `fireEvent`, `waitFor`

### 8.4.1 Dashboard Components Tests

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Actual Result |
|--------------|-------------|---------------|------------|------------------|---------------|
| RTL-001 | DetectionsList Renders | Mock detections data | Render DetectionsList component | Displays detection cards | |
| RTL-002 | DetectionsList Filtering | Filtered detections | Render with filter applied | Shows only matching detections | |
| RTL-003 | DetectionStats Component | Stats data available | Render DetectionStats | Displays charts and numbers | |
| RTL-004 | ThreatAlerts Component | High-threat detections | Render ThreatAlerts | Shows threat alert cards | |
| RTL-005 | ManualEntryForm Render | Form in empty state | Render ManualEntryForm | Shows all form fields | |

### 8.4.2 Modal Components Tests

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Actual Result |
|--------------|-------------|---------------|------------|------------------|---------------|
| RTL-006 | ExpandThreatModal Opens | Modal props provided | Render modal with isOpen=true | Modal displays threat details | |
| RTL-007 | SystemMetricsModal Data | Metrics data available | Render with detection ID | Shows system metrics | |
| RTL-008 | LoginModal Interaction | Modal open | Type in login form, submit | Calls login function | |
| RTL-009 | Modal Close Functionality | Modal open | Click close button | Calls onClose callback | |
| RTL-010 | Modal Backdrop Click | Modal open | Click outside modal | Modal closes | |

### 8.4.3 User Interaction Tests

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Actual Result |
|--------------|-------------|---------------|------------|------------------|---------------|
| RTL-011 | Detection Card Click | Detection card rendered | Click on detection card | Opens detail view | |
| RTL-012 | Add Comment Button | Detection displayed | Click add comment button | Opens comment form | |
| RTL-013 | Delete Detection Button | Detection with delete permission | Click delete button | Shows confirmation dialog | |
| RTL-014 | System Metrics Button | Detection with metrics | Click metrics button | Opens metrics modal | |
| RTL-015 | Manual Entry Form Submit | Form filled out | Fill form and submit | Calls create function | |

### 8.4.4 Navigation Tests

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Actual Result |
|--------------|-------------|---------------|------------|------------------|---------------|
| RTL-016 | Navbar Renders | User logged in | Render Navbar component | Shows navigation links | |
| RTL-017 | Dashboard Tab Navigation | Dashboard page loaded | Click different tabs | Shows correct tab content | |
| RTL-018 | Login/Logout Flow | Authentication working | Login, then logout | Updates navbar state | |
| RTL-019 | Protected Route Access | User not logged in | Navigate to dashboard | Redirects to login | |
| RTL-020 | Menu Dropdown | User logged in | Click user avatar | Shows dropdown menu | |

### 8.4.5 Form Components Tests

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Actual Result |
|--------------|-------------|---------------|------------|------------------|---------------|
| RTL-021 | Manual Entry Form Validation | Empty form | Submit without required fields | Shows validation errors | |
| RTL-022 | Comment Form Functionality | Valid detection | Type comment and submit | Comment appears in list | |
| RTL-023 | Login Form Validation | Invalid email | Enter invalid email | Shows email format error | |
| RTL-024 | Form Input Changes | Form rendered | Type in input fields | Updates form state | |
| RTL-025 | Form Reset Functionality | Form with data | Click reset button | Clears all form fields | |

---

## 8.5 CYPRESS INTEGRATION & E2E TESTING

### Test Environment Setup
- **Framework**: Cypress
- **Test Location**: `cypress/e2e/`, `cypress/integration/`
- **Base URL**: `http://localhost:5173` (Frontend)
- **API URL**: `http://localhost:5000/api` (Backend)

### 8.5.1 Authentication Flow Tests

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Actual Result |
|--------------|-------------|---------------|------------|------------------|---------------|
| E2E-001 | User Registration | App loaded | Visit register page, fill form, submit | User account created | |
| E2E-002 | User Login | User account exists | Visit login page, enter credentials | User logged in successfully | |
| E2E-003 | Google OAuth Login | Google auth enabled | Click Google login button | Redirects and logs in | |
| E2E-004 | Logout Process | User logged in | Click logout from menu | User logged out, redirected | |
| E2E-005 | Protected Route Access | User not logged in | Navigate to `/dashboard` | Redirected to login page | |

### 8.5.2 Dashboard Functionality Tests

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Actual Result |
|--------------|-------------|---------------|------------|------------------|---------------|
| E2E-006 | Dashboard Data Loading | User logged in | Navigate to dashboard | Detections data loads | |
| E2E-007 | Detection Details View | Detection exists | Click on detection card | Opens detailed view | |
| E2E-008 | System Metrics Modal | Detection with metrics | Click metrics button | Metrics modal opens with data | |
| E2E-009 | Add Comment to Detection | Detection displayed | Add comment to detection | Comment appears immediately | |
| E2E-010 | Delete Detection Flow | Detection exists | Delete detection with confirmation | Detection removed from list | |

### 8.5.3 Manual Detection Entry Tests

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Actual Result |
|--------------|-------------|---------------|------------|------------------|---------------|
| E2E-011 | Create Manual Detection | User on dashboard |  User on dashboard | New detection appears in list | |
| E2E-012 | Manual Entry Validation | Form open | Submit incomplete form | Validation errors appear | |
| E2E-013 | Officer Information Entry | Manual form open | Enter officer details | Officer info saved with detection | |
| E2E-014 | Manual Entry Cancel | Form partially filled | Click cancel button | Form closes without saving | |
| E2E-015 | Batch Manual Entry | Multiple entries needed | Create several manual detections | All entries saved successfully | |

### 8.5.4 Real-time Features Tests

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Actual Result |
|--------------|-------------|---------------|------------|------------------|---------------|
| E2E-016 | Real-time Detection Updates | Dashboard open | API creates new detection | New detection appears automatically | |
| E2E-017 | Threat Alert Notifications | High-threat detection created | Wait for alert | Notification appears on screen | |
| E2E-018 | Auto-refresh Functionality | Dashboard open | Wait for auto-refresh interval | Data refreshes automatically | |
| E2E-019 | Multi-tab Synchronization | Multiple browser tabs | Update in one tab | Other tabs reflect changes | |
| E2E-020 | Connection Loss Handling | Network interrupted | Disconnect network | App shows offline state | |

### 8.5.5 End-to-End Workflow Tests

| Test Case ID | Description | Preconditions | Test Steps | Expected Result | Actual Result |
|--------------|-------------|---------------|------------|------------------|---------------|
| E2E-021 | Complete Detection Workflow | System ready | Device detection → Alert → Response | Full workflow completes | |
| E2E-022 | Manual to Automated Flow | Manual detection exists | Verify with automated detection | System correlation works | |
| E2E-023 | Multi-user Collaboration | Multiple users logged in | Users interact with same detection | Changes sync across users | |
| E2E-024 | Device Integration Test | Pi/Jetson connected | Device sends detection data | Data appears in dashboard | |
| E2E-025 | Complete System Test | All components running | Full system operation test | All features work together | |

---

## 9. TEST EXECUTION SUMMARY

### Postman API Testing: **40 Test Cases**
- ✅ Health checks and system status
- ✅ Detection CRUD operations  
- ✅ Threat analysis and filtering
- ✅ Manual entry functionality
- ✅ System metrics and frame data
- ✅ Error handling and security

### Jest Unit Testing: **22 Test Cases** 
- ✅ Utility functions and calculations
- ✅ Custom React hooks
- ✅ Authentication logic
- ✅ API service functions
- ✅ Component business logic

### React Testing Library: **25 Test Cases**
- ✅ Component rendering
- ✅ User interactions
- ✅ Form functionality
- ✅ Modal behaviors
- ✅ Navigation flows

### Cypress E2E Testing: **25 Test Cases**
- ✅ Authentication workflows
- ✅ Dashboard functionality
- ✅ Manual detection entry
- ✅ Real-time features
- ✅ Complete system workflows

### **Total: 112 Comprehensive Test Cases**

This STD provides complete test coverage for your ARCIS weapon detection system across all testing levels and meets both academic formal requirements and practical implementation needs.