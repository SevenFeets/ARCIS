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

        // Use schema-qualified table name or set search_path
        const result = await query(`
            SET search_path TO arcis, public;
            SELECT NOW() as current_time, 
                   (SELECT COUNT(*) FROM arcis.test_users) as user_count;
        `);

        res.json({
            status: 'healthy',
            database: 'connected',
            timestamp: result.rows[0].current_time,
            userCount: result.rows[0].user_count
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// Get all users
app.get('/api/test/users', async (req, res) => {
    try {
        const users = await dbUtils.testUsers.getAll();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new user
app.post('/api/test/users', async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        const user = await dbUtils.testUsers.create(name, email);
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user by ID
app.get('/api/test/users/:id', async (req, res) => {
    try {
        const user = await dbUtils.testUsers.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user
app.put('/api/test/users/:id', async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await dbUtils.testUsers.update(req.params.id, name, email);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete user
app.delete('/api/test/users/:id', async (req, res) => {
    try {
        const user = await dbUtils.testUsers.delete(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user count
app.get('/api/test/users/count', async (req, res) => {
    try {
        const count = await dbUtils.testUsers.count();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🧪 Simple test server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/test/health`);
    console.log(`👥 Users endpoint: http://localhost:${PORT}/api/test/users`);
});

module.exports = app;





// const express = require('express');
// const cors = require('cors');
// const { dbUtils, query } = require('../config/db');

// const app = express();
// const PORT = process.env.TEST_PORT || 3001;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Test endpoint - Database health check
// app.get('/api/test/health', async (req, res) => {
//     try {
//         const result = await query('SELECT NOW() as current_time');
//         res.json({
//             status: 'healthy',
//             database: 'connected',
//             timestamp: result.rows[0].current_time
//         });
//     } catch (error) {
//         res.status(500).json({
//             status: 'unhealthy',
//             error: error.message
//         });
//     }
// });

// // Test endpoint - Create test user
// app.post('/api/test/user', async (req, res) => {
//     try {
//         const { username, email, password, role } = req.body;
//         const user = await dbUtils.users.create(
//             username || 'testuser_' + Date.now(),
//             email || 'test' + Date.now() + '@arcis.com', // Ensure unique email
//             password || 'hashedpassword123',
//             role || 'user'
//         );
//         res.status(201).json(user);
//     } catch (error) {
//         console.error('User creation error:', error);
//         res.status(500).json({ error: error.message });
//     }
// });

// // Test endpoint - Create test device
// app.post('/api/test/device', async (req, res) => {
//     try {
//         const { deviceName, deviceType, ipAddress, macAddress, configuration } = req.body;
//         const device = await dbUtils.devices.create(
//             deviceName || 'Test Camera ' + Date.now(),
//             deviceType || 'IP Camera',
//             ipAddress || '192.168.1.' + Math.floor(Math.random() * 255),
//             macAddress || '00:11:22:33:44:' + Math.floor(Math.random() * 99).toString().padStart(2, '0'),
//             configuration || { resolution: '1920x1080' }
//         );
//         res.status(201).json(device);
//     } catch (error) {
//         console.error('Device creation error:', error);
//         res.status(500).json({ error: error.message });
//     }
// });

// // Test endpoint - Create detection session
// app.post('/api/test/session', async (req, res) => {
//     try {
//         const { deviceId, createdBy, settings } = req.body;

//         if (!deviceId || !createdBy) {
//             return res.status(400).json({ error: 'deviceId and createdBy are required' });
//         }

//         const session = await dbUtils.sessions.create(
//             deviceId,
//             createdBy,
//             settings || { detection_threshold: 0.8, alert_level: 'high' }
//         );
//         res.status(201).json(session);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // Test endpoint - Create frame
// app.post('/api/test/frame', async (req, res) => {
//     try {
//         const { sessionId, filePath, width, height, metadata } = req.body;

//         if (!sessionId) {
//             return res.status(400).json({ error: 'sessionId is required' });
//         }

//         const frame = await dbUtils.frames.create(
//             sessionId,
//             filePath || '/uploads/test_frame.jpg',
//             width || 1920,
//             height || 1080,
//             metadata || {}
//         );
//         res.status(201).json(frame);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // Test endpoint - Create detection
// app.post('/api/test/detection', async (req, res) => {
//     try {
//         const {
//             frameId,
//             objectCategory,
//             objectType,
//             confidence,
//             boundingBox,
//             threatLevel,
//             poseData,
//             metadata
//         } = req.body;

//         if (!frameId || !objectCategory || !objectType || !confidence || !boundingBox) {
//             return res.status(400).json({
//                 error: 'frameId, objectCategory, objectType, confidence, and boundingBox are required'
//             });
//         }

//         const detection = await dbUtils.detections.create(
//             frameId,
//             objectCategory,
//             objectType,
//             confidence,
//             boundingBox,
//             threatLevel || 5,
//             poseData,
//             metadata || {}
//         );
//         res.status(201).json(detection);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // Test endpoint - Create weapon detection
// app.post('/api/test/weapon', async (req, res) => {
//     try {
//         const {
//             detectionId,
//             weaponType,
//             visibleAmmunition,
//             estimatedCaliber,
//             orientationAngle,
//             inUse,
//             metadata
//         } = req.body;

//         if (!detectionId || !weaponType) {
//             return res.status(400).json({ error: 'detectionId and weaponType are required' });
//         }

//         const weapon = await dbUtils.weapons.create(
//             detectionId,
//             weaponType,
//             visibleAmmunition || false,
//             estimatedCaliber,
//             orientationAngle,
//             inUse || false,
//             metadata || {}
//         );
//         res.status(201).json(weapon);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // Test endpoint - Get tactical situation (with error handling)
// app.get('/api/test/tactical', async (req, res) => {
//     try {
//         const result = {};

//         try {
//             result.situation = await dbUtils.tactical.getSituation();
//         } catch (err) {
//             result.situation = [];
//             result.situationError = err.message;
//         }

//         try {
//             result.militaryThreats = await dbUtils.tactical.getMilitaryThreats();
//         } catch (err) {
//             result.militaryThreats = [];
//             result.militaryThreatsError = err.message;
//         }

//         try {
//             result.environmentalHazards = await dbUtils.tactical.getEnvironmentalHazards();
//         } catch (err) {
//             result.environmentalHazards = [];
//             result.environmentalHazardsError = err.message;
//         }

//         res.json(result);
//     } catch (error) {
//         console.error('Tactical endpoint error:', error);
//         res.status(500).json({ error: error.message });
//     }
// });

// // Test endpoint - Get all alerts
// app.get('/api/test/alerts', async (req, res) => {
//     try {
//         const alerts = await dbUtils.alerts.getUnacknowledged();
//         res.json(alerts);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // Start server
// app.listen(PORT, () => {
//     console.log(`🧪 Test server running on port ${PORT}`);
//     console.log(`📡 Health check: http://localhost:${PORT}/api/test/health`);
// });

// module.exports = app; 