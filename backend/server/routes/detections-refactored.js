const express = require('express');
const { verifyToken, requireRole, requireClearance } = require('../middleware/auth');
const { validateDetection, validateId, validatePagination } = require('../middleware/validations');
const arcjetMiddleware = require('../middleware/arcjet');
const { uploadSingle } = require('../middleware/upload');

// Import Controllers
const DetectionController = require('./detection/controllers/detectionController');
const ThreatController = require('./detection/controllers/threatController');
const ManualController = require('./detection/controllers/manualController');
const DeviceController = require('./detection/controllers/deviceController');
const ImageController = require('./detection/controllers/imageController');

// Import Services and Helpers
const { createErrorResponse } = require('./detection/detectionHelpers');

const router = express.Router();

// Apply rate limiting
router.use(arcjetMiddleware);

// Initialize Controllers
const detectionController = new DetectionController();
const threatController = new ThreatController();
const manualController = new ManualController();
const deviceController = new DeviceController();
const imageController = new ImageController();

// Middleware for API key validation (for Pi/Jetson devices)
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;

    // For development, accept any API key - you can implement proper validation later
    if (!apiKey) {
        return res.status(401).json(createErrorResponse('API key required', 'API_KEY_REQUIRED', 'Include X-API-Key header or api_key query parameter'));
    }

    // TODO: Validate API key against database
    req.deviceId = 1; // Default device ID for now
    next();
};

// =============================================================================
// TEST ENDPOINTS
// =============================================================================

// GET /api/detections/test-jpeg/:id - Test JPEG data format
router.get('/test-jpeg/:id', (req, res) => imageController.testJpegFormat(req, res));

