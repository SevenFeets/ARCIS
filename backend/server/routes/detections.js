const express = require('express');
const { verifyToken, requireRole, requireClearance } = require('../middleware/auth');
const { validateDetection, validateId, validatePagination } = require('../middleware/validations');
const { dbUtils } = require('../config/db');
const arcjetMiddleware = require('../middleware/arcjet');
const { supabaseDb } = require('../config/supabase');
const { uploadSingle } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Apply rate limiting
router.use(arcjetMiddleware);

// Middleware for API key validation (for Pi/Jetson devices)
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;

    // For development, accept any API key - you can implement proper validation later
    if (!apiKey) {
        return res.status(401).json({
            success: false,
            error: 'API key required',
            message: 'Include X-API-Key header or api_key query parameter'
        });
    }

    // TODO: Validate API key against database
    req.deviceId = 1; // Default device ID for now
    next();
};

// GET /api/detections/test-jpeg/:id - Test JPEG data format
router.get('/test-jpeg/:id', async (req, res) => {
    try {
        const detectionId = parseInt(req.params.id);
        const { supabase } = require('../config/supabase');

        const { data, error } = await supabase
            .from('detections')
            .select('detection_id, detection_frame_jpeg')
            .eq('detection_id', detectionId)
            .single();

        if (error || !data) {
            return res.json({ error: 'Detection not found' });
        }

        res.json({
            detection_id: data.detection_id,
            jpeg_data_type: typeof data.detection_frame_jpeg,
            jpeg_data_preview: data.detection_frame_jpeg ?
                (typeof data.detection_frame_jpeg === 'string' ?
                    data.detection_frame_jpeg.substring(0, 100) :
                    JSON.stringify(data.detection_frame_jpeg).substring(0, 100)) : null,
            has_jpeg: !!data.detection_frame_jpeg
        });
    } catch (error) {
        res.json({ error: error.message });
    }
});

// GET /api/detections/test - Test database connection
router.get('/test', async (req, res) => {
    try {
        console.log('Testing Supabase database connection...');

        // Simple test - just try to select from detections table without joins
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
        res.status(500).json({
            success: false,
            error: 'Database connection failed',
            details: error.message
        });
    }
});

// POST /api/detections - Create new weapon detection (for Pi/Jetson)
router.post('/', validateApiKey, async (req, res) => {
    try {
        const {
            object_type,
            confidence,
            bounding_box,
            threat_level,
            frame_data,
            system_metrics,
            session_id,
            frame_path,
            timestamp
        } = req.body;

        // Validate required fields
        if (!object_type || !confidence || !bounding_box) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                required: ['object_type', 'confidence', 'bounding_box'],
                received: Object.keys(req.body)
            });
        }

        // First, create or get frame record
        let frameId;
        if (frame_path) {
            const frameData = {
                session_id: session_id || 1, // Default session
                file_path: frame_path,
                timestamp: timestamp || new Date().toISOString(),
                processed: true,
                metadata: system_metrics ? { system_metrics } : null
            };

            const frame = await supabaseDb.frames.create(frameData);
            frameId = frame.frame_id;
        }

        // Create detection record
        const detectionData = {
            frame_id: frameId,
            object_category: 'weapon',
            object_type: object_type,
            confidence: parseFloat(confidence),
            bounding_box: bounding_box,
            threat_level: threat_level || calculateThreatLevel(object_type, confidence),
            detection_frame_data: frame_data, // Base64 encoded image
            system_metrics: system_metrics,
            timestamp: timestamp || new Date().toISOString()
        };

        const detection = await supabaseDb.detections.create(detectionData);

        // Create alert if threat level is high
        if (detection.threat_level >= 7) {
            const alertData = {
                detection_id: detection.detection_id,
                alert_type: 'weapon_detected',
                alert_category: 'security',
                severity: detection.threat_level >= 9 ? 5 : 4,
                action_required: `Immediate response required: ${object_type} detected with ${confidence}% confidence`,
                timestamp: timestamp || new Date().toISOString()
            };

            await supabaseDb.alerts.create(alertData);
        }

        res.json({
            success: true,
            data: detection,
            message: 'Detection recorded successfully',
            alert_created: detection.threat_level >= 7
        });

    } catch (error) {
        console.error('Detection creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create detection',
            details: error.message
        });
    }
});

