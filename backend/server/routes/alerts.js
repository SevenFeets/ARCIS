const express = require('express');
const { verifyToken, requireRole, requireClearance } = require('../middleware/auth');
const { validateAlert, validateId, validatePagination } = require('../middleware/validations');
const { dbUtils } = require('../config/db');
const arcjetMiddleware = require('../middleware/arcjet');

const router = express.Router();

// Apply rate limiting
router.use(arcjetMiddleware);

// GET /api/alerts - Get all weapon detection alerts
router.get('/', verifyToken, requireClearance(2), validatePagination, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const severity = req.query.severity;
        const active_only = req.query.active_only === 'true';

        let alerts;
        if (active_only) {
            alerts = await dbUtils.alerts.getActive();
        } else {
            alerts = await dbUtils.alerts.getUnacknowledged();
        }

        // Filter by severity if specified
        if (severity) {
            const severityNum = parseInt(severity);
            alerts = alerts.filter(alert => alert.severity >= severityNum);
        }

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedAlerts = alerts.slice(startIndex, endIndex);

        res.json({
            weapon_alerts: paginatedAlerts,
            pagination: {
                page,
                limit,
                total: alerts.length,
                pages: Math.ceil(alerts.length / limit)
            }
        });

    } catch (error) {
        console.error('Get weapon alerts error:', error);
        res.status(500).json({
            error: 'Failed to retrieve weapon alerts',
            code: 'GET_ALERTS_ERROR'
        });
    }
});

// GET /api/alerts/active - Get active weapon alerts only
router.get('/active', verifyToken, requireClearance(1), async (req, res) => {
    try {
        const activeAlerts = await dbUtils.alerts.getActive();

        res.json({
            active_weapon_alerts: activeAlerts,
            count: activeAlerts.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Get active weapon alerts error:', error);
        res.status(500).json({
            error: 'Failed to retrieve active weapon alerts',
            code: 'GET_ACTIVE_ALERTS_ERROR'
        });
    }
});

// GET /api/alerts/critical - Get critical weapon alerts
router.get('/critical', verifyToken, requireClearance(2), async (req, res) => {
    try {
        const criticalAlerts = await dbUtils.alerts.getActive();
        const filtered = criticalAlerts.filter(alert => alert.severity >= 4);

        res.json({
            critical_weapon_alerts: filtered,
            count: filtered.length
        });

    } catch (error) {
        console.error('Get critical weapon alerts error:', error);
        res.status(500).json({
            error: 'Failed to retrieve critical weapon alerts',
            code: 'GET_CRITICAL_ALERTS_ERROR'
        });
    }
});

// POST /api/alerts - Create manual weapon alert
router.post('/', verifyToken, requireRole(['operator', 'analyst', 'commander', 'admin']), validateAlert, async (req, res) => {
    try {
        const {
            detection_id,
            alert_type,
            severity,
            title,
            description,
            weapon_type
        } = req.body;

        // Validate weapon type if provided
        if (weapon_type) {
            const validWeaponTypes = ['Knife', 'Pistol', 'weapon', 'rifle'];
            if (!validWeaponTypes.includes(weapon_type)) {
                return res.status(400).json({
                    error: `Invalid weapon type: ${weapon_type}. Must be one of: ${validWeaponTypes.join(', ')}`,
                    code: 'INVALID_WEAPON_TYPE'
                });
            }
        }

        const alert = await dbUtils.alerts.create(
            detection_id,
            alert_type || 'manual_weapon_alert',
            severity,
            title,
            description,
            JSON.stringify({
                created_by: req.user.user_id,
                weapon_type: weapon_type || 'unknown',
                manual_alert: true
            })
        );

        res.status(201).json({
            message: 'Weapon alert created successfully',
            alert
        });

    } catch (error) {
        console.error('Create weapon alert error:', error);
        res.status(500).json({
            error: 'Failed to create weapon alert',
            code: 'CREATE_ALERT_ERROR'
        });
    }
});

// PUT /api/alerts/:id/acknowledge - Acknowledge weapon alert
router.put('/:id/acknowledge', verifyToken, requireClearance(2), validateId, async (req, res) => {
    try {
        const { notes } = req.body;

        const alert = await dbUtils.alerts.acknowledge(req.params.id, req.user.user_id);

        // Add notes if provided
        if (notes) {
            await dbUtils.query(
                'UPDATE alerts SET notes = $1 WHERE alert_id = $2',
                [notes, req.params.id]
            );
        }

        res.json({
            message: 'Weapon alert acknowledged',
            alert_id: req.params.id,
            acknowledged_by: req.user.user_id,
            acknowledged_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Acknowledge weapon alert error:', error);
        res.status(500).json({
            error: 'Failed to acknowledge weapon alert',
            code: 'ACKNOWLEDGE_ALERT_ERROR'
        });
    }
});

// GET /api/alerts/:id - Get specific weapon alert
router.get('/:id', verifyToken, requireClearance(2), validateId, async (req, res) => {
    try {
        const alert = await dbUtils.alerts.findById(req.params.id);

        if (!alert) {
            return res.status(404).json({
                error: 'Weapon alert not found',
                code: 'ALERT_NOT_FOUND'
            });
        }

        // Get related detection if exists
        let detection = null;
        if (alert.detection_id) {
            detection = await dbUtils.detections.findById(alert.detection_id);
        }

        res.json({
            alert,
            related_detection: detection
        });

    } catch (error) {
        console.error('Get weapon alert error:', error);
        res.status(500).json({
            error: 'Failed to retrieve weapon alert',
            code: 'GET_ALERT_ERROR'
        });
    }
});

// GET /api/alerts/stats/summary - Get weapon alert statistics
router.get('/stats/summary', verifyToken, requireClearance(2), async (req, res) => {
    try {
        const activeAlerts = await dbUtils.alerts.getActive();
        const allAlerts = await dbUtils.alerts.getUnacknowledged();

        // Group by severity
        const severityStats = {
            critical: allAlerts.filter(a => a.severity === 5).length,
            high: allAlerts.filter(a => a.severity === 4).length,
            medium: allAlerts.filter(a => a.severity === 3).length,
            low: allAlerts.filter(a => a.severity <= 2).length
        };

        // Get weapon type distribution from recent detections
        const recentDetections = await dbUtils.detections.getRecent(24);
        const weaponTypeStats = recentDetections.reduce((acc, detection) => {
            acc[detection.object_type] = (acc[detection.object_type] || 0) + 1;
            return acc;
        }, {});

        res.json({
            total_active_alerts: activeAlerts.length,
            total_unacknowledged: allAlerts.length,
            severity_breakdown: severityStats,
            weapon_type_detections_24h: weaponTypeStats,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Get weapon alert stats error:', error);
        res.status(500).json({
            error: 'Failed to retrieve weapon alert statistics',
            code: 'GET_ALERT_STATS_ERROR'
        });
    }
});

module.exports = router;