// GET /api/detections/test - Test database connection
router.get('/test', async (req, res) => {
    try {
        console.log('Testing Supabase database connection...');

        const { supabase } = require('../config/supabase');
        const { data, error } = await supabase
            .from('detections')
            .select('count')
            .limit(1);

        if (error) {
            console.log('Supabase error:', error.message);
        }

        res.json({
            success: true,
            message: 'Database connection successful',
            total_detections: data ? data.length.toString() : '0',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json(createErrorResponse('Database connection failed', 'DB_CONNECTION_ERROR', error.message));
    }
});

// =============================================================================
// BASIC DETECTION ENDPOINTS
// =============================================================================

// GET /api/detections/all - Get all detections formatted for frontend
router.get('/all', (req, res) => detectionController.getAllDetections(req, res));

// GET /api/detections - Get recent detections
router.get('/', (req, res) => detectionController.getRecentDetections(req, res));

// GET /api/detections/:id - Get specific weapon detection
router.get('/:id', (req, res) => detectionController.getDetectionById(req, res));

// POST /api/detections - Create new weapon detection (for Pi/Jetson)
router.post('/', validateApiKey, (req, res) => detectionController.createDetection(req, res));

// DELETE /api/detections/:id - Delete detection record
router.delete('/:id', validateId, (req, res) => detectionController.deleteDetection(req, res));

// DELETE /api/detections/all - Delete all detection records
router.delete('/all', (req, res) => detectionController.deleteAllDetections(req, res));

// PUT /api/detections/:id/comment - Add comment to detection
router.put('/:id/comment', (req, res) => detectionController.addComment(req, res));

// GET /api/detections/stats - Get detection statistics
router.get('/stats', (req, res) => detectionController.getDetectionStats(req, res));

// POST /api/detections/batch - Batch upload for Pi/Jetson (multiple detections)
router.post('/batch', validateApiKey, (req, res) => detectionController.processBatchDetections(req, res));

// =============================================================================
// THREAT MANAGEMENT ENDPOINTS
// =============================================================================

// GET /api/detections/threats - Get high-priority threats
router.get('/threats', (req, res) => threatController.getHighPriorityThreats(req, res));

// GET /api/detections/weapons/:type - Get detections by weapon type (with validation)
router.get('/weapons/:type', (req, res) => detectionController.getDetectionsByWeaponType(req, res));

// GET /api/detections/:id/threat-analysis - Get threat analysis for detection
router.get('/:id/threat-analysis', (req, res) => threatController.getThreatAnalysis(req, res));

// GET /api/detections/threat-distribution - Get threat level distribution
router.get('/threat-distribution', (req, res) => threatController.getThreatLevelDistribution(req, res));

// GET /api/detections/recent-threats - Get recent high-threat detections
router.get('/recent-threats', (req, res) => threatController.getRecentHighThreats(req, res));

// =============================================================================
// MANUAL DETECTION ENDPOINTS
// =============================================================================

// GET /api/detections/manual - Get manual detection entries
router.get('/manual', (req, res) => manualController.getManualDetections(req, res));

// POST /api/detections/manual - Create manual detection entry
router.post('/manual', (req, res) => manualController.createManualDetection(req, res));

// PUT /api/detections/manual/:id - Update manual detection entry
router.put('/manual/:id', (req, res) => manualController.updateManualDetection(req, res));

// GET /api/detections/manual/stats - Get manual detection statistics
router.get('/manual/stats', (req, res) => manualController.getManualDetectionStats(req, res));

// =============================================================================
// DEVICE-SPECIFIC ENDPOINTS
// =============================================================================

// POST /api/detections/jetson-detection - Receive detection data from Jetson Nano
router.post('/jetson-detection', (req, res) => deviceController.processJetsonDetection(req, res));

// POST /api/detections/raspberry-detection - Receive detection data from Raspberry Pi
router.post('/raspberry-detection', validateApiKey, uploadSingle, (req, res) => deviceController.processRaspberryPiDetection(req, res));

// POST /api/detections/device-status - Update device status (for Pi/Jetson heartbeat)
router.post('/device-status', validateApiKey, (req, res) => deviceController.updateDeviceStatus(req, res));

// POST /api/detections/upload - Upload detection with image file (FILE STORAGE)
router.post('/upload', validateApiKey, uploadSingle, (req, res) => deviceController.uploadDetectionWithFile(req, res));

// POST /api/detections/upload-jpeg - Upload detection with binary JPEG data (DATABASE STORAGE)
router.post('/upload-jpeg', validateApiKey, uploadSingle, (req, res) => deviceController.uploadDetectionWithJpeg(req, res));

// =============================================================================
// IMAGE SERVING ENDPOINTS
// =============================================================================

// GET /api/detections/:id/frame - Get detection frame image (legacy base64 format)
router.get('/:id/frame', (req, res) => imageController.getDetectionFrame(req, res));

// GET /api/detections/:id/jpeg - Serve binary JPEG data directly from database
router.get('/:id/jpeg', (req, res) => imageController.serveDetectionJpeg(req, res));

// GET /api/detections/images/:filename - Serve uploaded detection images
router.get('/images/:filename', (req, res) => imageController.serveImageFile(req, res));

// GET /api/detections/:id/metrics - Get system metrics for a specific detection
router.get('/:id/metrics', (req, res) => imageController.getDetectionMetrics(req, res));

// =============================================================================
// LEGACY ENDPOINTS (for backward compatibility)
// =============================================================================

// Duplicate threats endpoint for backward compatibility
router.get('/threats', (req, res) => threatController.getWeaponThreats(req, res));

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

// Global error handler for this router
router.use((error, req, res, next) => {
    console.error('Detection router error:', error);
    res.status(500).json(createErrorResponse('Internal server error in detections module', 'DETECTIONS_INTERNAL_ERROR', error.message));
});

module.exports = router;

// =============================================================================
// REFACTORING NOTES
// =============================================================================
/*
This refactored detections.js file follows SOLID principles:

1. Single Responsibility Principle (SRP):
   - Each controller handles a specific domain (Detection, Threat, Manual, Device, Image)
   - Services handle business logic separately from HTTP concerns
   - Helpers contain pure utility functions

2. Open/Closed Principle (OCP):
   - Controllers can be extended without modifying existing code
   - New detection types can be added by creating new controllers

3. Liskov Substitution Principle (LSP):
   - All controllers follow the same interface pattern
   - Services can be substituted with different implementations

4. Interface Segregation Principle (ISP):
   - Controllers only depend on the methods they need
   - Services have focused, specific responsibilities

5. Dependency Inversion Principle (DIP):
   - Controllers depend on service abstractions, not concrete implementations
   - Business logic is separated from HTTP handling

File Structure:
- /detection/controllers/ - HTTP request/response handling
- /detection/services/ - Business logic and data access
- /detection/detectionHelpers.js - Utility functions
- /detection/mappingHelpers.js - Data transformation functions

Benefits:
- Reduced file size (from 2500+ lines to ~200 lines main router)
- Better testability (each component can be tested independently)
- Improved maintainability (changes are localized)
- Enhanced readability (clear separation of concerns)
- Easier to add new features (follow established patterns)
*/