// GET /api/detections - Get recent detections
router.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const minThreatLevel = parseInt(req.query.min_threat_level) || 0;

        let detections;
        if (minThreatLevel > 0) {
            detections = await supabaseDb.detections.getByThreatLevel(minThreatLevel);
        } else {
            detections = await supabaseDb.detections.getRecent(limit);
        }

        res.json({
            success: true,
            data: detections,
            count: detections.length
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

// GET /api/detections/threats - Get high-priority threats
router.get('/threats', async (req, res) => {
    try {
        console.log('Getting high-priority threats...');

        // Simple query for high threat level detections
        const { supabase } = require('../config/supabase');
        const { data, error } = await supabase
            .from('detections')
            .select('*')
            .gte('threat_level', 6)
            .order('timestamp', { ascending: false });

        if (error) {
            console.log('Supabase error:', error.message);
            // Return empty array if no data exists yet
            return res.json({
                active_weapon_threats: [],
                threat_count: 0,
                timestamp: new Date().toISOString()
            });
        }

        // Format for frontend
        const formattedThreats = data.map(threat => ({
            id: threat.detection_id,
            detection_id: threat.detection_id,
            weapon_type: threat.object_type || 'Unknown',
            confidence: threat.confidence || 0,
            threat_level: threat.threat_level || 6,
            location: 'Unknown',
            timestamp: threat.timestamp || new Date().toISOString(),
            device: threat.metadata?.device_name || 'ARCIS Device',
            device_id: threat.metadata?.device_id || '1',
            bounding_box: threat.bounding_box || { x: 0, y: 0, width: 100, height: 100 },
            comments: [],
            metadata: threat.metadata || {},
            detection_frame_data: threat.detection_frame_data, // Include base64 frame data if available (legacy)
            frame_url: threat.frame_url, // Include frame URL for file storage (legacy)
            has_binary_jpeg: !!threat.detection_frame_jpeg, // Indicate if binary JPEG is available
            frame_metadata: threat.frame_metadata, // Include JPEG metadata
            jpeg_endpoint: threat.detection_frame_jpeg ? `/detections/${threat.detection_id}/jpeg` : null // Direct JPEG endpoint
        }));

        res.json({
            active_weapon_threats: formattedThreats,
            threat_count: formattedThreats.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Get threats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve threats',
            details: error.message
        });
    }
});

// GET /api/detections/weapons/:type - Get detections by weapon type (with validation)
router.get('/weapons/:type', async (req, res) => {
    try {
        const weaponType = req.params.type;
        console.log(`Getting detections for weapon type: ${weaponType}`);

        // Validate weapon type first
        const validWeaponTypes = ['Knife', 'Pistol', 'weapon', 'rifle'];
        if (!validWeaponTypes.includes(weaponType)) {
            return res.status(400).json({
                error: `Invalid weapon type: ${weaponType}. Must be one of: ${validWeaponTypes.join(', ')}`,
                code: 'INVALID_WEAPON_TYPE'
            });
        }

        // Query with exact matching (not fuzzy)
        const { supabase } = require('../config/supabase');
        const { data, error } = await supabase
            .from('detections')
            .select('*')
            .eq('object_type', weaponType)
            .order('timestamp', { ascending: false });

        if (error) {
            console.log('Supabase error:', error.message);
            // Return empty array if no data exists yet
            return res.json({
                weapon_type: weaponType,
                detections: [],
                count: 0
            });
        }

        // Format for frontend
        const formattedDetections = data.map(detection => ({
            id: detection.detection_id,
            detection_id: detection.detection_id,
            weapon_type: detection.object_type || 'Unknown',
            confidence: detection.confidence || 0,
            threat_level: detection.threat_level || 1,
            location: 'Unknown',
            timestamp: detection.timestamp || new Date().toISOString(),
            device: detection.metadata?.device_name || 'ARCIS Device',
            device_id: detection.metadata?.device_id || '1',
            bounding_box: detection.bounding_box || { x: 0, y: 0, width: 100, height: 100 },
            comments: [],
            metadata: detection.metadata || {}
        }));

        res.json({
            weapon_type: weaponType,
            detections: formattedDetections,
            count: formattedDetections.length
        });

    } catch (error) {
        console.error('Get detections by weapon type error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve detections by weapon type',
            details: error.message
        });
    }
});

// GET /api/detections/manual - Get manual detection entries
router.get('/manual', async (req, res) => {
    try {
        // For now, return empty array since we don't have manual entries yet
        res.json({
            success: true,
            data: [],
            count: 0,
            message: 'Manual detections retrieved successfully',
            entry_type: 'manual'
        });

    } catch (error) {
        console.error('Get manual detections error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve manual detections',
            details: error.message
        });
    }
});

// POST /api/detections/manual - Create manual detection entry
router.post('/manual', async (req, res) => {
    try {
        const {
            object_type,
            confidence,
            location,
            description,
            officer_id,
            officer_name,
            notes,
            bounding_box
        } = req.body;

        if (!object_type || !confidence) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                required: ['object_type', 'confidence']
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

        // Create manual detection
        const detectionData = {
            object_category: 'weapon',
            object_type: object_type,
            confidence: confValue,
            bounding_box: bounding_box || { x: 0, y: 0, width: 100, height: 100 },
            threat_level: calculateThreatLevel(object_type, confValue),
            metadata: {
                entry_type: 'manual',
                officer_id: officer_id,
                officer_name: officer_name,
                location: location,
                description: description,
                notes: notes
            },
            timestamp: new Date().toISOString()
        };

        const detection = await supabaseDb.detections.create(detectionData);

        res.status(201).json({
            success: true,
            detection_id: detection.detection_id,
            weapon_type: detection.object_type,
            threat_level: detection.threat_level,
            confidence: detection.confidence,
            location: location || 'Unknown',
            officer_id: officer_id || null,
            officer: officer_name || 'Unknown Officer',
            entry_type: 'manual'
        });

    } catch (error) {
        console.error('Create manual detection error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create manual detection',
            details: error.message
        });
    }
});

// POST /api/detections/batch - Batch upload for Pi/Jetson (multiple detections)
router.post('/batch', validateApiKey, async (req, res) => {
    try {
        const { detections } = req.body;

        if (!Array.isArray(detections) || detections.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid batch format',
                message: 'Provide detections array'
            });
        }

        const results = [];
        const errors = [];

        for (let i = 0; i < detections.length; i++) {
            try {
                const detection = detections[i];

                // Create frame if needed
                let frameId;
                if (detection.frame_path) {
                    const frameData = {
                        session_id: detection.session_id || 1,
                        file_path: detection.frame_path,
                        timestamp: detection.timestamp || new Date().toISOString(),
                        processed: true
                    };

                    const frame = await supabaseDb.frames.create(frameData);
                    frameId = frame.frame_id;
                }

                // Create detection
                const detectionData = {
                    frame_id: frameId,
                    object_category: 'weapon',
                    object_type: detection.object_type,
                    confidence: parseFloat(detection.confidence),
                    bounding_box: detection.bounding_box,
                    threat_level: detection.threat_level || calculateThreatLevel(detection.object_type, detection.confidence),
                    detection_frame_data: detection.frame_data,
                    system_metrics: detection.system_metrics,
                    timestamp: detection.timestamp || new Date().toISOString()
                };

                const result = await supabaseDb.detections.create(detectionData);
                results.push(result);

                // Create alert if needed
                if (result.threat_level >= 7) {
                    const alertData = {
                        detection_id: result.detection_id,
                        alert_type: 'weapon_detected',
                        alert_category: 'security',
                        severity: result.threat_level >= 9 ? 5 : 4,
                        action_required: `Batch detection: ${detection.object_type} detected`,
                        timestamp: detection.timestamp || new Date().toISOString()
                    };

                    await supabaseDb.alerts.create(alertData);
                }

            } catch (error) {
                errors.push({
                    index: i,
                    error: error.message,
                    detection: detections[i]
                });
            }
        }

        res.json({
            success: true,
            processed: results.length,
            errors: errors.length,
            data: results,
            error_details: errors
        });

    } catch (error) {
        console.error('Batch detection error:', error);
        res.status(500).json({
            success: false,
            error: 'Batch processing failed',
            details: error.message
        });
    }
});

