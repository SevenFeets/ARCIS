const DetectionService = require('../services/detectionService');
const AlertService = require('../services/alertService');
const {
    validateRequiredFields,
    validateConfidence,
    validateWeaponType,
    formatDetectionForFrontend,
    createApiResponse,
    createErrorResponse,
    calculateThreatLevel
} = require('../detectionHelpers');

/**
 * Detection Controller - Handles basic CRUD operations for detections
 */
class DetectionController {
    constructor() {
        this.detectionService = new DetectionService();
        this.alertService = new AlertService();
    }

    /**
     * Get all detections
     */
    async getAllDetections(req, res) {
        try {
            console.log('Getting all detections...');

            const detections = await this.detectionService.getRecentDetections(100);

            if (detections.length === 0) {
                return res.json(createApiResponse(true, [], 'No detections found (database empty)', { total: 0 }));
            }

            // Format for frontend
            const formattedDetections = detections.map(formatDetectionForFrontend);

            res.json(createApiResponse(true, formattedDetections, 'Detections retrieved successfully', { total: formattedDetections.length }));

        } catch (error) {
            console.error('Get all detections error:', error);
            res.status(500).json(createErrorResponse('Failed to retrieve all detections', 'GET_ALL_DETECTIONS_ERROR', error.message));
        }
    }

