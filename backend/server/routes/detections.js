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
                (frame_id, object_category, object_type, confidence, bounding_box, threat_level, metadata, detection_frame_data, system_metrics) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
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
                }),
                req.body.frame_data || null, // Base64 encoded frame
                JSON.stringify(req.body.system_metrics || {})
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

// GET /api/detections/:id/metrics - Get system metrics for a specific detection
router.get('/:id/metrics', validateId, async (req, res) => {
    try {
        const detectionId = parseInt(req.params.id);

        const query = `
            SELECT 
                detection_id,
                system_metrics,
                metadata,
                timestamp,
                confidence,
                threat_level
            FROM arcis.detections 
            WHERE detection_id = $1
        `;

        const result = await dbUtils.query(query, [detectionId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Detection not found',
                code: 'DETECTION_NOT_FOUND'
            });
        }

        const detection = result.rows[0];
        const systemMetrics = typeof detection.system_metrics === 'string'
            ? JSON.parse(detection.system_metrics)
            : detection.system_metrics || {};

        const metadata = typeof detection.metadata === 'string'
            ? JSON.parse(detection.metadata)
            : detection.metadata || {};

        // Format system metrics for display
        const formattedMetrics = {
            detection_id: detectionId,
            timestamp: detection.timestamp,
            confidence_score: Math.round(detection.confidence * 100),
            threat_level: detection.threat_level,
            device_type: metadata.device_type || 'Unknown',
            device_id: metadata.device_id || 'Unknown',

            // System performance metrics
            cpu_usage: systemMetrics.cpu_usage || 'N/A',
            gpu_usage: systemMetrics.gpu_usage || 'N/A',
            ram_usage: systemMetrics.ram_usage || 'N/A',
            cpu_temp: systemMetrics.cpu_temp || 'N/A',
            gpu_temp: systemMetrics.gpu_temp || 'N/A',
            cpu_voltage: systemMetrics.cpu_voltage || 'N/A',
            gpu_voltage: systemMetrics.gpu_voltage || 'N/A',

            // Network metrics
            network_status: systemMetrics.network_status || 'N/A',
            network_speed: systemMetrics.network_speed || 'N/A',
            network_signal_strength: systemMetrics.network_signal_strength || 'N/A',

            // Storage and processing metrics
            disk_usage: systemMetrics.disk_usage || 'N/A',
            detection_latency: systemMetrics.detection_latency || 'N/A',
            distance_to_detection: systemMetrics.distance_to_detection || 'N/A',
            database_status: systemMetrics.database_status || 'Connected',
            alert_played: systemMetrics.alert_played || false,

            // Raw metrics for debugging
            raw_system_metrics: systemMetrics,
            raw_metadata: metadata
        };

        res.json({
            success: true,
            metrics: formattedMetrics,
            message: `System metrics retrieved for detection ${detectionId}`
        });

    } catch (error) {
        console.error('Error getting detection metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve detection metrics',
            code: 'GET_METRICS_ERROR',
            details: error.message
        });
    }
});