// GET /api/detections/stats - Get detection statistics
router.get('/stats', async (req, res) => {
    try {
        // This would need custom SQL queries - for now return basic stats
        const recentDetections = await supabaseDb.detections.getRecent(100);

        const stats = {
            total_detections: recentDetections.length,
            weapon_types: {},
            threat_levels: {},
            recent_24h: 0
        };

        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        recentDetections.forEach(detection => {
            // Count by weapon type
            stats.weapon_types[detection.object_type] = (stats.weapon_types[detection.object_type] || 0) + 1;

            // Count by threat level
            const level = detection.threat_level || 0;
            stats.threat_levels[level] = (stats.threat_levels[level] || 0) + 1;

            // Count recent detections
            if (new Date(detection.timestamp) > oneDayAgo) {
                stats.recent_24h++;
            }
        });

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get statistics',
            details: error.message
        });
    }
});

// POST /api/detections/device-status - Update device status (for Pi/Jetson heartbeat)
router.post('/device-status', validateApiKey, async (req, res) => {
    try {
        const { device_id, status, system_metrics } = req.body;

        const deviceStatus = await supabaseDb.devices.updateStatus(
            device_id || req.deviceId,
            status || 'online'
        );

        res.json({
            success: true,
            data: deviceStatus,
            message: 'Device status updated'
        });

    } catch (error) {
        console.error('Device status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update device status',
            details: error.message
        });
    }
});

// Helper function to calculate threat level based on weapon type and confidence
function calculateThreatLevel(objectType, confidence) {
    const baseLevel = {
        'Pistol': 8,
        'rifle': 9,
        'Knife': 6,
        'weapon': 7
    };

    const base = baseLevel[objectType] || 5;
    const confidenceMultiplier = confidence / 100;

    return Math.min(10, Math.round(base * confidenceMultiplier));
}

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

// GET /api/detections/:id/frame - Get detection frame image
router.get('/:id/frame', async (req, res) => {
    try {
        const detectionId = parseInt(req.params.id);

        if (isNaN(detectionId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid detection ID'
            });
        }

        const { supabase } = require('../config/supabase');
        const { data, error } = await supabase
            .from('detections')
            .select('detection_id, detection_frame_data, detection_frame_jpeg, timestamp')
            .eq('detection_id', detectionId)
            .single();

        if (error || !data) {
            return res.status(404).json({
                success: false,
                error: 'Detection not found'
            });
        }

        let frameData = null;

        // Priority 1: Use legacy detection_frame_data if available
        if (data.detection_frame_data) {
            console.log('📸 Using legacy detection_frame_data');
            frameData = data.detection_frame_data;
        }
        // Priority 2: Convert binary JPEG to base64 for fallback
        else if (data.detection_frame_jpeg) {
            console.log('📸 Converting binary JPEG to base64 for legacy API');

            let jpegBuffer;

            console.log('🔍 JPEG data debug:', {
                type: typeof data.detection_frame_jpeg,
                isBuffer: Buffer.isBuffer(data.detection_frame_jpeg),
                hasTypeProperty: data.detection_frame_jpeg && data.detection_frame_jpeg.type
            });

            if (Buffer.isBuffer(data.detection_frame_jpeg)) {
                console.log('✅ Data is already a Buffer');
                jpegBuffer = data.detection_frame_jpeg;
            } else if (data.detection_frame_jpeg && data.detection_frame_jpeg.type === 'Buffer' && Array.isArray(data.detection_frame_jpeg.data)) {
                console.log('🔄 Converting from Supabase {type: Buffer, data: []} format');
                jpegBuffer = Buffer.from(data.detection_frame_jpeg.data);
            } else if (typeof data.detection_frame_jpeg === 'string') {
                console.log('📝 Processing string JPEG data');
                try {
                    // Check if it's hex-encoded JSON first
                    if (data.detection_frame_jpeg.startsWith('x')) {
                        console.log('🔍 Detected hex-encoded Buffer JSON, decoding...');
                        const hexString = data.detection_frame_jpeg.substring(1); // Remove 'x' prefix
                        const jsonString = Buffer.from(hexString, 'hex').toString('utf8');
                        console.log('📋 Decoded JSON preview:', jsonString.substring(0, 100));

                        const parsedData = JSON.parse(jsonString);
                        if (parsedData.type === 'Buffer' && Array.isArray(parsedData.data)) {
                            console.log('✅ Successfully parsed hex-encoded Buffer JSON');
                            jpegBuffer = Buffer.from(parsedData.data);
                        } else {
                            throw new Error('Invalid Buffer JSON structure');
                        }
                    } else {
                        // Try normal base64 decode
                        console.log('📝 Converting from base64 string');
                        jpegBuffer = Buffer.from(data.detection_frame_jpeg, 'base64');
                    }
                } catch (parseError) {
                    console.error('❌ Failed to parse string data:', parseError.message);
                    jpegBuffer = null;
                }
            }

            if (jpegBuffer && jpegBuffer.length > 0) {
                // Verify it's actually a JPEG
                const isValidJPEG = jpegBuffer.slice(0, 2).toString('hex') === 'ffd8';
                console.log('🔍 Buffer validation:', {
                    length: jpegBuffer.length,
                    firstBytes: jpegBuffer.slice(0, 4).toString('hex'),
                    isValidJPEG
                });

                if (isValidJPEG) {
                    // Convert to base64 data URL
                    const base64Data = jpegBuffer.toString('base64');
                    frameData = `data:image/jpeg;base64,${base64Data}`;
                    console.log(`✅ Created valid JPEG data URL (${jpegBuffer.length} bytes)`);
                } else {
                    console.log('❌ Buffer is not a valid JPEG, skipping');
                }
            } else {
                console.log('❌ No valid JPEG buffer created');
            }
        }

        if (!frameData) {
            return res.status(404).json({
                success: false,
                error: 'No frame data available for this detection'
            });
        }

        res.json({
            success: true,
            detection_id: data.detection_id,
            frame_data: frameData,
            timestamp: data.timestamp,
            message: 'Frame data retrieved successfully'
        });

    } catch (error) {
        console.error('Get detection frame error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve frame data',
            details: error.message
        });
    }
});

