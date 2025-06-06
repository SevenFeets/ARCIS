const express = require('express');
const { verifyToken, requireRole, requireClearance } = require('../middleware/auth');
const { validateDetection, validateId, validatePagination } = require('../middleware/validations');
const { dbUtils } = require('../config/db');
const arcjetMiddleware = require('../middleware/arcjet');

const router = express.Router();

// Apply rate limiting
router.use(arcjetMiddleware);

// GET /api/detections/test - Test database connection
router.get('/test', async (req, res) => {
    try {
        console.log('Testing database connection...');
        const result = await dbUtils.query('SELECT COUNT(*) as count FROM detections');

        res.json({
            success: true,
            message: 'Database connection successful',
            total_detections: result.rows[0].count,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json({
            success: false,
            error: 'Database connection failed',
            details: error.message
        });
    }
});

// POST /api/detections/incoming - Receive weapon detection from Jetson Nano (DEBUG VERSION)
router.post('/incoming', async (req, res) => {
    try {
        console.log('=== INCOMING DETECTION REQUEST ===');
        console.log('Request body:', JSON.stringify(req.body, null, 2));

        const {
            device_id,
            object_type,        // 'Knife', 'Pistol', 'weapon', 'rifle'
            confidence,         // 0.0 to 1.0
            bounding_box,       // {x, y, width, height}
            image_path,         // optional: path to saved detection image
            metadata           // additional detection data
        } = req.body;

        // Validate required fields
        if (!device_id || !object_type || confidence === undefined) {
            console.log('Validation failed: Missing required fields');
            return res.status(400).json({
                error: 'Missing required detection data',
                code: 'MISSING_DETECTION_DATA'
            });
        }

        // Validate weapon type
        const validWeaponTypes = ['Knife', 'Pistol', 'weapon', 'rifle'];
        if (!validWeaponTypes.includes(object_type)) {
            console.log('Validation failed: Invalid weapon type');
            return res.status(400).json({
                error: `Invalid weapon type: ${object_type}. Must be one of: ${validWeaponTypes.join(', ')}`,
                code: 'INVALID_WEAPON_TYPE'
            });
        }

        // Calculate threat level based on weapon type and confidence
        const threatLevel = calculateThreatLevel(object_type, confidence);
        console.log('Calculated threat level:', threatLevel);

        // Test database connection first
        try {
            console.log('Testing database connection...');
            const testResult = await dbUtils.query('SELECT 1 as test');
            console.log('Database connection test passed:', testResult.rows);
        } catch (dbTestError) {
            console.error('=== Database Connection Test Failed ===');
            console.error('Error name:', dbTestError.name);
            console.error('Error message:', dbTestError.message);
            console.error('Error code:', dbTestError.code);
            console.error('Error stack:', dbTestError.stack);
            throw new Error(`Database connection failed: ${dbTestError.message}`);
        }

        // Create detection record directly in database (simplified)
        console.log('Creating detection with data:', {
            object_type,
            confidence,
            threatLevel,
            device_id
        });

        let detection;
        try {
            const detectionQuery = `
                INSERT INTO arcis.detections 
                (frame_id, object_category, object_type, confidence, bounding_box, threat_level, metadata) 
                VALUES ($1, $2, $3, $4, $5, $6, $7) 
                RETURNING *
            `;

            const detectionParams = [
                null, // frame_id - allow NULL for direct incoming detections
                'weapon', // object_category
                object_type,
                confidence,
                JSON.stringify(bounding_box || {}),
                threatLevel,
                JSON.stringify({
                    device_id,
                    image_path,
                    timestamp: new Date().toISOString(),
                    ...metadata
                })
            ];

            console.log('Detection query params:', detectionParams);

            const detectionResult = await dbUtils.query(detectionQuery, detectionParams);
            detection = detectionResult.rows[0];
            console.log('Detection created successfully with ID:', detection.detection_id);

        } catch (detectionError) {
            console.error('Detection creation failed:', detectionError);
            throw new Error(`Detection creation failed: ${detectionError.message}`);
        }

        res.status(201).json({
            success: true,
            message: 'Weapon detection processed successfully',
            detection_id: detection.detection_id,
            weapon_type: object_type,
            threat_level: threatLevel,
            confidence: Math.round(confidence * 100),
            debug: true
        });

    } catch (error) {
        console.error('=== INCOMING DETECTION ERROR ===');
        console.error('Error details:', error);
        console.error('Error stack:', error.stack);

        res.status(500).json({
            success: false,
            error: 'Failed to process weapon detection',
            code: 'DETECTION_PROCESSING_ERROR',
            debug_message: error.message
        });
    }
});

// GET /api/detections - Get all weapon detections (simplified)
router.get('/', async (req, res) => {
    try {
        console.log('GET /api/detections called');

        // Simple query to get all detections
        const result = await dbUtils.query('SELECT * FROM arcis.detections ORDER BY detection_id DESC LIMIT 50');
        const detections = result.rows;

        console.log(`Found ${detections.length} detections`);

        res.json({
            success: true,
            data: detections,
            count: detections.length,
            message: detections.length === 0 ? 'No detections found' : `Found ${detections.length} detections`
        });

    } catch (error) {
        console.error('Get detections error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve detections',
            details: error.message
        });
    }
});

// GET /api/detections/threats - Get current weapon threats (high priority)
router.get('/threats', async (req, res) => {
    try {
        const threats = await dbUtils.detections.getHighThreat(6); // threat level 6+

        res.json({
            active_weapon_threats: threats,
            threat_count: threats.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Get weapon threats error:', error);
        res.status(500).json({
            error: 'Failed to retrieve weapon threats',
            code: 'GET_THREATS_ERROR'
        });
    }
});

// needs to add verifyToken, requireClearance(3)

// GET /api/detections/weapons/:type - Get detections by weapon type
router.get('/weapons/:type', async (req, res) => {
    try {
        const weaponType = req.params.type;

        // Validate weapon type
        const validWeaponTypes = ['Knife', 'Pistol', 'weapon', 'rifle'];
        if (!validWeaponTypes.includes(weaponType)) {
            return res.status(400).json({
                error: `Invalid weapon type: ${weaponType}. Must be one of: ${validWeaponTypes.join(', ')}`,
                code: 'INVALID_WEAPON_TYPE'
            });
        }

        const weapons = await dbUtils.detections.getByWeaponType(weaponType);

        res.json({
            weapon_type: weaponType,
            detections: weapons,
            count: weapons.length
        });

    } catch (error) {
        console.error('Get weapons by type error:', error);
        res.status(500).json({
            error: 'Failed to retrieve weapon detections by type',
            code: 'GET_WEAPONS_BY_TYPE_ERROR'
        });
    }
});

// GET /api/detections/:id - Get specific weapon detection
router.get('/:id', verifyToken, requireClearance(2), validateId, async (req, res) => {
    try {
        const detection = await dbUtils.detections.findById(req.params.id);

        if (!detection) {
            return res.status(404).json({
                error: 'Weapon detection not found',
                code: 'DETECTION_NOT_FOUND'
            });
        }

        // Get weapon-specific details
        const weaponDetails = await dbUtils.weapons.findByDetection(req.params.id);

        res.json({
            detection,
            weapon_details: weaponDetails
        });

    } catch (error) {
        console.error('Get weapon detection error:', error);
        res.status(500).json({
            error: 'Failed to retrieve weapon detection',
            code: 'GET_DETECTION_ERROR'
        });
    }
});

// PUT /api/detections/:id/verify - Verify/confirm weapon detection (analyst review)
router.put('/:id/verify', verifyToken, requireRole(['analyst', 'commander', 'admin']), validateId, async (req, res) => {
    try {
        const { verified, notes, threat_level_adjustment } = req.body;
        const analystId = req.user.user_id;

        // Create annotation record
        const detection = await dbUtils.detections.findById(req.params.id);
        if (!detection) {
            return res.status(404).json({
                error: 'Weapon detection not found',
                code: 'DETECTION_NOT_FOUND'
            });
        }

        // Log the verification
        await dbUtils.query(
            'INSERT INTO detection_annotations (detection_id, user_id, previous_threat_level, new_threat_level, notes, action_taken) VALUES ($1, $2, $3, $4, $5, $6)',
            [
                req.params.id,
                analystId,
                detection.threat_level,
                threat_level_adjustment || detection.threat_level,
                notes,
                verified ? 'verified' : 'rejected'
            ]
        );

        res.json({
            message: 'Weapon detection verification updated',
            detection_id: req.params.id,
            verified,
            analyst_id: analystId
        });

    } catch (error) {
        console.error('Verify weapon detection error:', error);
        res.status(500).json({
            error: 'Failed to verify weapon detection',
            code: 'VERIFY_DETECTION_ERROR'
        });
    }
});

// POST - Receive detection data from Jetson Nano
router.post('/jetson-detection', async (req, res) => {
    try {
        const {
            detectedObjects,
            frame, // base64 encoded image
            systemMetrics,
            timestamp,
            deviceId
        } = req.body;

        // TODO: Save to database
        console.log('Received Jetson detection:', {
            objectCount: detectedObjects.length,
            timestamp,
            deviceId
        });

        res.status(200).json({
            success: true,
            message: 'Detection data received successfully',
            id: Date.now() // temporary ID, replace with database ID
        });
    } catch (error) {
        console.error('Error processing Jetson detection:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process detection data'
        });
    }
});

// POST - Receive detection data from Raspberry Pi + Google Cloud Vision
router.post('/raspberry-detection', async (req, res) => {
    try {
        const {
            cloudVisionResults,
            frame, // base64 encoded image
            systemMetrics,
            timestamp,
            deviceId
        } = req.body;

        // TODO: Save to database
        console.log('Received Raspberry Pi detection:', {
            resultsCount: cloudVisionResults.length,
            timestamp,
            deviceId
        });

        res.status(200).json({
            success: true,
            message: 'Detection data received successfully',
            id: Date.now() // temporary ID, replace with database ID
        });
    } catch (error) {
        console.error('Error processing Raspberry Pi detection:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process detection data'
        });
    }
});

// GET - Retrieve all detection records for frontend
router.get('/all', async (req, res) => {
    try {
        // TODO: Fetch from database
        const mockData = [
            {
                id: 1,
                device: 'Jetson Nano',
                timestamp: new Date().toISOString(),
                objectCount: 3,
                systemMetrics: { cpu: 45, memory: 60, temperature: 42 },
                comments: []
            },
            {
                id: 2,
                device: 'Raspberry Pi',
                timestamp: new Date().toISOString(),
                objectCount: 2,
                systemMetrics: { cpu: 30, memory: 45, temperature: 38 },
                comments: []
            }
        ];

        res.json({ success: true, data: mockData });
    } catch (error) {
        console.error('Error fetching detections:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch detection data'
        });
    }
});

