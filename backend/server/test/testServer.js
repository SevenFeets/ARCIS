const express = require('express');
const cors = require('cors');
const { dbUtils, query, testConnection } = require('../config/db');

const app = express();
const PORT = process.env.TEST_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/test/health', async (req, res) => {
    try {
        await testConnection();

        // Get system statistics for weapon detection system
        const stats = await query(`
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM devices WHERE status = 'online') as online_devices,
                (SELECT COUNT(*) FROM detection_sessions WHERE status = 'active') as active_sessions,
                (SELECT COUNT(*) FROM detections WHERE timestamp >= NOW() - INTERVAL '24 hours') as recent_detections,
                (SELECT COUNT(*) FROM alerts WHERE acknowledged = false) as active_alerts
        `);

        res.json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString(),
            system_stats: stats.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// User endpoints
app.get('/api/test/users', async (req, res) => {
    try {
        const users = await dbUtils.users.getAll();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/test/users', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        const user = await dbUtils.users.create(
            username || 'testuser_' + Date.now(),
            email || 'test' + Date.now() + '@arcis.mil',
            password || '$2b$10$hashedpassword123',
            role || 'viewer'
        );
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Device endpoints
app.get('/api/test/devices', async (req, res) => {
    try {
        const devices = await dbUtils.devices.getAll();
        res.json(devices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/test/devices', async (req, res) => {
    try {
        const { deviceName, deviceType, ipAddress, macAddress, configuration } = req.body;
        const device = await dbUtils.devices.create(
            deviceName || 'Jetson-Nano-' + Date.now(),
            deviceType || 'jetson_nano',
            ipAddress || '192.168.1.' + Math.floor(Math.random() * 255),
            macAddress || '00:11:22:33:44:' + Math.floor(Math.random() * 99).toString().padStart(2, '0'),
            JSON.stringify(configuration || {
                model: 'Jetson Nano 4GB',
                detection_models: ['weapon_detection_v2']
            })
        );
        res.status(201).json(device);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/test/devices/online', async (req, res) => {
    try {
        const devices = await dbUtils.devices.getOnline();
        res.json(devices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Detection session endpoints
app.post('/api/test/sessions', async (req, res) => {
    try {
        const { deviceId, createdBy, settings } = req.body;
        const session = await dbUtils.sessions.create(
            deviceId || 1,
            createdBy || 1,
            JSON.stringify(settings || {
                confidence_threshold: 0.7,
                detection_classes: ['Knife', 'Pistol', 'weapon', 'rifle']
            })
        );
        res.status(201).json(session);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/test/sessions/active', async (req, res) => {
    try {
        const sessions = await dbUtils.sessions.getActive();
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Frame endpoints
app.post('/api/test/frames', async (req, res) => {
    try {
        const { sessionId, filePath, width, height, metadata } = req.body;
        const frame = await dbUtils.frames.create(
            sessionId || 1,
            filePath || '/uploads/frames/test_' + Date.now() + '.jpg',
            width || 1920,
            height || 1080,
            JSON.stringify(metadata || {
                timestamp: new Date().toISOString(),
                camera_settings: { exposure: 'auto', focus: 'auto' }
            })
        );
        res.status(201).json(frame);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Weapon Detection endpoints
app.post('/api/test/detections', async (req, res) => {
    try {
        const { frameId, objectType, confidence, boundingBox, threatLevel, metadata } = req.body;

        // Validate weapon type
        const validWeaponTypes = ['Knife', 'Pistol', 'weapon', 'rifle'];
        const weaponType = objectType || 'rifle';

        if (!validWeaponTypes.includes(weaponType)) {
            return res.status(400).json({
                error: `Invalid weapon type: ${weaponType}. Must be one of: ${validWeaponTypes.join(', ')}`
            });
        }

        const detection = await dbUtils.detections.create(
            frameId || 1,
            weaponType,
            confidence || 0.95,
            JSON.stringify(boundingBox || { x: 100, y: 200, width: 50, height: 30 }),
            threatLevel || 8,
            JSON.stringify(metadata || { confidence_details: 'Test detection' })
        );
        res.status(201).json(detection);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/test/detections/high-threat', async (req, res) => {
    try {
        const detections = await dbUtils.detections.getHighThreat();
        res.json(detections);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/test/detections/recent', async (req, res) => {
    try {
        const hours = parseInt(req.query.hours) || 24;
        const detections = await dbUtils.detections.getRecent(hours);
        res.json(detections);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/test/detections/weapons/:type', async (req, res) => {
    try {
        const weaponType = req.params.type;
        const validWeaponTypes = ['Knife', 'Pistol', 'weapon', 'rifle'];

        if (!validWeaponTypes.includes(weaponType)) {
            return res.status(400).json({
                error: `Invalid weapon type: ${weaponType}. Must be one of: ${validWeaponTypes.join(', ')}`
            });
        }

        const detections = await dbUtils.detections.getByWeaponType(weaponType);
        res.json(detections);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Weapon-specific detection endpoints
app.post('/api/test/weapons', async (req, res) => {
    try {
        const { detectionId, weaponType, visibleAmmunition, estimatedCaliber, orientationAngle, inUse, metadata } = req.body;

        const validWeaponTypes = ['Knife', 'Pistol', 'weapon', 'rifle'];
        const type = weaponType || 'rifle';

        if (!validWeaponTypes.includes(type)) {
            return res.status(400).json({
                error: `Invalid weapon type: ${type}. Must be one of: ${validWeaponTypes.join(', ')}`
            });
        }

        const weapon = await dbUtils.weapons.create(
            detectionId || 1,
            type,
            visibleAmmunition || true,
            estimatedCaliber || (type === 'rifle' ? '5.56mm' : type === 'Pistol' ? '9mm' : null),
            orientationAngle || 45.0,
            inUse || true,
            JSON.stringify(metadata || { detection_confidence: 0.95 })
        );
        res.status(201).json(weapon);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/test/weapons/active', async (req, res) => {
    try {
        const weapons = await dbUtils.weapons.getActive();
        res.json(weapons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/test/weapons/type/:type', async (req, res) => {
    try {
        const weaponType = req.params.type;
        const weapons = await dbUtils.weapons.getByType(weaponType);
        res.json(weapons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Alert endpoints
app.post('/api/test/alerts', async (req, res) => {
    try {
        const { detectionId, alertType, severity, title, description, metadata } = req.body;
        const alert = await dbUtils.alerts.create(
            detectionId || 1,
            alertType || 'weapon_detection',
            severity || 4,
            title || 'Test Weapon Alert',
            description || 'This is a test weapon detection alert',
            JSON.stringify(metadata || { test: true, weapon_type: 'rifle' })
        );
        res.status(201).json(alert);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/test/alerts/active', async (req, res) => {
    try {
        const alerts = await dbUtils.alerts.getActive();
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/test/alerts/unacknowledged', async (req, res) => {
    try {
        const alerts = await dbUtils.alerts.getUnacknowledged();
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/test/alerts/:id/acknowledge', async (req, res) => {
    try {
        const alertId = req.params.id;
        const userId = req.body.userId || 1;
        const alert = await dbUtils.alerts.acknowledge(alertId, userId);
        res.json(alert);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Tactical analysis endpoints - Weapon focused
app.get('/api/test/tactical/weapons', async (req, res) => {
    try {
        const summary = await dbUtils.tactical.getWeaponSummary();
        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/test/tactical/threats', async (req, res) => {
    try {
        const threats = await dbUtils.tactical.getActiveThreats();
        res.json(threats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/test/tactical/alerts', async (req, res) => {
    try {
        const alerts = await dbUtils.tactical.getCriticalAlerts();
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Weapon statistics endpoint
app.get('/api/test/stats/weapons', async (req, res) => {
    try {
        const weaponTypes = ['Knife', 'Pistol', 'weapon', 'rifle'];
        const stats = {};

        for (const type of weaponTypes) {
            const detections = await dbUtils.detections.getByWeaponType(type);
            stats[type] = {
                count: detections.length,
                recent_24h: detections.filter(d =>
                    new Date(d.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                ).length
            };
        }

        res.json({
            weapon_statistics: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🧪 ARCIS Weapon Detection Test Server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/test/health`);
    console.log(`🔫 Weapon threats: http://localhost:${PORT}/api/test/tactical/threats`);
    console.log(`⚠️  Active alerts: http://localhost:${PORT}/api/test/alerts/active`);
    console.log(`📊 Weapon stats: http://localhost:${PORT}/api/test/stats/weapons`);
});

module.exports = app; 