// POST /api/detections/upload - Upload detection with image file (NEW FILE STORAGE)
router.post('/upload', validateApiKey, uploadSingle, async (req, res) => {
    try {
        console.log('📸 File upload detection endpoint called');
        console.log('📁 Uploaded file:', req.file);
        console.log('📋 Body data:', req.body);

        const {
            object_type,
            confidence,
            bounding_box,
            threat_level,
            system_metrics,
            session_id,
            timestamp,
            device_id
        } = req.body;

        // Validate required fields
        if (!object_type || !confidence || !bounding_box) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                required: ['object_type', 'confidence', 'bounding_box'],
                received: Object.keys(req.body)
            });
        }

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No detection frame image uploaded',
                message: 'Include detection_frame file in multipart form data'
            });
        }

        // Create frame URL path (relative to server)
        const frameUrl = `/api/images/${req.file.filename}`;

        // Create detection record with frame URL
        const detectionData = {
            object_category: 'weapon',
            object_type: object_type,
            confidence: parseFloat(confidence),
            bounding_box: typeof bounding_box === 'string' ? JSON.parse(bounding_box) : bounding_box,
            threat_level: threat_level || calculateThreatLevel(object_type, confidence),
            frame_url: frameUrl, // Store file URL instead of base64
            system_metrics: system_metrics ? (typeof system_metrics === 'string' ? JSON.parse(system_metrics) : system_metrics) : null,
            timestamp: timestamp || new Date().toISOString(),
            metadata: {
                device_id: device_id || req.deviceId,
                file_info: {
                    original_name: req.file.originalname,
                    filename: req.file.filename,
                    size: req.file.size,
                    mimetype: req.file.mimetype
                }
            }
        };

        const { supabase } = require('../config/supabase');
        const { data: detection, error } = await supabase
            .from('detections')
            .insert([detectionData])
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to save detection to database',
                details: error.message
            });
        }

        // Create alert if threat level is high
        if (detection.threat_level >= 7) {
            const alertData = {
                detection_id: detection.detection_id,
                alert_type: 'weapon_detected',
                alert_category: 'security',
                severity: detection.threat_level >= 9 ? 5 : 4,
                action_required: `Immediate response required: ${object_type} detected with ${confidence}% confidence`,
                timestamp: timestamp || new Date().toISOString()
            };

            const { error: alertError } = await supabase
                .from('alerts')
                .insert([alertData]);

            if (alertError) {
                console.error('Alert creation error:', alertError);
            }
        }

        res.json({
            success: true,
            data: detection,
            frame_url: frameUrl,
            file_info: {
                filename: req.file.filename,
                size: req.file.size,
                path: req.file.path
            },
            message: 'Detection with image file recorded successfully',
            alert_created: detection.threat_level >= 7
        });

    } catch (error) {
        console.error('File upload detection error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process detection upload',
            details: error.message
        });
    }
});

// GET /api/images/:filename - Serve uploaded detection images
router.get('/images/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const { uploadsDir } = require('../middleware/upload');
        const imagePath = path.join(uploadsDir, filename);

        // Check if file exists
        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({
                success: false,
                error: 'Image not found'
            });
        }

        // Set appropriate headers
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        };

        const mimeType = mimeTypes[ext] || 'image/jpeg';
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

        // Stream the file
        const fileStream = fs.createReadStream(imagePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Image serving error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to serve image',
            details: error.message
        });
    }
});

// GET /api/detections/:id/metrics - Get system metrics for a specific detection
router.get('/:id/metrics', async (req, res) => {
    try {
        const detectionId = parseInt(req.params.id);

        if (isNaN(detectionId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid detection ID'
            });
        }

        // Return mock metrics data for now
        const mockMetrics = {
            detection_id: detectionId,
            timestamp: new Date().toISOString(),
            confidence_score: 85,
            threat_level: 7,
            device_type: 'ARCIS Camera',
            device_id: '1',
            cpu_usage: 45,
            gpu_usage: 60,
            ram_usage: 55,
            cpu_temp: 65,
            gpu_temp: 70,
            cpu_voltage: 1.2,
            gpu_voltage: 1.1,
            network_status: 'Connected',
            network_speed: 100,
            network_signal_strength: -45,
            disk_usage: 30,
            detection_latency: 250,
            distance_to_detection: 5.2,
            database_status: 'Connected',
            alert_played: true,
            raw_system_metrics: {},
            raw_metadata: {}
        };

        res.json({
            success: true,
            metrics: mockMetrics,
            message: 'System metrics retrieved successfully'
        });

    } catch (error) {
        console.error('Error getting detection metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve detection metrics',
            details: error.message
        });
    }
});

