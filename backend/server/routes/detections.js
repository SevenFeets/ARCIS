const express = require('express');
const { verifyToken, requireRole, requireClearance } = require('../middleware/auth');
const { validateDetection, validateId, validatePagination } = require('../middleware/validations');
const { dbUtils } = require('../config/db');
const arcjetMiddleware = require('../middleware/arcjet');

const router = express.Router();

// Apply rate limiting
router.use(arcjetMiddleware);

// POST /api/detections/incoming - Receive weapon detection from Jetson Nano
router.post('/incoming', async (req, res) => {
    try {
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
            return res.status(400).json({
                error: 'Missing required detection data',
                code: 'MISSING_DETECTION_DATA'
            });
        }

        // Validate weapon type
        const validWeaponTypes = ['Knife', 'Pistol', 'weapon', 'rifle'];
        if (!validWeaponTypes.includes(object_type)) {
            return res.status(400).json({
                error: `Invalid weapon type: ${object_type}. Must be one of: ${validWeaponTypes.join(', ')}`,
                code: 'INVALID_WEAPON_TYPE'
            });
        }

        // Calculate threat level based on weapon type and confidence
        const threatLevel = calculateThreatLevel(object_type, confidence);

        // Create detection record
        const detection = await dbUtils.detections.create(
            null, // frameId - will be handled separately if needed
            object_type,
            confidence,
            JSON.stringify(bounding_box),
            threatLevel,
            JSON.stringify({
                device_id,
                image_path,
                ...metadata
            })
        );

        // Create weapon-specific detection details
        await dbUtils.weapons.create(
            detection.detection_id,
            object_type,
            false, // visible_ammunition - default false
            null,  // estimated_caliber
            null,  // orientation_angle
            true,  // in_use - assume weapon is active when detected
            JSON.stringify(metadata || {})
        );

        // If high threat, create automatic alert
        if (threatLevel >= 7) {
            await createThreatAlert(detection);
        }

        res.status(201).json({
            message: 'Weapon detection processed successfully',
            detection_id: detection.detection_id,
            weapon_type: object_type,
            threat_level: threatLevel,
            confidence: Math.round(confidence * 100),
            alert_created: threatLevel >= 7
        });

    } catch (error) {
        console.error('Weapon detection processing error:', error);
        res.status(500).json({
            error: 'Failed to process weapon detection',
            code: 'DETECTION_PROCESSING_ERROR'
        });
    }
});

// GET /api/detections - Get all weapon detections (with pagination)
router.get('/', verifyToken, requireClearance(2), validatePagination, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const weaponType = req.query.weapon_type; // filter by weapon type
        const threatLevel = req.query.threat_level; // filter by threat level

        let detections;
        if (weaponType) {
            detections = await dbUtils.detections.getByWeaponType(weaponType);
        } else if (threatLevel) {
            detections = await dbUtils.detections.getHighThreat(parseInt(threatLevel));
        } else {
            detections = await dbUtils.detections.getRecent(24); // last 24 hours
        }

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedDetections = detections.slice(startIndex, endIndex);

        res.json({
            weapon_detections: paginatedDetections,
            pagination: {
                page,
                limit,
                total: detections.length,
                pages: Math.ceil(detections.length / limit)
            }
        });

    } catch (error) {
        console.error('Get weapon detections error:', error);
        res.status(500).json({
            error: 'Failed to retrieve weapon detections',
            code: 'GET_DETECTIONS_ERROR'
        });
    }
});

// GET /api/detections/threats - Get current weapon threats (high priority)
router.get('/threats', verifyToken, requireClearance(2), async (req, res) => {
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

// GET /api/detections/weapons/:type - Get detections by weapon type
router.get('/weapons/:type', verifyToken, requireClearance(3), async (req, res) => {
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