# ARCIS Weapon Detection System - Tests

This directory contains all tests for the ARCIS (Advanced Real-time Combat Intelligence System) weapon detection backend.

## 🎯 **System Focus**

The ARCIS system is designed to detect **4 specific weapon types**:
- `Knife` - Threat Level: 6 (Medium-high)
- `Pistol` - Threat Level: 8 (High)  
- `weapon` - Threat Level: 7 (High, generic)
- `rifle` - Threat Level: 10 (Maximum)

## 📁 **Test Files**

### 🔫 **Core Tests**
- **`testWeaponDetection.js`** - Main weapon detection system test
- **`testDatabase.js`** - Database operations and schema tests
- **`testServer.js`** - API server and routes tests
- **`testMiddleware.js`** - Authentication and validation tests

### 🛠️ **Utility Tests**
- **`checkDatabase.js`** - Check current database state
- **`initializeOnly.js`** - Initialize database schema only
- **`testSchemaAccess.js`** - Validate schema access
- **`runAllTests.js`** - Test runner for all tests

## 🚀 **Running Tests**

### **Run All Tests**
```bash
# Run complete test suite
node test/runAllTests.js

# Or using npm (if configured)
npm test
```

### **Run Individual Tests**
```bash
# Weapon detection system (recommended)
node test/testWeaponDetection.js

# Database tests
node test/testDatabase.js

# Server API tests
node test/testServer.js

# Middleware tests
node test/testMiddleware.js
```

### **Utility Commands**
```bash
# Check database state
node test/checkDatabase.js

# Initialize schema only
node test/initializeOnly.js

# Test schema access
node test/testSchemaAccess.js
```

## 📊 **Test Coverage**

### **Weapon Detection Tests**
- ✅ Database connection and schema
- ✅ All 4 weapon types (Knife, Pistol, weapon, rifle)
- ✅ Threat level calculation
- ✅ Automatic alert creation
- ✅ Weapon type validation
- ✅ Detection statistics
- ✅ Alert management

### **Database Tests**
- ✅ Connection and authentication
- ✅ Schema initialization
- ✅ CRUD operations for all tables
- ✅ Data integrity and constraints
- ✅ Views and indexes

### **API Tests**
- ✅ Detection endpoints (`/api/detections/*`)
- ✅ Alert endpoints (`/api/alerts/*`)
- ✅ Authentication and authorization
- ✅ Input validation
- ✅ Error handling

### **Middleware Tests**
- ✅ Rate limiting (100 requests/minute)
- ✅ JWT authentication
- ✅ Input validation
- ✅ Security headers

## 🎯 **Expected Results**

When all tests pass, you should see:
```
🎉 ALL WEAPON DETECTION TESTS PASSED! 🎉

📊 Test Summary:
   • Weapon types tested: Knife, Pistol, weapon, rifle
   • Total detections: 4
   • High-threat alerts: 2-4 (depending on random threat levels)
   • Active alerts: 2-4
   • Validation: Working correctly

🔫 ARCIS Weapon Detection System is OPERATIONAL! 🔫
```

## 🔧 **Prerequisites**

Before running tests, ensure:
1. PostgreSQL is running
2. Database credentials are set in `.env`
3. Required npm packages are installed
4. Database user has necessary permissions

## 🐛 **Troubleshooting**

### **Common Issues**

**Database Connection Failed**
```bash
# Check PostgreSQL status
# Windows: net start postgresql
# Check .env file has correct credentials
```

**Schema Already Exists**
```bash
# This is normal - tests will skip initialization
# To reset: DROP SCHEMA arcis CASCADE; in PostgreSQL
```

**Rate Limiting Tests**
```bash
# Use Postman or curl for rate limiting tests
# Tests require 100+ rapid requests
```

## 📈 **Performance Benchmarks**

- Database queries: < 50ms average
- Detection processing: < 100ms
- Alert creation: < 200ms
- Full test suite: < 30 seconds

## 🔐 **Security Testing**

The tests verify:
- SQL injection prevention
- Input validation
- Authentication requirements
- Rate limiting effectiveness
- Data sanitization

---

**Ready to test your ARCIS weapon detection system!** 🎯 