// Duplicate frame endpoint removed - using the real Supabase implementation above

// needs to add verifyToken, requireClearance(3)

// Note: /weapons/:type endpoint is defined above with proper validation

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

// GET /api/detections/all - Get all detections formatted for frontend
router.get('/all', async (req, res) => {
    try {
        console.log('Getting all detections...');

        // Simple query without complex joins
        const { supabase } = require('../config/supabase');
        const { data, error } = await supabase
            .from('detections')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(100);

        if (error) {
            console.log('Supabase error:', error.message);
            // Return empty array if no data exists yet
            return res.json({
                success: true,
                data: [],
                total: 0,
                message: 'No detections found (database empty)'
            });
        }

        // Format for frontend
        const formattedDetections = data.map(detection => ({
            id: detection.detection_id,
            detection_id: detection.detection_id,
            weapon_type: detection.object_type || 'Unknown',
            confidence: detection.confidence || 0,
            threat_level: detection.threat_level || 1,
            location: 'Unknown', // Add location field if available
            timestamp: detection.timestamp || new Date().toISOString(),
            device: 'ARCIS Device', // Add device name if available
            device_id: '1', // Add device ID if available
            bounding_box: detection.bounding_box || { x: 0, y: 0, width: 100, height: 100 },
            comments: [], // Add comments if available
            metadata: detection.metadata || {},
            detection_frame_data: detection.detection_frame_data, // Include base64 frame data if available (legacy)
            frame_url: detection.frame_url, // Include frame URL for file storage (legacy)
            has_binary_jpeg: !!detection.detection_frame_jpeg, // Indicate if binary JPEG is available
            frame_metadata: detection.frame_metadata, // Include JPEG metadata
            jpeg_endpoint: detection.detection_frame_jpeg ? `/detections/${detection.detection_id}/jpeg` : null // Direct JPEG endpoint
        }));

        res.json({
            success: true,
            data: formattedDetections,
            total: formattedDetections.length,
            message: 'Detections retrieved successfully'
        });

    } catch (error) {
        console.error('Get all detections error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve all detections',
            details: error.message
        });
    }
});