// GET /api/detections/:id/frame - Get detection frame image
router.get('/:id/frame', validateId, async (req, res) => {
    try {
        const detectionId = parseInt(req.params.id);

        const query = `
            SELECT 
                detection_id,
                detection_frame_data,
                metadata,
                timestamp
            FROM arcis.detections 
            WHERE detection_id = $1
        `;

        const result = await dbUtils.query(query, [detectionId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Detection not found',
                code: 'DETECTION_NOT_FOUND'
            });
        }

        const detection = result.rows[0];

        if (!detection.detection_frame_data) {
            return res.status(404).json({
                success: false,
                error: 'No frame data available for this detection',
                code: 'NO_FRAME_DATA'
            });
        }

        res.json({
            success: true,
            detection_id: detectionId,
            frame_data: detection.detection_frame_data, // Base64 encoded image
            timestamp: detection.timestamp,
            message: `Frame data retrieved for detection ${detectionId}`
        });

    } catch (error) {
        console.error('Error getting detection frame:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve detection frame',
            code: 'GET_FRAME_ERROR',
            details: error.message
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

// GET /api/detections/manual - Get only manual detection entries
router.get('/manual', async (req, res) => {
    try {
        console.log('GET /api/detections/manual called');

        // Query for detections where metadata indicates manual entry
        const result = await dbUtils.query(`
            SELECT 
                detection_id as id,
                object_type,
                confidence,
                threat_level,
                bounding_box,
                metadata,
                timestamp,
                detected_at
            FROM arcis.detections 
            WHERE (metadata::jsonb ->> 'device_type' = 'manual_entry')
            OR (metadata::jsonb ->> 'entry_type' = 'manual')
            ORDER BY detection_id DESC
        `);

        // Transform data specifically for manual entries with officer information
        const manualDetections = result.rows.map(detection => {
            const metadata = typeof detection.metadata === 'string'
                ? JSON.parse(detection.metadata)
                : detection.metadata;

            return {
                id: detection.id,
                weapon_type: detection.object_type,
                confidence: Math.round(parseFloat(detection.confidence) * 100),
                threat_level: detection.threat_level,
                location: metadata.location || 'Unknown',
                officer_name: metadata.officer_name || 'Unknown Officer',
                officer_id: metadata.officer_id,
                description: metadata.description || '',
                notes: metadata.notes || '',
                entry_timestamp: metadata.entry_timestamp,
                original_timestamp: metadata.original_timestamp,
                timestamp: detection.timestamp || detection.detected_at,
                bounding_box: typeof detection.bounding_box === 'string'
                    ? JSON.parse(detection.bounding_box)
                    : detection.bounding_box,
                comments: metadata.comments || [],
                entry_type: 'manual'
            };
        });

        console.log(`Found ${manualDetections.length} manual detection entries`);

        res.json({
            success: true,
            data: manualDetections,
            count: manualDetections.length,
            message: manualDetections.length === 0
                ? 'No manual detection entries found'
                : `Found ${manualDetections.length} manual detection entries`,
            entry_type: 'manual'
        });

    } catch (error) {
        console.error('Get manual detections error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve manual detection entries',
            code: 'GET_MANUAL_DETECTIONS_ERROR',
            details: error.message
        });
    }
});

// GET - Retrieve all detection records for frontend (MOVED BEFORE /:id)
router.get('/all', async (req, res) => {
    try {
        // Fetch real detection data from database
        const result = await dbUtils.query(`
            SELECT 
                detection_id as id,
                object_type,
                confidence,
                threat_level,
                bounding_box,
                metadata,
                timestamp,
                detected_at
            FROM arcis.detections 
            ORDER BY detection_id DESC 
            LIMIT 100
        `);

        // Transform data for frontend compatibility
        const frontendData = result.rows.map(detection => {
            const metadata = typeof detection.metadata === 'string'
                ? JSON.parse(detection.metadata)
                : detection.metadata;

            return {
                id: detection.id,
                device: getDeviceType(metadata),
                device_id: metadata.device_id || 'unknown',
                timestamp: detection.timestamp || detection.detected_at,
                weapon_type: detection.object_type,
                confidence: Math.round(parseFloat(detection.confidence) * 100),
                threat_level: detection.threat_level,
                bounding_box: typeof detection.bounding_box === 'string'
                    ? JSON.parse(detection.bounding_box)
                    : detection.bounding_box,
                location: metadata.location || 'Unknown',
                systemMetrics: metadata.system_metrics || {},
                comments: [], // TODO: Add comments system later
                metadata: metadata
            };
        });

        res.json({
            success: true,
            data: frontendData,
            total: frontendData.length,
            message: `Retrieved ${frontendData.length} detection records`
        });

    } catch (error) {
        console.error('Error fetching detections:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch detection data',
            details: error.message
        });
    }
});

// GET /api/detections/:id - Get specific weapon detection
router.get('/:id', validateId, async (req, res) => {
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

// // PUT /api/detections/:id/verify - Verify/confirm weapon detection (analyst review)
// router.put('/:id/verify', validateId, async (req, res) => {
//     // router.put('/:id/verify', requireRole(['analyst', 'commander', 'admin']), validateId, async (req, res) => {

//     try {
//         const { verified, notes, threat_level_adjustment } = req.body;
//         //        const analystId = req.user.user_id; 
//         const analystId = 1; // Temporary for testing

//         // Create annotation record
//         const detection = await dbUtils.detections.findById(req.params.id);
//         if (!detection) {
//             return res.status(404).json({
//                 error: 'Weapon detection not found',
//                 code: 'DETECTION_NOT_FOUND'
//             });
//         }

//         // Log the verification
//         await dbUtils.query(
//             'INSERT INTO detection_annotations (detection_id, user_id, previous_threat_level, new_threat_level, notes, action_taken) VALUES ($1, $2, $3, $4, $5, $6)',
//             [
//                 req.params.id,
//                 analystId,
//                 detection.threat_level,
//                 threat_level_adjustment || detection.threat_level,
//                 notes,
//                 verified ? 'verified' : 'rejected'
//             ]
//         );

//         res.json({
//             message: 'Weapon detection verification updated',
//             detection_id: req.params.id,
//             verified,
//             analyst_id: analystId
//         });

//     } catch (error) {
//         console.error('Verify weapon detection error:', error);
//         res.status(500).json({
//             error: 'Failed to verify weapon detection',
//             code: 'VERIFY_DETECTION_ERROR'
//         });
//     }
// });

// POST - Receive detection data from Jetson Nano (Standardized Format)
router.post('/jetson-detection', async (req, res) => {
    try {
        const {
            detectedObjects,
            frame, // base64 encoded image
            systemMetrics,
            timestamp,
            deviceId
        } = req.body;

        console.log('Received Jetson detection:', {
            objectCount: detectedObjects.length,
            timestamp,
            deviceId
        });

        // Convert Jetson format to standard incoming format and process each detection
        const results = [];

        for (const obj of detectedObjects) {
            // Map Jetson object format to standard format
            const standardizedDetection = {
                device_id: deviceId,
                object_type: mapJetsonClassToWeaponType(obj.class, obj.label),
                confidence: obj.confidence,
                bounding_box: {
                    x: obj.bbox[0],
                    y: obj.bbox[1],
                    width: obj.bbox[2],
                    height: obj.bbox[3]
                },
                image_path: `/jetson/frames/${deviceId}_${Date.now()}.jpg`,
                metadata: {
                    device_type: 'jetson_nano',
                    original_class: obj.class,
                    original_label: obj.label,
                    system_metrics: systemMetrics,
                    original_timestamp: timestamp,
                    frame_data: frame
                }
            };

            // Process using the same logic as /incoming
            if (isWeaponDetection(standardizedDetection.object_type)) {
                const threatLevel = calculateThreatLevel(standardizedDetection.object_type, standardizedDetection.confidence);

                // Save to database
                const detectionQuery = `
                    INSERT INTO arcis.detections 
                    (frame_id, object_category, object_type, confidence, bounding_box, threat_level, metadata, detection_frame_data, system_metrics) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
                    RETURNING *
                `;

                const detectionResult = await dbUtils.query(detectionQuery, [
                    null,
                    'weapon',
                    standardizedDetection.object_type,
                    standardizedDetection.confidence,
                    JSON.stringify(standardizedDetection.bounding_box),
                    threatLevel,
                    JSON.stringify(standardizedDetection.metadata),
                    frame || null, // Base64 encoded frame from Jetson
                    JSON.stringify(systemMetrics || {})
                ]);

                results.push({
                    detection_id: detectionResult.rows[0].detection_id,
                    weapon_type: standardizedDetection.object_type,
                    threat_level: threatLevel,
                    confidence: Math.round(standardizedDetection.confidence * 100)
                });
            }
        }

        res.status(201).json({
            success: true,
            message: 'Jetson detection data processed successfully',
            processed_detections: results.length,
            detections: results,
            device_id: deviceId
        });

    } catch (error) {
        console.error('Error processing Jetson detection:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process Jetson detection data',
            details: error.message
        });
    }
});

// POST - Receive detection data from Raspberry Pi + Google Cloud Vision (Standardized Format)
router.post('/raspberry-detection', async (req, res) => {
    try {
        const {
            cloudVisionResults,
            frame, // base64 encoded image
            systemMetrics,
            timestamp,
            deviceId
        } = req.body;

        console.log('Received Raspberry Pi detection:', {
            resultsCount: cloudVisionResults.length,
            timestamp,
            deviceId
        });

        // Convert Google Cloud Vision format to standard incoming format and process each detection
        const results = [];

        for (const result of cloudVisionResults) {
            // Map Google Cloud Vision format to standard format
            const standardizedDetection = {
                device_id: deviceId,
                object_type: mapCloudVisionToWeaponType(result.description),
                confidence: result.score,
                bounding_box: {
                    x: Math.min(...result.boundingPoly.vertices.map(v => v.x)),
                    y: Math.min(...result.boundingPoly.vertices.map(v => v.y)),
                    width: Math.max(...result.boundingPoly.vertices.map(v => v.x)) - Math.min(...result.boundingPoly.vertices.map(v => v.x)),
                    height: Math.max(...result.boundingPoly.vertices.map(v => v.y)) - Math.min(...result.boundingPoly.vertices.map(v => v.y))
                },
                image_path: `/raspberry/frames/${deviceId}_${Date.now()}.jpg`,
                metadata: {
                    device_type: 'raspberry_pi',
                    cloud_vision_description: result.description,
                    bounding_poly: result.boundingPoly,
                    system_metrics: systemMetrics,
                    original_timestamp: timestamp,
                    frame_data: frame
                }
            };

            // Process using the same logic as /incoming
            if (isWeaponDetection(standardizedDetection.object_type)) {
                const threatLevel = calculateThreatLevel(standardizedDetection.object_type, standardizedDetection.confidence);

                // Save to database
                const detectionQuery = `
                    INSERT INTO arcis.detections 
                    (frame_id, object_category, object_type, confidence, bounding_box, threat_level, metadata, detection_frame_data, system_metrics) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
                    RETURNING *
                `;

                const detectionResult = await dbUtils.query(detectionQuery, [
                    null,
                    'weapon',
                    standardizedDetection.object_type,
                    standardizedDetection.confidence,
                    JSON.stringify(standardizedDetection.bounding_box),
                    threatLevel,
                    JSON.stringify(standardizedDetection.metadata),
                    frame || null, // Base64 encoded frame from Raspberry Pi
                    JSON.stringify(systemMetrics || {})
                ]);

                results.push({
                    detection_id: detectionResult.rows[0].detection_id,
                    weapon_type: standardizedDetection.object_type,
                    threat_level: threatLevel,
                    confidence: Math.round(standardizedDetection.confidence * 100)
                });
            }
        }

        res.status(201).json({
            success: true,
            message: 'Raspberry Pi detection data processed successfully',
            processed_detections: results.length,
            detections: results,
            device_id: deviceId
        });

    } catch (error) {
        console.error('Error processing Raspberry Pi detection:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process Raspberry Pi detection data',
            details: error.message
        });
    }
});



// DELETE /api/detections/:id - Delete detection record
router.delete('/:id', validateId, async (req, res) => {
    try {
        const detectionId = parseInt(req.params.id);

        console.log(`DELETE request for detection ID: ${detectionId}`);

        // First check if the detection exists
        const checkQuery = 'SELECT detection_id, object_type, threat_level FROM arcis.detections WHERE detection_id = $1';
        const checkResult = await dbUtils.query(checkQuery, [detectionId]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Detection record not found',
                code: 'DETECTION_NOT_FOUND',
                detection_id: detectionId
            });
        }

        const detection = checkResult.rows[0];
        console.log(`Found detection to delete:`, detection);

        // Delete the detection record
        const deleteQuery = 'DELETE FROM arcis.detections WHERE detection_id = $1 RETURNING *';
        const deleteResult = await dbUtils.query(deleteQuery, [detectionId]);

        if (deleteResult.rows.length === 0) {
            throw new Error('Failed to delete detection record');
        }

        const deletedDetection = deleteResult.rows[0];
        console.log(`Successfully deleted detection:`, deletedDetection);

        res.json({
            success: true,
            message: `Detection record ${detectionId} deleted successfully`,
            deleted_detection: {
                id: deletedDetection.detection_id,
                weapon_type: deletedDetection.object_type,
                threat_level: deletedDetection.threat_level,
                deleted_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error deleting detection:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete detection record',
            code: 'DELETE_DETECTION_ERROR',
            details: error.message
        });
    }
});

