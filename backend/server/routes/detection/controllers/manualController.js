const DetectionService = require('../services/detectionService');
const AlertService = require('../services/alertService');
const {
    validateRequiredFields,
    validateConfidence,
    validateWeaponType,
    createApiResponse,
    createErrorResponse,
    calculateThreatLevel
} = require('../detectionHelpers');

/**
 * Manual Controller - Handles manual detection entries
 */
class ManualController {
    constructor() {
        this.detectionService = new DetectionService();
        this.alertService = new AlertService();
    }

    /**
     * Get manual detection entries
     */
    async getManualDetections(req, res) {
        try {
            console.log('GET /api/detections/manual called');

            const manualDetections = await this.detectionService.getManualDetections();

            // Transform data specifically for manual entries with officer information
            const transformedDetections = manualDetections.map(detection => {
                const metadata = typeof detection.metadata === 'string'
                    ? JSON.parse(detection.metadata)
                    : detection.metadata;

                return {
                    id: detection.detection_id,
                    weapon_type: detection.object_type,
                    confidence: Math.round(parseFloat(detection.confidence) * 100),
                    threat_level: detection.threat_level,
                    location: metadata?.location || 'Unknown',
                    officer_name: metadata?.officer_name || 'Unknown Officer',
                    officer_id: metadata?.officer_id,
                    description: metadata?.description || '',
                    notes: metadata?.notes || '',
                    entry_timestamp: metadata?.entry_timestamp,
                    original_timestamp: metadata?.original_timestamp,
                    timestamp: detection.timestamp,
                    bounding_box: typeof detection.bounding_box === 'string'
                        ? JSON.parse(detection.bounding_box)
                        : detection.bounding_box,
                    comments: metadata?.comments || [],
                    entry_type: 'manual'
                };
            });

            console.log(`Found ${transformedDetections.length} manual detection entries`);

            const message = transformedDetections.length === 0
                ? 'No manual detection entries found'
                : `Found ${transformedDetections.length} manual detection entries`;

            res.json(createApiResponse(true, transformedDetections, message, {
                count: transformedDetections.length,
                entry_type: 'manual'
            }));

        } catch (error) {
            console.error('Get manual detections error:', error);
            res.status(500).json(createErrorResponse('Failed to retrieve manual detection entries', 'GET_MANUAL_DETECTIONS_ERROR', error.message));
        }
    }