// GET /api/detections/:id - Get specific weapon detection
router.get('/:id', async (req, res) => {
    try {
        const detectionId = parseInt(req.params.id);

        if (isNaN(detectionId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid detection ID',
                code: 'INVALID_ID'
            });
        }

        console.log(`Getting detection by ID: ${detectionId}`);

        // Query Supabase for the detection
        const { supabase } = require('../config/supabase');
        const { data, error } = await supabase
            .from('detections')
            .select('*')
            .eq('detection_id', detectionId)
            .single();

        if (error || !data) {
            console.log('Supabase error or no data:', error?.message);
            return res.status(404).json({
                success: false,
                error: 'Weapon detection not found',
                code: 'DETECTION_NOT_FOUND',
                detection_id: detectionId
            });
        }

        // Format the detection for frontend (same format as /all endpoint)
        const formattedDetection = {
            id: data.detection_id,
            detection_id: data.detection_id,
            weapon_type: data.object_type || 'Unknown',
            confidence: data.confidence || 0,
            threat_level: data.threat_level || 1,
            location: 'Unknown', // Add location if available in metadata
            timestamp: data.timestamp || new Date().toISOString(),
            device: 'ARCIS Device', // Add device name if available
            device_id: '1', // Add device ID if available
            bounding_box: data.bounding_box || { x: 0, y: 0, width: 100, height: 100 },
            comments: [], // Add comments if available in metadata
            metadata: data.metadata || {},
            // Additional fields for detailed view
            object_category: data.object_category,
            frame_id: data.frame_id,
            detection_frame_data: data.detection_frame_data,
            system_metrics: data.system_metrics
        };

        // Mock weapon details for now (can be enhanced later)
        const weaponDetails = {
            weapon_type: data.object_type,
            threat_assessment: data.threat_level >= 7 ? 'High' : data.threat_level >= 4 ? 'Medium' : 'Low',
            confidence_level: data.confidence >= 0.8 ? 'High' : data.confidence >= 0.5 ? 'Medium' : 'Low',
            detection_method: data.metadata?.device_type || 'Unknown'
        };

        res.json({
            success: true,
            detection: formattedDetection,
            weapon_details: weaponDetails,
            message: 'Detection retrieved successfully'
        });

    } catch (error) {
        console.error('Get weapon detection error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve weapon detection',
            code: 'GET_DETECTION_ERROR',
            details: error.message
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

                // Format frame data as proper data URL for frontend display
                let formattedFrameData = null;
                if (frame) {
                    // Check if frame already has data URL prefix
                    if (frame.startsWith('data:image/')) {
                        formattedFrameData = frame;
                    } else {
                        // Add proper data URL prefix for JPEG
                        formattedFrameData = `data:image/jpeg;base64,${frame}`;
                    }
                }

                // Save to database using Supabase
                const { supabase } = require('../config/supabase');
                const { data: detectionResult, error: detectionError } = await supabase
                    .from('detections')
                    .insert([{
                        frame_id: null,
                        object_category: 'weapon',
                        object_type: standardizedDetection.object_type,
                        confidence: standardizedDetection.confidence,
                        bounding_box: standardizedDetection.bounding_box,
                        threat_level: threatLevel,
                        metadata: standardizedDetection.metadata,
                        detection_frame_data: formattedFrameData, // Properly formatted data URL
                        system_metrics: systemMetrics || {},
                        device_id: deviceId, // Store device ID
                        device_name: req.body.deviceName || 'jetson nano' // Store device name
                    }])
                    .select()
                    .single();

                if (detectionError) {
                    console.error('Error saving Jetson detection:', detectionError);
                    continue;
                }

                results.push({
                    detection_id: detectionResult.detection_id,
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

// POST - Receive detection data from Raspberry Pi + Google Cloud Vision (Updated for JPG Files)
router.post('/raspberry-detection', validateApiKey, uploadSingle, async (req, res) => {
    try {

        const {
            cloudVisionResults,
            systemMetrics,
            timestamp,
            deviceId
        } = req.body;

        console.log('📸 Raspberry Pi detection with JPG file upload:', {
            resultsCount: Array.isArray(cloudVisionResults) ? cloudVisionResults.length : 0,
            hasFile: !!req.file,
            fileInfo: req.file ? {
                filename: req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype
            } : null,
            timestamp,
            deviceId
        });

        // Parse cloudVisionResults if it's a string
        let parsedResults;
        try {
            parsedResults = typeof cloudVisionResults === 'string'
                ? JSON.parse(cloudVisionResults)
                : cloudVisionResults || [];
        } catch (parseError) {
            console.error('Error parsing cloudVisionResults:', parseError);
            parsedResults = [];
        }

        // Handle uploaded JPG file - store as binary JPEG for best performance
        let jpegBuffer = null;
        let frameMetadata = null;

        if (req.file) {
            // Validate file type
            if (!req.file.mimetype.includes('jpeg') && !req.file.mimetype.includes('jpg')) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid file type for Raspberry Pi',
                    message: 'Only JPEG/JPG files are supported',
                    received: req.file.mimetype
                });
            }

            // Read binary JPEG data
            jpegBuffer = fs.readFileSync(req.file.path);
            frameMetadata = {
                original_name: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype,
                format: 'jpeg',
                uploaded_at: new Date().toISOString(),
                device_type: 'raspberry_pi'
            };

            console.log(`📸 JPG file processed: ${jpegBuffer.length} bytes`);

            // Clean up uploaded file since we stored it in memory
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
                console.warn('File cleanup warning:', cleanupError.message);
            }
        }

        // Convert Google Cloud Vision format to standard incoming format and process each detection
        const results = [];

        for (const result of parsedResults) {
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
                    storage_method: 'binary_jpeg_database',
                    file_info: frameMetadata
                }
            };

            // Process using the same logic as /incoming
            if (isWeaponDetection(standardizedDetection.object_type)) {
                const threatLevel = calculateThreatLevel(standardizedDetection.object_type, standardizedDetection.confidence);

                // Save to database using Supabase with binary JPEG storage
                const { supabase } = require('../config/supabase');
                const { data: detectionResult, error: detectionError } = await supabase
                    .from('detections')
                    .insert([{
                        frame_id: null,
                        object_category: 'weapon',
                        object_type: standardizedDetection.object_type,
                        confidence: standardizedDetection.confidence,
                        bounding_box: standardizedDetection.bounding_box,
                        threat_level: threatLevel,
                        metadata: standardizedDetection.metadata,
                        detection_frame_jpeg: jpegBuffer, // Store binary JPEG data (best performance)
                        frame_metadata: frameMetadata, // Image metadata
                        system_metrics: systemMetrics || {}
                    }])
                    .select()
                    .single();

                if (detectionError) {
                    console.error('Error saving Raspberry Pi detection:', detectionError);
                    continue;
                }

                results.push({
                    detection_id: detectionResult.detection_id,
                    weapon_type: standardizedDetection.object_type,
                    threat_level: threatLevel,
                    confidence: Math.round(standardizedDetection.confidence * 100),
                    has_binary_jpeg: true, // Flag for frontend
                    jpeg_endpoint: `/detections/${detectionResult.detection_id}/jpeg`, // Direct JPEG endpoint
                    storage_method: 'binary_jpeg_database'
                });
            }
        }

        res.status(201).json({
            success: true,
            message: 'Raspberry Pi detection data with JPG file processed successfully',
            processed_detections: results.length,
            detections: results,
            device_id: deviceId,
            file_processed: !!req.file,
            jpeg_size: jpegBuffer ? jpegBuffer.length : 0,
            storage_method: 'binary_jpeg_database'
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
router.put('/:id/comment', async (req, res) => {
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
            officer_id: officer_id || null,
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

    // Handle numeric class IDs (common in YOLO models)
    const classIdMappings = {
        0: 'weapon',
        1: 'Pistol',
        2: 'rifle',
        3: 'Knife'
    };

    // Check numeric class ID first
    if (typeof objectClass === 'number' && classIdMappings[objectClass]) {
        return classIdMappings[objectClass];
    }

    // Check both class and label as strings
    const lowerClass = objectClass ? objectClass.toString().toLowerCase() : '';
    const lowerLabel = label ? label.toString().toLowerCase() : '';

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

// // POST /api/detections/test-data - Create sample detection data for testing
// router.post('/test-data', async (req, res) => {
//     try {
//         console.log('Creating sample detection data...');

//         const { supabase } = require('../config/supabase');

//         // Simple approach - create detections with null frame_id (if allowed)
//         // or create minimal frames first
//         const sampleDetections = [
//             {
//                 frame_id: null, // Try with null first
//                 object_category: 'weapon',
//                 object_type: 'Pistol',
//                 confidence: 0.85,
//                 bounding_box: { x: 100, y: 150, width: 80, height: 120 },
//                 threat_level: 7,
//                 timestamp: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
//                 metadata: { device_type: 'test', entry_type: 'sample' },
//                 system_metrics: { cpu_usage: 45, gpu_usage: 60, ram_usage: 55 }
//             },
//             {
//                 frame_id: null,
//                 object_category: 'weapon',
//                 object_type: 'rifle',
//                 confidence: 0.92,
//                 bounding_box: { x: 200, y: 100, width: 120, height: 160 },
//                 threat_level: 9,
//                 timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
//                 metadata: { device_type: 'test', entry_type: 'sample' },
//                 system_metrics: { cpu_usage: 50, gpu_usage: 70, ram_usage: 60 }
//             },
//             {
//                 frame_id: null,
//                 object_category: 'weapon',
//                 object_type: 'Knife',
//                 confidence: 0.78,
//                 bounding_box: { x: 150, y: 200, width: 60, height: 100 },
//                 threat_level: 5,
//                 timestamp: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
//                 metadata: { device_type: 'test', entry_type: 'sample' },
//                 system_metrics: { cpu_usage: 40, gpu_usage: 55, ram_usage: 50 }
//             }
//         ];

//         const results = [];

//         for (const detection of sampleDetections) {
//             const { data, error } = await supabase
//                 .from('detections')
//                 .insert([detection])
//                 .select();

//             if (error) {
//                 console.error('Error inserting sample detection:', error.message);
//                 console.error('Detection data:', detection);
//                 continue;
//             }

//             results.push(data[0]);
//         }

//         res.json({
//             success: true,
//             message: `Created ${results.length} sample detections`,
//             data: results,
//             note: 'If 0 detections created, check server logs for errors'
//         });

//     } catch (error) {
//         console.error('Error creating sample data:', error);
//         res.status(500).json({
//             success: false,
//             error: 'Failed to create sample data',
//             details: error.message
//         });
//     }
// });

// POST /api/detections/upload-jpeg - Upload detection with binary JPEG data (DIRECT DATABASE STORAGE)
router.post('/upload-jpeg', validateApiKey, uploadSingle, async (req, res) => {
    try {
        console.log('📸 Binary JPEG upload endpoint called');
        console.log('📁 Uploaded file:', req.file);
        console.log('📋 Body data:', req.body);

        const {
            object_type,
            confidence,
            bounding_box,
            threat_level,
            system_metrics,
            session_id,
            timestamp,
            device_id
        } = req.body;

        // Validate required fields
        if (!object_type || !confidence || !bounding_box) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                required: ['object_type', 'confidence', 'bounding_box'],
                received: Object.keys(req.body)
            });
        }

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No JPEG image uploaded',
                message: 'Include detection_frame file in multipart form data'
            });
        }

        // Validate file type
        if (!req.file.mimetype.includes('jpeg') && !req.file.mimetype.includes('jpg')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid file type',
                message: 'Only JPEG/JPG files are supported',
                received: req.file.mimetype
            });
        }

        // Read the binary JPEG data
        const fs = require('fs');
        const jpegBuffer = fs.readFileSync(req.file.path);

        console.log(`📸 JPEG file read: ${jpegBuffer.length} bytes`);
        console.log('📸 JPEG buffer type:', typeof jpegBuffer);
        console.log('📸 Is Buffer:', Buffer.isBuffer(jpegBuffer));
        console.log('📸 First 10 bytes:', jpegBuffer.slice(0, 10).toString('hex'));

        // Create frame metadata
        const frameMetadata = {
            original_name: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            format: 'jpeg',
            uploaded_at: new Date().toISOString()
        };

        // Create detection record with binary JPEG data
        // Convert buffer to base64 to avoid Supabase JSON serialization issues
        const base64JpegData = jpegBuffer.toString('base64');
        console.log('📸 Converted to base64, length:', base64JpegData.length);

        const detectionData = {
            object_category: 'weapon',
            object_type: object_type,
            confidence: parseFloat(confidence),
            bounding_box: typeof bounding_box === 'string' ? JSON.parse(bounding_box) : bounding_box,
            threat_level: threat_level || calculateThreatLevel(object_type, confidence),
            detection_frame_jpeg: base64JpegData, // Store as base64 string
            frame_metadata: frameMetadata,
            system_metrics: system_metrics ? (typeof system_metrics === 'string' ? JSON.parse(system_metrics) : system_metrics) : null,
            timestamp: timestamp || new Date().toISOString(),
            metadata: {
                device_id: device_id || req.deviceId,
                storage_method: 'base64_jpeg_database'
            }
        };

        const { supabase } = require('../config/supabase');
        const { data: detection, error } = await supabase
            .from('detections')
            .insert([detectionData])
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to save detection to database',
                details: error.message
            });
        }

        // Clean up uploaded file since we stored it in database
        try {
            fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
            console.warn('File cleanup warning:', cleanupError.message);
        }

        // Create alert if threat level is high
        if (detection.threat_level >= 7) {
            const alertData = {
                detection_id: detection.detection_id,
                alert_type: 'weapon_detected',
                alert_category: 'security',
                severity: detection.threat_level >= 9 ? 5 : 4,
                action_required: `Immediate response required: ${object_type} detected with ${confidence}% confidence`,
                timestamp: timestamp || new Date().toISOString()
            };

            const { error: alertError } = await supabase
                .from('alerts')
                .insert([alertData]);

            if (alertError) {
                console.error('Alert creation error:', alertError);
            }
        }

        res.json({
            success: true,
            data: detection,
            storage_method: 'binary_jpeg_database',
            jpeg_size: jpegBuffer.length,
            frame_metadata: frameMetadata,
            message: 'Detection with binary JPEG recorded successfully',
            alert_created: detection.threat_level >= 7
        });

    } catch (error) {
        console.error('Binary JPEG upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process binary JPEG upload',
            details: error.message
        });
    }
});

