/**
 * Alert Service - Handles alert creation and management
 */
class AlertService {
    constructor() {
        this.supabase = require('../../../config/supabase').supabase;
    }

    /**
     * Create alert for high-threat detections
     * @param {Object} detection - Detection data
     * @returns {Promise<Object|null>} Created alert or null if no alert needed
     */
    async createThreatAlert(detection) {
        // Only create alerts for high threat levels
        if (detection.threat_level < 7) {
            return null;
        }

        const alertData = {
            detection_id: detection.detection_id,
            alert_type: 'weapon_detected',
            alert_category: 'security',
            severity: detection.threat_level >= 9 ? 5 : 4,
            action_required: `Immediate response required: ${detection.object_type} detected with ${Math.round(detection.confidence * 100)}% confidence`,
            timestamp: detection.timestamp || new Date().toISOString()
        };

        try {
            const { data, error } = await this.supabase
                .from('alerts')
                .insert([alertData])
                .select()
                .single();

            if (error) {
                console.error('Failed to create alert:', error);
                return null;
            }

            console.log(`Created alert for detection ${detection.detection_id} with threat level ${detection.threat_level}`);
            return data;
        } catch (error) {
            console.error('Alert creation error:', error);
            return null;
        }
    }

    /**
     * Create alert with custom data
     * @param {Object} alertData - Custom alert data
     * @returns {Promise<Object>} Created alert
     */
    async createCustomAlert(alertData) {
        const { data, error } = await this.supabase
            .from('alerts')
            .insert([alertData])
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create alert: ${error.message}`);
        }

        return data;
    }

    /**
     * Get alerts for a detection
     * @param {number} detectionId - Detection ID
     * @returns {Promise<Array>} Array of alerts
     */
    async getAlertsForDetection(detectionId) {
        const { data, error } = await this.supabase
            .from('alerts')
            .select('*')
            .eq('detection_id', detectionId)
            .order('timestamp', { ascending: false });

        if (error) {
            throw new Error(`Failed to get alerts: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Get recent alerts
     * @param {number} limit - Maximum number of alerts to return
     * @returns {Promise<Array>} Array of recent alerts
     */
    async getRecentAlerts(limit = 50) {
        const { data, error } = await this.supabase
            .from('alerts')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) {
            throw new Error(`Failed to get recent alerts: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Update alert status
     * @param {number} alertId - Alert ID
     * @param {string} status - New status
     * @returns {Promise<Object>} Updated alert
     */
    async updateAlertStatus(alertId, status) {
        const { data, error } = await this.supabase
            .from('alerts')
            .update({ status: status, updated_at: new Date().toISOString() })
            .eq('alert_id', alertId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update alert: ${error.message}`);
        }

        return data;
    }

    /**
     * Delete alert
     * @param {number} alertId - Alert ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteAlert(alertId) {
        const { error } = await this.supabase
            .from('alerts')
            .delete()
            .eq('alert_id', alertId);

        if (error) {
            throw new Error(`Failed to delete alert: ${error.message}`);
        }

        return true;
    }

    /**
     * Determine if alert should be created based on detection
     * @param {Object} detection - Detection data
     * @returns {boolean} Whether alert should be created
     */
    shouldCreateAlert(detection) {
        return detection.threat_level >= 7;
    }

    /**
     * Calculate alert severity based on threat level
     * @param {number} threatLevel - Threat level (1-10)
     * @returns {number} Alert severity (1-5)
     */
    calculateAlertSeverity(threatLevel) {
        if (threatLevel >= 9) return 5; // Critical
        if (threatLevel >= 7) return 4; // High
        if (threatLevel >= 5) return 3; // Medium
        if (threatLevel >= 3) return 2; // Low
        return 1; // Very Low
    }

    /**
     * Generate alert message based on detection
     * @param {Object} detection - Detection data
     * @returns {string} Alert message
     */
    generateAlertMessage(detection) {
        const confidence = Math.round(detection.confidence * 100);
        return `${detection.object_type.toUpperCase()} detected with ${confidence}% confidence. Threat level: ${detection.threat_level}/10`;
    }

    /**
     * Generate action required text based on detection
     * @param {Object} detection - Detection data
     * @returns {string} Action required text
     */
    generateActionRequired(detection) {
        const confidence = Math.round(detection.confidence * 100);

        if (detection.threat_level >= 9) {
            return `CRITICAL: Immediate response required - ${detection.object_type} detected with ${confidence}% confidence`;
        } else if (detection.threat_level >= 7) {
            return `HIGH PRIORITY: Response required - ${detection.object_type} detected with ${confidence}% confidence`;
        } else {
            return `Monitor situation - ${detection.object_type} detected with ${confidence}% confidence`;
        }
    }
}

module.exports = AlertService;