    /**
     * Get recent detections with optional filtering
     */
    async getRecentDetections(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 50;
            const minThreatLevel = parseInt(req.query.min_threat_level) || 0;

            let detections;
            if (minThreatLevel > 0) {
                detections = await this.detectionService.getDetectionsByThreatLevel(minThreatLevel);
            } else {
                detections = await this.detectionService.getRecentDetections(limit);
            }

            res.json(createApiResponse(true, detections, 'Recent detections retrieved successfully', { count: detections.length }));

        } catch (error) {
            console.error('Get recent detections error:', error);
            res.status(500).json(createErrorResponse('Failed to retrieve detections', 'GET_DETECTIONS_ERROR', error.message));
        }
    }

    /**
     * Get detection by ID
     */
    async getDetectionById(req, res) {
        try {
            const detectionId = parseInt(req.params.id);

            if (isNaN(detectionId)) {
                return res.status(400).json(createErrorResponse('Invalid detection ID', 'INVALID_ID'));
            }

            console.log(`Getting detection by ID: ${detectionId}`);

            const detection = await this.detectionService.getDetectionById(detectionId);

            if (!detection) {
                return res.status(404).json(createErrorResponse('Weapon detection not found', 'DETECTION_NOT_FOUND', { detection_id: detectionId }));
            }

            // Format the detection for frontend
            const formattedDetection = formatDetectionForFrontend(detection);

            // Add additional fields for detailed view
            formattedDetection.object_category = detection.object_category;
            formattedDetection.frame_id = detection.frame_id;
            formattedDetection.detection_frame_data = detection.detection_frame_data;
            formattedDetection.system_metrics = detection.system_metrics;

            // Mock weapon details for now
            const weaponDetails = {
                weapon_type: detection.object_type,
                threat_assessment: detection.threat_level >= 7 ? 'High' : detection.threat_level >= 4 ? 'Medium' : 'Low',
                confidence_level: detection.confidence >= 0.8 ? 'High' : detection.confidence >= 0.5 ? 'Medium' : 'Low',
                detection_method: detection.metadata?.device_type || 'Unknown'
            };

            res.json(createApiResponse(true, { detection: formattedDetection, weapon_details: weaponDetails }, 'Detection retrieved successfully'));

        } catch (error) {
            console.error('Get weapon detection error:', error);
            res.status(500).json(createErrorResponse('Failed to retrieve weapon detection', 'GET_DETECTION_ERROR', error.message));
        }
    }

    /**
     * Get detections by weapon type
     */
    async getDetectionsByWeaponType(req, res) {
        try {
            const weaponType = req.params.type;
            console.log(`Getting detections for weapon type: ${weaponType}`);

            // Validate weapon type
            const validation = validateWeaponType(weaponType);
            if (!validation.isValid) {
                return res.status(400).json(createErrorResponse(validation.error, 'INVALID_WEAPON_TYPE'));
            }

            const detections = await this.detectionService.getDetectionsByWeaponType(weaponType);

            // Format for frontend
            const formattedDetections = detections.map(detection => ({
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
            res.status(500).json(createErrorResponse('Failed to retrieve detections by weapon type', 'GET_DETECTIONS_BY_TYPE_ERROR', error.message));
        }
    }

    /**
     * Create new detection
     */
    async createDetection(req, res) {
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
            const validation = validateRequiredFields(req.body, ['object_type', 'confidence', 'bounding_box']);
            if (!validation.isValid) {
                return res.status(400).json(createErrorResponse('Missing required fields', 'MISSING_REQUIRED_FIELDS', {
                    required: ['object_type', 'confidence', 'bounding_box'],
                    received: validation.receivedFields
                }));
            }

            // Validate confidence
            const confValidation = validateConfidence(confidence);
            if (!confValidation.isValid) {
                return res.status(400).json(createErrorResponse(confValidation.error, 'INVALID_CONFIDENCE'));
            }

            // Create frame record if needed
            let frameId;
            if (frame_path) {
                const frameData = {
                    session_id: session_id || 1,
                    file_path: frame_path,
                    timestamp: timestamp || new Date().toISOString(),
                    processed: true,
                    metadata: system_metrics ? { system_metrics } : null
                };

                // Note: This would need to be implemented in DetectionService
                // const frame = await this.detectionService.createFrame(frameData);
                // frameId = frame.frame_id;
            }

            // Create detection record
            const detectionData = {
                frame_id: frameId,
                object_category: 'weapon',
                object_type: object_type,
                confidence: confValidation.value,
                bounding_box: bounding_box,
                threat_level: threat_level || calculateThreatLevel(object_type, confValidation.value),
                detection_frame_data: frame_data,
                system_metrics: system_metrics,
                timestamp: timestamp || new Date().toISOString()
            };

            const detection = await this.detectionService.createDetection(detectionData);

            // Create alert if threat level is high
            let alertCreated = false;
            if (this.alertService.shouldCreateAlert(detection)) {
                await this.alertService.createThreatAlert(detection);
                alertCreated = true;
            }

            res.json(createApiResponse(true, detection, 'Detection recorded successfully', { alert_created: alertCreated }));

        } catch (error) {
            console.error('Detection creation error:', error);
            res.status(500).json(createErrorResponse('Failed to create detection', 'CREATE_DETECTION_ERROR', error.message));
        }
    }

    /**
     * Delete detection by ID
     */
    async deleteDetection(req, res) {
        try {
            const detectionId = parseInt(req.params.id);

            if (isNaN(detectionId)) {
                return res.status(400).json(createErrorResponse('Invalid detection ID', 'INVALID_ID'));
            }

            console.log(`DELETE request for detection ID: ${detectionId}`);

            const deletedDetection = await this.detectionService.deleteDetection(detectionId);

            console.log(`Successfully deleted detection ${detectionId}`);

            res.json(createApiResponse(true, { deleted_detection: deletedDetection }, `Detection record ${detectionId} deleted successfully`));

        } catch (error) {
            console.error('Error deleting detection:', error);

            if (error.message.includes('not found')) {
                res.status(404).json(createErrorResponse('Detection record not found', 'DETECTION_NOT_FOUND', { detection_id: req.params.id }));
            } else {
                res.status(500).json(createErrorResponse('Failed to delete detection record', 'DELETE_DETECTION_ERROR', error.message));
            }
        }
    }

    /**
     * Delete all detections
     */
    async deleteAllDetections(req, res) {
        try {
            console.log('DELETE ALL request for all detections');

            const deletionResult = await this.detectionService.deleteAllDetections();

            console.log(`Successfully deleted all detection records and related data`);

            res.json(createApiResponse(true, deletionResult, 'Successfully deleted all detection records and related data', {
                deleted_counts: {
                    detections: deletionResult.deleted_count,
                    alerts: 'included',
                    weapon_detections: 'included',
                    annotations: 'included'
                }
            }));

        } catch (error) {
            console.error('Error deleting all detections:', error);

            if (error.message.includes('No detection records found')) {
                res.status(404).json(createErrorResponse('No detection records found to delete', 'NO_DETECTIONS_FOUND', {
                    counts: { detections: 0, alerts: 0, weapon_detections: 0, annotations: 0 }
                }));
            } else {
                res.status(500).json(createErrorResponse('Failed to delete all detection records', 'DELETE_ALL_DETECTIONS_ERROR', error.message));
            }
        }
    }

    /**
     * Add comment to detection
     */
    async addComment(req, res) {
        try {
            const detectionId = parseInt(req.params.id);
            const { comment, userId, userName } = req.body;

            console.log(`Adding comment to detection ${detectionId}:`, comment);

            // Validate input
            if (!comment || comment.trim().length === 0) {
                return res.status(400).json(createErrorResponse('Comment text is required', 'MISSING_COMMENT'));
            }

            const result = await this.detectionService.addComment(detectionId, comment, userId, userName);

            console.log(`Successfully added comment to detection ${detectionId}`);

            res.json(createApiResponse(true, {
                detection_id: detectionId,
                comment: result.comment,
                total_comments: result.total_comments
            }, 'Comment added successfully'));

        } catch (error) {
            console.error('Error adding comment:', error);

            if (error.message.includes('not found')) {
                res.status(404).json(createErrorResponse('Detection record not found', 'DETECTION_NOT_FOUND', { detection_id: req.params.id }));
            } else {
                res.status(500).json(createErrorResponse('Failed to add comment to detection', 'ADD_COMMENT_ERROR', error.message));
            }
        }
    }

    /**
     * Get detection statistics
     */
    async getDetectionStats(req, res) {
        try {
            const stats = await this.detectionService.getDetectionStats();
            res.json(createApiResponse(true, stats, 'Statistics retrieved successfully'));

        } catch (error) {
            console.error('Stats error:', error);
            res.status(500).json(createErrorResponse('Failed to get statistics', 'GET_STATS_ERROR', error.message));
        }
    }

    /**
     * Process batch detections
     */
    async processBatchDetections(req, res) {
        try {
            const { detections } = req.body;

            if (!Array.isArray(detections) || detections.length === 0) {
                return res.status(400).json(createErrorResponse('Invalid batch format', 'INVALID_BATCH_FORMAT', 'Provide detections array'));
            }

            const results = await this.detectionService.processBatchDetections(detections);

            // Create alerts for high-threat detections
            for (const detection of results.data) {
                if (this.alertService.shouldCreateAlert(detection)) {
                    await this.alertService.createThreatAlert(detection);
                }
            }

            res.json(createApiResponse(true, results, 'Batch processing completed'));

        } catch (error) {
            console.error('Batch detection error:', error);
            res.status(500).json(createErrorResponse('Batch processing failed', 'BATCH_PROCESSING_ERROR', error.message));
        }
    }
}

module.exports = DetectionController;