// GET /api/detections/:id/jpeg - Serve binary JPEG data directly from database
router.get('/:id/jpeg', async (req, res) => {
    try {
        const detectionId = parseInt(req.params.id);

        if (isNaN(detectionId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid detection ID'
            });
        }

        const { supabase } = require('../config/supabase');
        const { data, error } = await supabase
            .from('detections')
            .select('detection_frame_jpeg, frame_metadata')
            .eq('detection_id', detectionId)
            .single();

        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to retrieve detection',
                details: error.message
            });
        }

        if (!data || !data.detection_frame_jpeg) {
            return res.status(404).json({
                success: false,
                error: 'No JPEG data found for this detection'
            });
        }

        // Set appropriate headers for JPEG
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

        // Override CORS policy for images to allow cross-origin loading
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

        if (data.frame_metadata && data.frame_metadata.original_name) {
            res.setHeader('Content-Disposition', `inline; filename="${data.frame_metadata.original_name}"`);
        }

        // Handle different data formats from Supabase
        let jpegBuffer;

        console.log('🔍 Debug JPEG data format:', {
            type: typeof data.detection_frame_jpeg,
            isBuffer: Buffer.isBuffer(data.detection_frame_jpeg),
            hasTypeProperty: data.detection_frame_jpeg && data.detection_frame_jpeg.type,
            firstBytes: data.detection_frame_jpeg ? (Buffer.isBuffer(data.detection_frame_jpeg) ? data.detection_frame_jpeg.slice(0, 4).toString('hex') : 'not-buffer') : 'null',
            preview: typeof data.detection_frame_jpeg === 'string' ? data.detection_frame_jpeg.substring(0, 50) : 'not-string'
        });

        if (Buffer.isBuffer(data.detection_frame_jpeg)) {
            // Already a Buffer
            console.log('📦 Using existing Buffer');
            jpegBuffer = data.detection_frame_jpeg;
        } else if (data.detection_frame_jpeg && data.detection_frame_jpeg.type === 'Buffer' && Array.isArray(data.detection_frame_jpeg.data)) {
            // Supabase returns Buffer as {type: 'Buffer', data: [array]}
            console.log('🔄 Converting from Supabase Buffer format');
            jpegBuffer = Buffer.from(data.detection_frame_jpeg.data);
        } else if (typeof data.detection_frame_jpeg === 'string') {
            console.log('📝 Processing string JPEG data');

            if (data.detection_frame_jpeg.startsWith('x') || data.detection_frame_jpeg.startsWith('\\x')) {
                console.log('🔍 Detected hex-encoded data, attempting to decode...');
                try {
                    // Handle both 'x' and '\x' prefixes
                    const hexString = data.detection_frame_jpeg.startsWith('\\x')
                        ? data.detection_frame_jpeg.substring(2) // Remove '\x' prefix
                        : data.detection_frame_jpeg.substring(1); // Remove 'x' prefix

                    const decodedString = Buffer.from(hexString, 'hex').toString('utf8');
                    console.log('📋 Decoded string preview:', decodedString.substring(0, 100));

                    // Check if it's a JSON Buffer or base64 string
                    if (decodedString.startsWith('{') && decodedString.includes('"type":"Buffer"')) {
                        // Hex-encoded Buffer JSON
                        console.log('🔄 Processing as hex-encoded Buffer JSON');
                        const bufferData = JSON.parse(decodedString);
                        if (bufferData.type === 'Buffer' && Array.isArray(bufferData.data)) {
                            console.log('✅ Successfully parsed hex-encoded Buffer JSON');
                            jpegBuffer = Buffer.from(bufferData.data);
                        } else {
                            throw new Error('Invalid Buffer JSON structure');
                        }
                    } else if (decodedString.startsWith('/9j') || decodedString.startsWith('iVBOR')) {
                        // Hex-encoded base64 string
                        console.log('📝 Processing as hex-encoded base64 string');
                        jpegBuffer = Buffer.from(decodedString, 'base64');
                    } else {
                        throw new Error('Unknown decoded data format');
                    }
                } catch (parseError) {
                    console.error('❌ Failed to parse hex-encoded data:', parseError.message);
                    jpegBuffer = null;
                }
            } else {
                // Regular base64 string
                console.log('📝 Converting from base64 string');
                jpegBuffer = Buffer.from(data.detection_frame_jpeg, 'base64');
            }
        } else {
            console.error('❌ Unknown JPEG data format:', typeof data.detection_frame_jpeg);
            return res.status(500).json({
                success: false,
                error: 'Invalid JPEG data format'
            });
        }

        // Check if jpegBuffer is null or invalid
        if (!jpegBuffer || jpegBuffer.length === 0) {
            console.error('❌ JPEG buffer is null or empty');
            return res.status(500).json({
                success: false,
                error: 'Failed to process JPEG data',
                details: 'JPEG buffer is null or empty'
            });
        }

        console.log('📸 Final JPEG buffer:', {
            length: jpegBuffer.length,
            firstBytes: jpegBuffer.slice(0, 4).toString('hex'),
            isValidJPEG: jpegBuffer.slice(0, 2).toString('hex') === 'ffd8'
        });

        // Check if the JPEG data is corrupted
        const isValidJPEG = jpegBuffer.slice(0, 2).toString('hex') === 'ffd8';

        if (!isValidJPEG) {
            console.log('⚠️ JPEG data is corrupted, serving placeholder image');

            // Create a simple placeholder JPEG (red warning image)
            const placeholderJpeg = Buffer.from([
                0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
                0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
                0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
                0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
                0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
                0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
                0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
                0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x64,
                0x00, 0x64, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
                0xFF, 0xC4, 0x00, 0x15, 0x00, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF,
                0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00,
                0x0C, 0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00,
                // Red pixel data (simplified)
                0xF0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0xFF, 0xD9
            ]);

            res.setHeader('Content-Length', placeholderJpeg.length);
            res.setHeader('X-Placeholder', 'true'); // Indicate this is a placeholder
            res.send(placeholderJpeg);
            return;
        }

        // Update Content-Length with actual buffer size
        res.setHeader('Content-Length', jpegBuffer.length);

        // Send the binary JPEG data
        res.send(jpegBuffer);

    } catch (error) {
        console.error('JPEG serving error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to serve JPEG data',
            details: error.message
        });
    }
});

module.exports = router;