// DELETE - Delete detection record
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // TODO: Delete from database
        console.log('Deleting detection with ID:', id);

        res.json({
            success: true,
            message: 'Detection deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting detection:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete detection'
        });
    }
});

// PUT - Add comment to detection
router.put('/:id/comment', async (req, res) => {
    try {
        const { id } = req.params;
        const { comment, userId } = req.body;

        // TODO: Update database with comment
        console.log('Adding comment to detection:', id, comment);

        res.json({
            success: true,
            message: 'Comment added successfully'
        });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add comment'
        });
    }
});

// POST - Manually add detection record
router.post('/manual', async (req, res) => {
    try {
        const detectionData = req.body;

        // TODO: Save manual entry to database
        console.log('Manual detection entry:', detectionData);

        res.status(201).json({
            success: true,
            message: 'Manual detection record created',
            id: Date.now()
        });
    } catch (error) {
        console.error('Error creating manual detection:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create manual detection'
        });
    }
});

// Helper functions
function calculateThreatLevel(weaponType, confidence) {
    const baseThreatLevels = {
        'Knife': 6,        // Medium-high threat
        'Pistol': 8,       // High threat
        'weapon': 7,       // High threat (generic weapon)
        'rifle': 10        // Maximum threat
    };

    const baseLevel = baseThreatLevels[weaponType] || 5;
    return Math.min(10, Math.round(baseLevel * confidence));
}

async function createThreatAlert(detection) {
    try {
        await dbUtils.alerts.create(
            detection.detection_id,
            'weapon_detection',
            detection.threat_level >= 9 ? 5 : 4, // severity 5 = critical, 4 = high
            `${detection.object_type.toUpperCase()} Detected`,
            `High-confidence ${detection.object_type} detection (${Math.round(detection.confidence * 100)}% confidence)`,
            JSON.stringify({
                auto_generated: true,
                threat_level: detection.threat_level,
                confidence: detection.confidence
            })
        );
    } catch (error) {
        console.error('Failed to create weapon threat alert:', error);
    }
}

module.exports = router;