// PUT /api/detections/:id/comment - Add comment to detection
router.put('/:id/comment', validateId, async (req, res) => {
    try {
        const detectionId = parseInt(req.params.id);
        const { comment, userId, userName } = req.body;

        console.log(`Adding comment to detection ${detectionId}:`, comment);

        // Validate input
        if (!comment || comment.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Comment text is required',
                code: 'MISSING_COMMENT'
            });
        }

        // Check if detection exists and get current metadata
        const checkQuery = 'SELECT detection_id, metadata FROM arcis.detections WHERE detection_id = $1';
        const checkResult = await dbUtils.query(checkQuery, [detectionId]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Detection record not found',
                code: 'DETECTION_NOT_FOUND',
                detection_id: detectionId
            });
        }

        const detection = checkResult.rows[0];
        let metadata = typeof detection.metadata === 'string'
            ? JSON.parse(detection.metadata)
            : detection.metadata || {};

        // Initialize comments array if it doesn't exist
        if (!metadata.comments) {
            metadata.comments = [];
        }

        // Create new comment object
        const newComment = {
            id: Date.now(),
            comment: comment.trim(),
            user_id: userId || 1, // Default to user 1 for testing
            user_name: userName || 'Anonymous User',
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString()
        };

        // Add comment to metadata
        metadata.comments.push(newComment);

        // Update detection with new metadata
        const updateQuery = 'UPDATE arcis.detections SET metadata = $1 WHERE detection_id = $2 RETURNING *';
        const updateResult = await dbUtils.query(updateQuery, [JSON.stringify(metadata), detectionId]);

        if (updateResult.rows.length === 0) {
            throw new Error('Failed to update detection with comment');
        }

        console.log(`Successfully added comment to detection ${detectionId}`);

        res.json({
            success: true,
            message: 'Comment added successfully',
            detection_id: detectionId,
            comment: newComment,
            total_comments: metadata.comments.length
        });

    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add comment to detection',
            code: 'ADD_COMMENT_ERROR',
            details: error.message
        });
    }
});

