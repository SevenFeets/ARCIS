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

        // Get system statistics
        const stats = await query(`
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM devices WHERE status = 'online') as online_devices,
                (SELECT COUNT(*) FROM detection_sessions WHERE is_active = true) as active_sessions,
                (SELECT COUNT(*) FROM detections WHERE detected_at >= NOW() - INTERVAL '24 hours') as recent_detections,
                (SELECT COUNT(*) FROM alerts WHERE resolved_at IS NULL) as active_alerts
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
        const { deviceName, deviceType, ipAddress, macAddress, locationDescription, configuration } = req.body;
        const device = await dbUtils.devices.create(
            deviceName || 'Test Device ' + Date.now(),
            deviceType || 'IP Camera',
            ipAddress || '192.168.1.' + Math.floor(Math.random() * 255),
            macAddress || '00:11:22:33:44:' + Math.floor(Math.random() * 99).toString().padStart(2, '0'),
            locationDescription || 'Test Location',
            configuration || { resolution: '1080p', fps: 30 }
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
            settings || { detection_threshold: 0.8 }
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
        const { sessionId, filePath, width, height, fileSize, metadata } = req.body;
        const frame = await dbUtils.frames.create(
            sessionId || 1,
            filePath || '/uploads/frames/test_' + Date.now() + '.jpg',
            width || 1920,
            height || 1080,
            fileSize || 2048576,
            metadata || { camera_settings: { iso: 100 } }
        );
        res.status(201).json(frame);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Detection endpoints
app.post('/api/test/detections', async (req, res) => {
    try {
        const { frameId, objectCategory, objectType, confidence, boundingBox, threatLevel, poseData, metadata } = req.body;
        const detection = await dbUtils.detections.create(
            frameId || 1,
            objectCategory || 'weapon',
            objectType || 'rifle',
            confidence || 0.95,
            boundingBox || { x: 100, y: 200, width: 50, height: 30 },
            threatLevel || 8,
            poseData || null,
            metadata || { confidence_details: 'Test detection' }
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

// Weapon detection endpoints
app.post('/api/test/weapons', async (req, res) => {
    try {
        const { detectionId, weaponType, visibleAmmunition, estimatedCaliber, orientationAngle, inUse, metadata } = req.body;
        const weapon = await dbUtils.weapons.create(
            detectionId || 1,
            weaponType || 'assault_rifle',
            visibleAmmunition || true,
            estimatedCaliber || '5.56mm',
            orientationAngle || 45.0,
            inUse || true,
            metadata || { manufacturer: 'unknown' }
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

// Vehicle detection endpoints
app.post('/api/test/vehicles', async (req, res) => {
    try {
        const { detectionId, vehicleType, militaryClassification, estimatedOccupants, movementDirection, estimatedSpeed, armorType, visibleWeapons, metadata } = req.body;
        const vehicle = await dbUtils.vehicles.create(
            detectionId || 1,
            vehicleType || 'military_truck',
            militaryClassification || 'M35A2',
            estimatedOccupants || 4,
            movementDirection || 180.0,
            estimatedSpeed || 45.5,
            armorType || 'light_armor',
            visibleWeapons || [{ type: 'machine_gun', mounted: true }],
            metadata || { fuel_type: 'diesel' }
        );
        res.status(201).json(vehicle);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Person detection endpoints
app.post('/api/test/persons', async (req, res) => {
    try {
        const { detectionId, uniformType, estimatedAgeRange, gender, carryingEquipment, poseClassification, activityClassification, metadata } = req.body;
        const person = await dbUtils.persons.create(
            detectionId || 1,
            uniformType || 'military_combat_uniform',
            estimatedAgeRange || '25-35',
            gender || 'male',
            carryingEquipment || [{ type: 'rifle', visible: true }],
            poseClassification || 'standing',
            activityClassification || 'patrolling',
            metadata || { rank_insignia: 'sergeant' }
        );
        res.status(201).json(person);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Environmental hazard endpoints
app.post('/api/test/environmental', async (req, res) => {
    try {
        const { detectionId, hazardType, severityLevel, estimatedRadius, windDirection, metadata } = req.body;
        const hazard = await dbUtils.environmental.create(
            detectionId || 1,
            hazardType || 'fire',
            severityLevel || 8,
            estimatedRadius || 25.5,
            windDirection || 270.0,
            metadata || { temperature: '800C' }
        );
        res.status(201).json(hazard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/test/environmental/active', async (req, res) => {
    try {
        const hazards = await dbUtils.environmental.getActive();
        res.json(hazards);
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
            alertType || 'threat_detected',
            severity || 'medium',
            title || 'Test Alert',
            description || 'This is a test alert for system verification',
            metadata || { test: true }
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

// Tactical analysis endpoints
app.get('/api/test/tactical/situation', async (req, res) => {
    try {
        const situation = await dbUtils.tactical.getSituation();
        res.json(situation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/test/tactical/threats', async (req, res) => {
    try {
        const threats = await dbUtils.tactical.getMilitaryThreats();
        res.json(threats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/test/tactical/environmental', async (req, res) => {
    try {
        const environmental = await dbUtils.tactical.getEnvironmentalHazards();
        res.json(environmental);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/test/tactical/summary', async (req, res) => {
    try {
        const summary = await dbUtils.tactical.getThreatSummary();
        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🧪 ARCIS Test Server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/test/health`);
    console.log(`🎯 Tactical situation: http://localhost:${PORT}/api/test/tactical/situation`);
    console.log(`⚠️  Active alerts: http://localhost:${PORT}/api/test/alerts/active`);
});

module.exports = app; 