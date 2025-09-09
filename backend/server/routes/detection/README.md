# Detection Module - Refactored Architecture

This directory contains the refactored detection module that follows SOLID principles and modular architecture. The original 2500+ line `detections.js` file has been broken down into focused, maintainable components.

## 📁 Directory Structure

```
detection/
├── controllers/           # HTTP request/response handling
│   ├── detectionController.js    # Basic CRUD operations
│   ├── threatController.js       # Threat management
│   ├── manualController.js       # Manual detection entries
│   ├── deviceController.js       # Device-specific endpoints
│   └── imageController.js        # Image serving and processing
├── services/             # Business logic layer
│   ├── detectionService.js       # Core detection operations
│   ├── alertService.js           # Alert creation and management
│   └── imageService.js           # Image processing utilities
├── detectionHelpers.js   # Utility functions
├── mappingHelpers.js      # Data transformation functions
├── migrate.js            # Migration script
└── README.md             # This file
```

## 🏗️ Architecture Principles

### SOLID Principles Implementation

1. **Single Responsibility Principle (SRP)**
   - Each controller handles one specific domain
   - Services focus on business logic only
   - Helpers contain pure utility functions

2. **Open/Closed Principle (OCP)**
   - New detection types can be added without modifying existing code
   - Controllers can be extended through inheritance

3. **Liskov Substitution Principle (LSP)**
   - All controllers follow consistent interface patterns
   - Services can be substituted with different implementations

4. **Interface Segregation Principle (ISP)**
   - Controllers only depend on methods they actually use
   - Services have focused, specific responsibilities

5. **Dependency Inversion Principle (DIP)**
   - Controllers depend on service abstractions
   - Business logic is separated from HTTP concerns

## 📋 Component Responsibilities

### Controllers (HTTP Layer)
- **DetectionController**: Basic CRUD operations, batch processing
- **ThreatController**: Threat analysis, risk assessment, threat distribution
- **ManualController**: Manual detection entries by officers
- **DeviceController**: Jetson Nano, Raspberry Pi, and device uploads
- **ImageController**: Image serving, JPEG processing, metrics

### Services (Business Logic Layer)
- **DetectionService**: Core detection operations, database interactions
- **AlertService**: Alert creation, severity calculation, notification logic
- **ImageService**: Image processing, format conversion, validation

### Helpers (Utility Layer)
- **detectionHelpers.js**: Validation, formatting, API responses
- **mappingHelpers.js**: Data transformation, device mapping

## 🔄 Migration Guide

### Automatic Migration
```bash
cd backend/server/routes/detection
node migrate.js
```

### Manual Migration Steps
1. Backup original file: `cp detections.js detections-original-backup.js`
2. Replace with refactored version: `cp detections-refactored.js detections.js`
3. Test all endpoints
4. Update any external imports if needed

### Rollback (if needed)
```bash
cp detections-original-backup.js detections.js
```

## 🧪 Testing Strategy

### Unit Testing
Each component can now be tested independently:
```javascript
// Example: Testing DetectionService
const DetectionService = require('./services/detectionService');
const service = new DetectionService();
// Test individual methods...
```

### Integration Testing
Test controller endpoints with mocked services:
```javascript
// Example: Testing DetectionController
const DetectionController = require('./controllers/detectionController');
// Mock dependencies and test HTTP handlers...
```

## 📊 Benefits of Refactoring

### Before (Monolithic)
- ❌ 2500+ lines in single file
- ❌ Mixed concerns (HTTP, business logic, utilities)
- ❌ Difficult to test individual components
- ❌ Hard to maintain and extend
- ❌ Violation of SOLID principles

### After (Modular)
- ✅ ~200 lines main router + focused modules
- ✅ Clear separation of concerns
- ✅ Each component can be tested independently
- ✅ Easy to add new features
- ✅ Follows SOLID principles
- ✅ Better code reusability
- ✅ Improved maintainability

## 🔗 Endpoint Mapping

All original endpoints are preserved. The refactored structure maintains 100% backward compatibility:

### Basic Detection Operations
- `GET /api/detections` → DetectionController.getRecentDetections()
- `GET /api/detections/:id` → DetectionController.getDetectionById()
- `POST /api/detections` → DetectionController.createDetection()
- `DELETE /api/detections/:id` → DetectionController.deleteDetection()

### Threat Management
- `GET /api/detections/threats` → ThreatController.getHighPriorityThreats()
- `GET /api/detections/weapons/:type` → DetectionController.getDetectionsByWeaponType()

### Manual Entries
- `GET /api/detections/manual` → ManualController.getManualDetections()
- `POST /api/detections/manual` → ManualController.createManualDetection()

### Device Integration
- `POST /api/detections/jetson-detection` → DeviceController.processJetsonDetection()
- `POST /api/detections/raspberry-detection` → DeviceController.processRaspberryPiDetection()

### Image Handling
- `GET /api/detections/:id/frame` → ImageController.getDetectionFrame()
- `GET /api/detections/:id/jpeg` → ImageController.serveDetectionJpeg()

## 🚀 Adding New Features

### Adding a New Controller
1. Create new controller in `controllers/` directory
2. Follow the established pattern (constructor, methods, error handling)
3. Add routes in main `detections.js` file
4. Update this README

### Adding a New Service
1. Create new service in `services/` directory
2. Implement business logic methods
3. Inject service into relevant controllers
4. Add unit tests

### Adding New Utilities
1. Add functions to appropriate helper file
2. Export functions for use in controllers/services
3. Add JSDoc documentation

## 🔧 Development Guidelines

### Code Style
- Use descriptive method names
- Include JSDoc comments for all public methods
- Follow consistent error handling patterns
- Use async/await for database operations

### Error Handling
- Use `createErrorResponse()` helper for consistent error formats
- Include appropriate HTTP status codes
- Log errors with context information
- Provide meaningful error messages

### Testing
- Write unit tests for all services
- Mock external dependencies
- Test error conditions
- Maintain high code coverage

## 📝 Future Improvements

1. **Add TypeScript**: Convert to TypeScript for better type safety
2. **Add Validation Layer**: Implement comprehensive request validation
3. **Add Caching**: Implement Redis caching for frequently accessed data
4. **Add Monitoring**: Add performance monitoring and metrics
5. **Add Documentation**: Generate API documentation from JSDoc comments

## 🤝 Contributing

When making changes:
1. Follow the established architecture patterns
2. Add tests for new functionality
3. Update documentation
4. Ensure backward compatibility
5. Follow SOLID principles