// POST /api/detections/manual - Manually add detection record
router.post('/manual', async (req, res) => {
    try {
        const {
            object_type,
            confidence,
            location,
            description,
            officer_id,
            officer_name,
            timestamp,
            bounding_box,
            notes
        } = req.body;

        console.log('=== MANUAL DETECTION ENTRY ===');
        console.log('Request body:', JSON.stringify(req.body, null, 2));

        // Validate required fields
        if (!object_type || confidence === undefined || !location) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: object_type, confidence, and location are required',
                code: 'MISSING_REQUIRED_FIELDS'
            });
        }

        // Validate weapon type
        const validWeaponTypes = ['Knife', 'Pistol', 'weapon', 'rifle'];
        if (!validWeaponTypes.includes(object_type)) {
            return res.status(400).json({
                success: false,
                error: `Invalid weapon type: ${object_type}. Must be one of: ${validWeaponTypes.join(', ')}`,
                code: 'INVALID_WEAPON_TYPE'
            });
        }

        // Validate confidence (0.0 to 1.0)
        const confValue = parseFloat(confidence);
        if (isNaN(confValue) || confValue < 0 || confValue > 1) {
            return res.status(400).json({
                success: false,
                error: 'Confidence must be a number between 0.0 and 1.0',
                code: 'INVALID_CONFIDENCE'
            });
        }

        // Calculate threat level
        const threatLevel = calculateThreatLevel(object_type, confValue);
        console.log('Calculated threat level:', threatLevel);

        // Create manual detection metadata
        const manualMetadata = {
            device_type: 'manual_entry',
            entry_type: 'manual',
            officer_id: officer_id || 1,
            officer_name: officer_name || 'Unknown Officer',
            location: location,
            description: description || '',
            notes: notes || '',
            entry_timestamp: new Date().toISOString(),
            original_timestamp: timestamp || new Date().toISOString(),
            comments: []
        };

        // Save to database using same structure as automated detections
        const detectionQuery = `
            INSERT INTO arcis.detections 
            (frame_id, object_category, object_type, confidence, bounding_box, threat_level, metadata, detection_frame_data, system_metrics) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING *
        `;

        const detectionParams = [
            null, // frame_id - NULL for manual entries
            'weapon', // object_category
            object_type,
            confValue,
            JSON.stringify(bounding_box || {}),
            threatLevel,
            JSON.stringify(manualMetadata),
            null, // No frame data for manual entries
            JSON.stringify({}) // Empty system metrics for manual entries
        ];

        console.log('Manual detection query params:', detectionParams);

        const detectionResult = await dbUtils.query(detectionQuery, detectionParams);
        const detection = detectionResult.rows[0];

        console.log('Manual detection created successfully with ID:', detection.detection_id);

        res.status(201).json({
            success: true,
            message: 'Manual detection record created successfully',
            detection_id: detection.detection_id,
            weapon_type: object_type,
            threat_level: threatLevel,
            confidence: Math.round(confValue * 100),
            location: location,
            officer: officer_name || 'Unknown Officer',
            entry_type: 'manual'
        });

    } catch (error) {
        console.error('=== MANUAL DETECTION ERROR ===');
        console.error('Error details:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to create manual detection record',
            code: 'MANUAL_DETECTION_ERROR',
            details: error.message
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

// Map Jetson AI model classes to our standard weapon types
function mapJetsonClassToWeaponType(objectClass, label) {
    const mappings = {
        'weapon': 'weapon',
        'pistol': 'Pistol',
        'gun': 'Pistol',
        'firearm': 'Pistol',
        'rifle': 'rifle',
        'knife': 'Knife',
        'blade': 'Knife',
        'sword': 'Knife'
    };

    // Check both class and label
    const lowerClass = objectClass.toLowerCase();
    const lowerLabel = label ? label.toLowerCase() : '';

    return mappings[lowerClass] || mappings[lowerLabel] || null;
}

// Map Google Cloud Vision descriptions to our standard weapon types
function mapCloudVisionToWeaponType(description) {
    const desc = description.toLowerCase();

    if (desc.includes('pistol') || desc.includes('handgun') || desc.includes('gun')) {
        return 'Pistol';
    }
    if (desc.includes('rifle') || desc.includes('assault')) {
        return 'rifle';
    }
    if (desc.includes('knife') || desc.includes('blade') || desc.includes('sword')) {
        return 'Knife';
    }
    if (desc.includes('weapon') || desc.includes('firearm')) {
        return 'weapon';
    }

    return null; // Not a weapon
}

// Check if detected object is a weapon
function isWeaponDetection(objectType) {
    return objectType !== null && ['Knife', 'Pistol', 'weapon', 'rifle'].includes(objectType);
}

// Determine device type from metadata
function getDeviceType(metadata) {
    if (metadata.device_type === 'jetson_nano') return 'Jetson Nano';
    if (metadata.device_type === 'raspberry_pi') return 'Raspberry Pi';
    if (metadata.device_id && metadata.device_id.includes('jetson')) return 'Jetson Nano';
    if (metadata.device_id && metadata.device_id.includes('raspberry')) return 'Raspberry Pi';
    return 'Unknown Device';
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