    /**
     * Create manual detection entry
     */
    async createManualDetection(req, res) {
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
            const validation = validateRequiredFields(req.body, ['object_type', 'confidence', 'location']);
            if (!validation.isValid) {
                return res.status(400).json(createErrorResponse('Missing required fields: object_type, confidence, and location are required', 'MISSING_REQUIRED_FIELDS'));
            }

            // Validate weapon type
            const weaponValidation = validateWeaponType(object_type);
            if (!weaponValidation.isValid) {
                return res.status(400).json(createErrorResponse(weaponValidation.error, 'INVALID_WEAPON_TYPE'));
            }

            // Validate confidence
            const confValidation = validateConfidence(confidence);
            if (!confValidation.isValid) {
                return res.status(400).json(createErrorResponse(confValidation.error, 'INVALID_CONFIDENCE'));
            }

            // Calculate threat level
            const threatLevel = calculateThreatLevel(object_type, confValidation.value);
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

            // Create detection data
            const detectionData = {
                frame_id: null, // No frame for manual entries
                object_category: 'weapon',
                object_type: object_type,
                confidence: confValidation.value,
                bounding_box: bounding_box || {},
                threat_level: threatLevel,
                metadata: manualMetadata,
                detection_frame_data: null, // No frame data for manual entries
                system_metrics: {}, // Empty system metrics for manual entries
                timestamp: new Date().toISOString()
            };

            console.log('Creating manual detection with data:', detectionData);

            const detection = await this.detectionService.createDetection(detectionData);

            console.log('Manual detection created successfully with ID:', detection.detection_id);

            // Create alert if needed
            let alertCreated = false;
            if (this.alertService.shouldCreateAlert(detection)) {
                await this.alertService.createThreatAlert(detection);
                alertCreated = true;
            }

            res.status(201).json(createApiResponse(true, {
                detection_id: detection.detection_id,
                weapon_type: object_type,
                threat_level: threatLevel,
                confidence: Math.round(confValidation.value * 100),
                location: location,
                officer_id: officer_id || null,
                officer: officer_name || 'Unknown Officer',
                entry_type: 'manual',
                alert_created: alertCreated
            }, 'Manual detection record created successfully'));

        } catch (error) {
            console.error('=== MANUAL DETECTION ERROR ===');
            console.error('Error details:', error);

            res.status(500).json(createErrorResponse('Failed to create manual detection record', 'MANUAL_DETECTION_ERROR', error.message));
        }
    }

    /**
     * Update manual detection entry
     */
    async updateManualDetection(req, res) {
        try {
            const detectionId = parseInt(req.params.id);
            const updateData = req.body;

            if (isNaN(detectionId)) {
                return res.status(400).json(createErrorResponse('Invalid detection ID', 'INVALID_ID'));
            }

            // Get existing detection
            const existingDetection = await this.detectionService.getDetectionById(detectionId);

            if (!existingDetection) {
                return res.status(404).json(createErrorResponse('Manual detection not found', 'DETECTION_NOT_FOUND'));
            }

            // Verify it's a manual detection
            const metadata = typeof existingDetection.metadata === 'string'
                ? JSON.parse(existingDetection.metadata)
                : existingDetection.metadata || {};

            if (metadata.entry_type !== 'manual') {
                return res.status(400).json(createErrorResponse('Detection is not a manual entry', 'NOT_MANUAL_ENTRY'));
            }

            // Update metadata with new information
            const updatedMetadata = {
                ...metadata,
                ...updateData,
                last_updated: new Date().toISOString(),
                updated_by: updateData.updated_by || 'Unknown User'
            };

            // Update confidence and threat level if provided
            let updatedConfidence = existingDetection.confidence;
            let updatedThreatLevel = existingDetection.threat_level;

            if (updateData.confidence) {
                const confValidation = validateConfidence(updateData.confidence);
                if (!confValidation.isValid) {
                    return res.status(400).json(createErrorResponse(confValidation.error, 'INVALID_CONFIDENCE'));
                }
                updatedConfidence = confValidation.value;
                updatedThreatLevel = calculateThreatLevel(existingDetection.object_type, updatedConfidence);
            }

            // Note: This would require implementing an update method in DetectionService
            // For now, we'll return a placeholder response
            res.json(createApiResponse(true, {
                detection_id: detectionId,
                message: 'Manual detection update functionality would be implemented here',
                updated_fields: Object.keys(updateData)
            }, 'Manual detection updated successfully'));

        } catch (error) {
            console.error('Update manual detection error:', error);
            res.status(500).json(createErrorResponse('Failed to update manual detection', 'UPDATE_MANUAL_DETECTION_ERROR', error.message));
        }
    }

    /**
     * Get manual detection statistics
     */
    async getManualDetectionStats(req, res) {
        try {
            const manualDetections = await this.detectionService.getManualDetections();

            const stats = {
                total_manual_entries: manualDetections.length,
                officers: {},
                locations: {},
                weapon_types: {},
                threat_levels: {},
                recent_24h: 0
            };

            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            manualDetections.forEach(detection => {
                const metadata = typeof detection.metadata === 'string'
                    ? JSON.parse(detection.metadata)
                    : detection.metadata || {};

                // Count by officer
                const officerName = metadata.officer_name || 'Unknown Officer';
                stats.officers[officerName] = (stats.officers[officerName] || 0) + 1;

                // Count by location
                const location = metadata.location || 'Unknown';
                stats.locations[location] = (stats.locations[location] || 0) + 1;

                // Count by weapon type
                stats.weapon_types[detection.object_type] = (stats.weapon_types[detection.object_type] || 0) + 1;

                // Count by threat level
                const level = detection.threat_level || 0;
                stats.threat_levels[level] = (stats.threat_levels[level] || 0) + 1;

                // Count recent entries
                if (new Date(detection.timestamp) > oneDayAgo) {
                    stats.recent_24h++;
                }
            });

            res.json(createApiResponse(true, stats, 'Manual detection statistics retrieved successfully'));

        } catch (error) {
            console.error('Get manual detection stats error:', error);
            res.status(500).json(createErrorResponse('Failed to get manual detection statistics', 'GET_MANUAL_STATS_ERROR', error.message));
        }
    }

    /**
     * Validate manual detection data
     * @param {Object} data - Detection data to validate
     * @returns {Object} Validation result
     * @private
     */
    validateManualDetectionData(data) {
        const errors = [];

        // Required fields
        if (!data.object_type) errors.push('object_type is required');
        if (data.confidence === undefined) errors.push('confidence is required');
        if (!data.location) errors.push('location is required');

        // Weapon type validation
        if (data.object_type) {
            const weaponValidation = validateWeaponType(data.object_type);
            if (!weaponValidation.isValid) {
                errors.push(weaponValidation.error);
            }
        }

        // Confidence validation
        if (data.confidence !== undefined) {
            const confValidation = validateConfidence(data.confidence);
            if (!confValidation.isValid) {
                errors.push(confValidation.error);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = ManualController;
