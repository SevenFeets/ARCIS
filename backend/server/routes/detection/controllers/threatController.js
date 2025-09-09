const DetectionService = require('../services/detectionService');
const {
    formatDetectionForFrontend,
    createApiResponse,
    createErrorResponse
} = require('../detectionHelpers');

/**
 * Threat Controller - Handles threat-related endpoints
 */
class ThreatController {
    constructor() {
        this.detectionService = new DetectionService();
    }

    /**
     * Get high-priority threats
     */
    async getHighPriorityThreats(req, res) {
        try {
            console.log('Getting high-priority threats...');

            // Get detections with threat level 6 or higher
            const threats = await this.detectionService.getDetectionsByThreatLevel(6);

            // Format for frontend
            const formattedThreats = threats.map(threat => ({
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
                detection_frame_data: threat.detection_frame_data,
                frame_url: threat.frame_url,
                has_binary_jpeg: !!threat.detection_frame_jpeg,
                frame_metadata: threat.frame_metadata,
                jpeg_endpoint: threat.detection_frame_jpeg ? `/detections/${threat.detection_id}/jpeg` : null
            }));

            res.json({
                active_weapon_threats: formattedThreats,
                threat_count: formattedThreats.length,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Get threats error:', error);
            res.status(500).json(createErrorResponse('Failed to retrieve threats', 'GET_THREATS_ERROR', error.message));
        }
    }

    /**
     * Get weapon threats (alternative endpoint)
     */
    async getWeaponThreats(req, res) {
        try {
            const threats = await this.detectionService.getDetectionsByThreatLevel(6);

            res.json({
                active_weapon_threats: threats,
                threat_count: threats.length,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Get weapon threats error:', error);
            res.status(500).json(createErrorResponse('Failed to retrieve weapon threats', 'GET_THREATS_ERROR'));
        }
    }

    /**
     * Get threat analysis for a specific detection
     */
    async getThreatAnalysis(req, res) {
        try {
            const detectionId = parseInt(req.params.id);

            if (isNaN(detectionId)) {
                return res.status(400).json(createErrorResponse('Invalid detection ID', 'INVALID_ID'));
            }

            const detection = await this.detectionService.getDetectionById(detectionId);

            if (!detection) {
                return res.status(404).json(createErrorResponse('Detection not found', 'DETECTION_NOT_FOUND'));
            }

            // Generate threat analysis
            const threatAnalysis = this.generateThreatAnalysis(detection);

            res.json(createApiResponse(true, threatAnalysis, 'Threat analysis generated successfully'));

        } catch (error) {
            console.error('Get threat analysis error:', error);
            res.status(500).json(createErrorResponse('Failed to generate threat analysis', 'THREAT_ANALYSIS_ERROR', error.message));
        }
    }

    /**
     * Get threat level distribution
     */
    async getThreatLevelDistribution(req, res) {
        try {
            const stats = await this.detectionService.getDetectionStats();

            const distribution = {
                critical: 0,      // 9-10
                high: 0,         // 7-8
                medium: 0,       // 4-6
                low: 0,          // 1-3
                unknown: 0       // 0 or undefined
            };

            Object.entries(stats.threat_levels).forEach(([level, count]) => {
                const threatLevel = parseInt(level);
                if (threatLevel >= 9) {
                    distribution.critical += count;
                } else if (threatLevel >= 7) {
                    distribution.high += count;
                } else if (threatLevel >= 4) {
                    distribution.medium += count;
                } else if (threatLevel >= 1) {
                    distribution.low += count;
                } else {
                    distribution.unknown += count;
                }
            });

            res.json(createApiResponse(true, {
                distribution,
                total_detections: stats.total_detections,
                recent_24h: stats.recent_24h,
                timestamp: new Date().toISOString()
            }, 'Threat level distribution retrieved successfully'));

        } catch (error) {
            console.error('Get threat distribution error:', error);
            res.status(500).json(createErrorResponse('Failed to get threat distribution', 'THREAT_DISTRIBUTION_ERROR', error.message));
        }
    }

    /**
     * Get recent high-threat detections
     */
    async getRecentHighThreats(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const minThreatLevel = parseInt(req.query.min_threat_level) || 7;

            const threats = await this.detectionService.getDetectionsByThreatLevel(minThreatLevel);

            // Limit results and format for frontend
            const limitedThreats = threats.slice(0, limit);
            const formattedThreats = limitedThreats.map(formatDetectionForFrontend);

            res.json(createApiResponse(true, formattedThreats, 'Recent high threats retrieved successfully', {
                count: formattedThreats.length,
                min_threat_level: minThreatLevel,
                timestamp: new Date().toISOString()
            }));

        } catch (error) {
            console.error('Get recent high threats error:', error);
            res.status(500).json(createErrorResponse('Failed to retrieve recent high threats', 'GET_HIGH_THREATS_ERROR', error.message));
        }
    }

    /**
     * Generate comprehensive threat analysis for a detection
     * @param {Object} detection - Detection data
     * @returns {Object} Threat analysis
     * @private
     */
    generateThreatAnalysis(detection) {
        const analysis = {
            detection_id: detection.detection_id,
            weapon_type: detection.object_type,
            threat_level: detection.threat_level,
            confidence: detection.confidence,
            timestamp: detection.timestamp,

            // Risk assessment
            risk_category: this.categorizeRisk(detection.threat_level),
            confidence_category: this.categorizeConfidence(detection.confidence),

            // Threat indicators
            threat_indicators: this.generateThreatIndicators(detection),

            // Recommended actions
            recommended_actions: this.generateRecommendedActions(detection),

            // Context analysis
            context: {
                device_type: detection.metadata?.device_type || 'Unknown',
                location: detection.metadata?.location || 'Unknown',
                time_of_day: this.getTimeOfDay(detection.timestamp),
                system_metrics: detection.system_metrics
            },

            // Historical context (placeholder for future enhancement)
            historical_context: {
                similar_detections_today: 0,
                average_threat_level: detection.threat_level,
                trend: 'stable'
            }
        };

        return analysis;
    }

    /**
     * Categorize risk level based on threat level
     * @param {number} threatLevel - Threat level (1-10)
     * @returns {string} Risk category
     * @private
     */
    categorizeRisk(threatLevel) {
        if (threatLevel >= 9) return 'CRITICAL';
        if (threatLevel >= 7) return 'HIGH';
        if (threatLevel >= 4) return 'MEDIUM';
        if (threatLevel >= 1) return 'LOW';
        return 'UNKNOWN';
    }

    /**
     * Categorize confidence level
     * @param {number} confidence - Confidence value (0-1)
     * @returns {string} Confidence category
     * @private
     */
    categorizeConfidence(confidence) {
        if (confidence >= 0.9) return 'VERY_HIGH';
        if (confidence >= 0.7) return 'HIGH';
        if (confidence >= 0.5) return 'MEDIUM';
        if (confidence >= 0.3) return 'LOW';
        return 'VERY_LOW';
    }

    /**
     * Generate threat indicators
     * @param {Object} detection - Detection data
     * @returns {Array} Array of threat indicators
     * @private
     */
    generateThreatIndicators(detection) {
        const indicators = [];

        if (detection.threat_level >= 9) {
            indicators.push('CRITICAL_WEAPON_DETECTED');
        }

        if (detection.confidence >= 0.8) {
            indicators.push('HIGH_CONFIDENCE_DETECTION');
        }

        if (detection.object_type === 'rifle') {
            indicators.push('HIGH_LETHALITY_WEAPON');
        }

        if (detection.object_type === 'Pistol') {
            indicators.push('CONCEALED_WEAPON_POTENTIAL');
        }

        return indicators;
    }

    /**
     * Generate recommended actions based on threat level
     * @param {Object} detection - Detection data
     * @returns {Array} Array of recommended actions
     * @private
     */
    generateRecommendedActions(detection) {
        const actions = [];

        if (detection.threat_level >= 9) {
            actions.push('IMMEDIATE_LOCKDOWN');
            actions.push('CONTACT_LAW_ENFORCEMENT');
            actions.push('EVACUATE_AREA');
        } else if (detection.threat_level >= 7) {
            actions.push('ALERT_SECURITY_PERSONNEL');
            actions.push('MONITOR_SITUATION');
            actions.push('PREPARE_RESPONSE_TEAM');
        } else if (detection.threat_level >= 4) {
            actions.push('INCREASE_SURVEILLANCE');
            actions.push('VERIFY_DETECTION');
        } else {
            actions.push('LOG_INCIDENT');
            actions.push('ROUTINE_MONITORING');
        }

        return actions;
    }

    /**
     * Get time of day category
     * @param {string} timestamp - ISO timestamp
     * @returns {string} Time of day category
     * @private
     */
    getTimeOfDay(timestamp) {
        const hour = new Date(timestamp).getHours();

        if (hour >= 6 && hour < 12) return 'MORNING';
        if (hour >= 12 && hour < 17) return 'AFTERNOON';
        if (hour >= 17 && hour < 21) return 'EVENING';
        return 'NIGHT';
    }
}

module.exports = ThreatController;
