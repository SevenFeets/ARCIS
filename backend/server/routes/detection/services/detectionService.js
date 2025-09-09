const { supabaseDb } = require('../../../config/db');
const { calculateThreatLevel, isWeaponDetection, formatDetectionForFrontend } = require('../detectionHelpers');

/**
 * Detection Service - Handles core detection business logic
 */
class DetectionService {
    constructor() {
        this.supabase = require('../../../config/supabase').supabase;
    }

    /**
     * Create a new detection record
     * @param {Object} detectionData - Detection data to save
     * @returns {Promise<Object>} Created detection record
     */
    async createDetection(detectionData) {
        const { data, error } = await this.supabase
            .from('detections')
            .insert([detectionData])
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create detection: ${error.message}`);
        }

        return data;
    }

    /**
     * Get detection by ID
     * @param {number} detectionId - Detection ID
     * @returns {Promise<Object>} Detection record
     */
    async getDetectionById(detectionId) {
        const { data, error } = await this.supabase
            .from('detections')
            .select('*')
            .eq('detection_id', detectionId)
            .single();

        if (error) {
            throw new Error(`Failed to get detection: ${error.message}`);
        }

        return data;
    }

    /**
     * Get recent detections
     * @param {number} limit - Maximum number of detections to return
     * @returns {Promise<Array>} Array of recent detections
     */
    async getRecentDetections(limit = 50) {
        const { data, error } = await this.supabase
            .from('detections')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) {
            throw new Error(`Failed to get recent detections: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Get detections by threat level
     * @param {number} minThreatLevel - Minimum threat level
     * @returns {Promise<Array>} Array of high-threat detections
     */
    async getDetectionsByThreatLevel(minThreatLevel) {
        const { data, error } = await this.supabase
            .from('detections')
            .select('*')
            .gte('threat_level', minThreatLevel)
            .order('timestamp', { ascending: false });

        if (error) {
            throw new Error(`Failed to get detections by threat level: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Get detections by weapon type
     * @param {string} weaponType - Type of weapon
     * @returns {Promise<Array>} Array of detections for weapon type
     */
    async getDetectionsByWeaponType(weaponType) {
        const { data, error } = await this.supabase
            .from('detections')
            .select('*')
            .eq('object_type', weaponType)
            .order('timestamp', { ascending: false });

        if (error) {
            throw new Error(`Failed to get detections by weapon type: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Get manual detection entries
     * @returns {Promise<Array>} Array of manual detections
     */
    async getManualDetections() {
        const { data, error } = await this.supabase
            .from('detections')
            .select('*')
            .or('metadata->>device_type.eq.manual_entry,metadata->>entry_type.eq.manual')
            .order('timestamp', { ascending: false });

        if (error) {
            throw new Error(`Failed to get manual detections: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Delete detection by ID
     * @param {number} detectionId - Detection ID to delete
     * @returns {Promise<Object>} Deleted detection info
     */
    async deleteDetection(detectionId) {
        // First get the detection details
        const detection = await this.getDetectionById(detectionId);

        // Delete related records first
        await this.deleteRelatedRecords(detectionId);

        // Delete the main detection record
        const { error } = await this.supabase
            .from('detections')
            .delete()
            .eq('detection_id', detectionId);

        if (error) {
            throw new Error(`Failed to delete detection: ${error.message}`);
        }

        return {
            id: detection.detection_id,
            weapon_type: detection.object_type,
            threat_level: detection.threat_level,
            deleted_at: new Date().toISOString()
        };
    }

    /**
     * Delete all detections
     * @returns {Promise<Object>} Deletion summary
     */
    async deleteAllDetections() {
        // Get all detection IDs first
        const { data: allDetections, error: fetchError } = await this.supabase
            .from('detections')
            .select('detection_id, object_type, threat_level');

        if (fetchError) {
            throw new Error(`Failed to fetch detections for deletion: ${fetchError.message}`);
        }

        if (!allDetections || allDetections.length === 0) {
            throw new Error('No detection records found to delete');
        }

        const detectionIds = allDetections.map(d => d.detection_id);

        // Delete related records for all detections
        await this.deleteAllRelatedRecords(detectionIds);

        // Delete all detections
        const { error: deleteError } = await this.supabase
            .from('detections')
            .delete()
            .in('detection_id', detectionIds);

        if (deleteError) {
            throw new Error(`Failed to delete detections: ${deleteError.message}`);
        }

        return {
            deleted_count: detectionIds.length,
            deleted_detections: allDetections.map(detection => ({
                id: detection.detection_id,
                weapon_type: detection.object_type,
                threat_level: detection.threat_level
            })),
            deleted_at: new Date().toISOString()
        };
    }

    /**
     * Add comment to detection
     * @param {number} detectionId - Detection ID
     * @param {string} comment - Comment text
     * @param {number} userId - User ID
     * @param {string} userName - User name
     * @returns {Promise<Object>} Added comment info
     */
    async addComment(detectionId, comment, userId = 1, userName = 'Anonymous User') {
        const detection = await this.getDetectionById(detectionId);

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
            user_id: userId,
            user_name: userName,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString()
        };

        // Add comment to metadata
        metadata.comments.push(newComment);

        // Update detection with new metadata
        const { error } = await this.supabase
            .from('detections')
            .update({ metadata: metadata })
            .eq('detection_id', detectionId);

        if (error) {
            throw new Error(`Failed to add comment: ${error.message}`);
        }

        return {
            comment: newComment,
            total_comments: metadata.comments.length
        };
    }

    /**
     * Get detection statistics
     * @returns {Promise<Object>} Detection statistics
     */
    async getDetectionStats() {
        const recentDetections = await this.getRecentDetections(100);

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

        return stats;
    }

    /**
     * Process batch detections
     * @param {Array} detections - Array of detection data
     * @returns {Promise<Object>} Processing results
     */
    async processBatchDetections(detections) {
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

                const result = await this.createDetection(detectionData);
                results.push(result);

            } catch (error) {
                errors.push({
                    index: i,
                    error: error.message,
                    detection: detections[i]
                });
            }
        }

        return {
            processed: results.length,
            errors: errors.length,
            data: results,
            error_details: errors
        };
    }

    /**
     * Delete related records for a detection
     * @param {number} detectionId - Detection ID
     * @private
     */
    async deleteRelatedRecords(detectionId) {
        // Delete weapon_detections records
        await this.supabase
            .from('weapon_detections')
            .delete()
            .eq('detection_id', detectionId);

        // Delete alerts records
        await this.supabase
            .from('alerts')
            .delete()
            .eq('detection_id', detectionId);

        // Delete detection_annotations records
        await this.supabase
            .from('detection_annotations')
            .delete()
            .eq('detection_id', detectionId);
    }

    /**
     * Delete all related records for multiple detections
     * @param {Array} detectionIds - Array of detection IDs
     * @private
     */
    async deleteAllRelatedRecords(detectionIds) {
        // Delete alerts first (they reference detections)
        await this.supabase
            .from('alerts')
            .delete()
            .in('detection_id', detectionIds);

        // Delete weapon_detections
        await this.supabase
            .from('weapon_detections')
            .delete()
            .in('detection_id', detectionIds);

        // Delete detection_annotations
        await this.supabase
            .from('detection_annotations')
            .delete()
            .in('detection_id', detectionIds);
    }
}

module.exports = DetectionService;
