// Load environment variables with explicit path
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = require('pg');
const fs = require('fs');

// Database configuration
const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'arcis',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

// Log the configuration (without password) for debugging
console.log('Database Configuration:', {
    user: dbConfig.user,
    host: dbConfig.host,
    database: dbConfig.database,
    port: dbConfig.port,
    password: dbConfig.password ? '***hidden***' : 'not set'
});

// Create connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Test database connection
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ Database connected successfully');

        // Set search path to include arcis schema
        await client.query('SET search_path TO arcis, public');
        console.log('✅ Search path set to arcis schema');

        // Test basic query
        const result = await client.query('SELECT NOW() as current_time');
        console.log('✅ Current time from database:', result.rows[0].current_time);

        client.release();
        return true;
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        throw err;
    }
};

// Initialize database schema
const initializeDatabase = async () => {
    try {
        const client = await pool.connect();

        // Check if schema is already initialized
        const schemaCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'arcis' 
                AND table_name = 'users'
            );
        `);

        if (schemaCheck.rows[0].exists) {
            console.log('✅ ARCIS database schema already exists - skipping initialization');
            client.release();
            return true;
        }

        // Read and execute the schema file
        const schemaPath = path.join(__dirname, 'database.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('🔄 Initializing ARCIS database schema...');
        await client.query(schemaSql);
        console.log('✅ ARCIS database schema initialized successfully');

        client.release();
        return true;
    } catch (err) {
        console.error('❌ Database initialization failed:', err.message);
        throw err;
    }
};

// Helper function to execute queries
const query = async (text, params) => {
    const start = Date.now();
    try {
        const client = await pool.connect();

        // Set search path for each query
        await client.query('SET search_path TO arcis, public');

        const res = await client.query(text, params);
        const duration = Date.now() - start;

        console.log('Query executed:', {
            text: text.substring(0, 50) + '...',
            duration: `${duration}ms`,
            rows: res.rowCount
        });

        client.release();
        return res;
    } catch (err) {
        console.error('❌ Query execution failed:', {
            text: text.substring(0, 50) + '...',
            error: err.message
        });
        throw err;
    }
};

// Get a client for transactions
const getClient = async () => {
    return await pool.connect();
};

// Transaction helper
const transaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// ARCIS Database Operations - Weapon Detection Only
const dbUtils = {
    // User operations
    users: {
        create: async (username, email, passwordHash, role = 'viewer') => {
            const result = await query(
                'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
                [username, email, passwordHash, role]
            );
            return result.rows[0];
        },

        findById: async (userId) => {
            const result = await query('SELECT * FROM users WHERE user_id = $1', [userId]);
            return result.rows[0];
        },

        findByUsername: async (username) => {
            const result = await query('SELECT * FROM users WHERE username = $1', [username]);
            return result.rows[0];
        },

        findByEmail: async (email) => {
            const result = await query('SELECT * FROM users WHERE email = $1', [email]);
            return result.rows[0];
        },

        getAll: async () => {
            const result = await query('SELECT user_id, username, email, role, created_at, last_login FROM users ORDER BY created_at DESC');
            return result.rows;
        },

        updateLastLogin: async (userId) => {
            const result = await query(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING *',
                [userId]
            );
            return result.rows[0];
        }
    },

    // Device operations
    devices: {
        create: async (deviceName, deviceType, ipAddress, macAddress, configuration) => {
            const result = await query(
                'INSERT INTO devices (device_name, device_type, ip_address, mac_address, configuration) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [deviceName, deviceType, ipAddress, macAddress, configuration]
            );
            return result.rows[0];
        },

        findById: async (deviceId) => {
            const result = await query('SELECT * FROM devices WHERE device_id = $1', [deviceId]);
            return result.rows[0];
        },

        getAll: async () => {
            const result = await query('SELECT * FROM devices ORDER BY created_at DESC');
            return result.rows;
        },

        getOnline: async () => {
            const result = await query('SELECT * FROM devices WHERE status = $1', ['online']);
            return result.rows;
        },

        updateStatus: async (deviceId, status) => {
            const result = await query(
                'UPDATE devices SET status = $1, last_seen = CURRENT_TIMESTAMP WHERE device_id = $2 RETURNING *',
                [status, deviceId]
            );
            return result.rows[0];
        }
    },

    // Detection session operations
    sessions: {
        create: async (deviceId, createdBy, settings) => {
            const result = await query(
                'INSERT INTO detection_sessions (device_id, created_by, settings) VALUES ($1, $2, $3) RETURNING *',
                [deviceId, createdBy, settings]
            );
            return result.rows[0];
        },

        findById: async (sessionId) => {
            const result = await query('SELECT * FROM detection_sessions WHERE session_id = $1', [sessionId]);
            return result.rows[0];
        },

        getActive: async () => {
            const result = await query('SELECT * FROM detection_sessions WHERE status = $1 ORDER BY start_time DESC', ['active']);
            return result.rows;
        },

        end: async (sessionId) => {
            const result = await query(
                'UPDATE detection_sessions SET end_time = CURRENT_TIMESTAMP, status = $1 WHERE session_id = $2 RETURNING *',
                ['ended', sessionId]
            );
            return result.rows[0];
        }
    },

    // Frame operations
    frames: {
        create: async (sessionId, filePath, width, height, metadata) => {
            const result = await query(
                'INSERT INTO frames (session_id, file_path, width, height, metadata) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [sessionId, filePath, width, height, metadata]
            );
            return result.rows[0];
        },

        findById: async (frameId) => {
            const result = await query('SELECT * FROM frames WHERE frame_id = $1', [frameId]);
            return result.rows[0];
        },

        getBySession: async (sessionId) => {
            const result = await query('SELECT * FROM frames WHERE session_id = $1 ORDER BY timestamp DESC', [sessionId]);
            return result.rows;
        }
    },

    // Detection operations - Weapon Detection Only
    detections: {
        create: async (frameId, objectType, confidence, boundingBox, threatLevel, metadata) => {
            // Validate weapon type
            const validWeaponTypes = ['Knife', 'Pistol', 'weapon', 'rifle'];
            if (!validWeaponTypes.includes(objectType)) {
                throw new Error(`Invalid weapon type: ${objectType}. Must be one of: ${validWeaponTypes.join(', ')}`);
            }

            const result = await query(
                'INSERT INTO detections (frame_id, object_category, object_type, confidence, bounding_box, threat_level, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                [frameId, 'weapon', objectType, confidence, boundingBox, threatLevel, metadata]
            );
            return result.rows[0];
        },

        findById: async (detectionId) => {
            const result = await query('SELECT * FROM detections WHERE detection_id = $1', [detectionId]);
            return result.rows[0];
        },

        getByFrame: async (frameId) => {
            const result = await query('SELECT * FROM detections WHERE frame_id = $1 ORDER BY confidence DESC', [frameId]);
            return result.rows;
        },

        getHighThreat: async (threshold = 7) => {
            const result = await query(
                'SELECT * FROM detections WHERE threat_level >= $1 ORDER BY threat_level DESC, timestamp DESC',
                [threshold]
            );
            return result.rows;
        },

        getRecent: async (hours = 24) => {
            const result = await query(
                'SELECT * FROM detections WHERE timestamp >= NOW() - INTERVAL $1 ORDER BY timestamp DESC',
                [`${hours} hours`]
            );
            return result.rows;
        },

        getByWeaponType: async (weaponType) => {
            const result = await query(
                'SELECT * FROM detections WHERE object_type = $1 ORDER BY timestamp DESC',
                [weaponType]
            );
            return result.rows;
        }
    },

    // Weapon detection operations
    weapons: {
        create: async (detectionId, weaponType, visibleAmmunition, estimatedCaliber, orientationAngle, inUse, metadata) => {
            // Validate weapon type
            const validWeaponTypes = ['Knife', 'Pistol', 'weapon', 'rifle'];
            if (!validWeaponTypes.includes(weaponType)) {
                throw new Error(`Invalid weapon type: ${weaponType}. Must be one of: ${validWeaponTypes.join(', ')}`);
            }

            const result = await query(
                'INSERT INTO weapon_detections (detection_id, weapon_type, visible_ammunition, estimated_caliber, orientation_angle, in_use, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                [detectionId, weaponType, visibleAmmunition, estimatedCaliber, orientationAngle, inUse, metadata]
            );
            return result.rows[0];
        },

        findByDetection: async (detectionId) => {
            const result = await query('SELECT * FROM weapon_detections WHERE detection_id = $1', [detectionId]);
            return result.rows[0];
        },

        getActive: async () => {
            const result = await query(
                `SELECT wd.*, d.* FROM weapon_detections wd 
                 JOIN detections d ON wd.detection_id = d.detection_id 
                 WHERE wd.in_use = true AND d.timestamp >= NOW() - INTERVAL '1 hour' 
                 ORDER BY d.threat_level DESC`
            );
            return result.rows;
        },

        getByType: async (weaponType) => {
            const result = await query(
                `SELECT wd.*, d.* FROM weapon_detections wd 
                 JOIN detections d ON wd.detection_id = d.detection_id 
                 WHERE wd.weapon_type = $1 
                 ORDER BY d.timestamp DESC`,
                [weaponType]
            );
            return result.rows;
        }
    },

    // Alert operations
    alerts: {
        create: async (detectionId, alertType, severity, title, description, metadata) => {
            const result = await query(
                'INSERT INTO alerts (detection_id, alert_type, severity, title, description, metadata) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [detectionId, alertType, severity, title, description, metadata]
            );
            return result.rows[0];
        },

        findById: async (alertId) => {
            const result = await query('SELECT * FROM alerts WHERE alert_id = $1', [alertId]);
            return result.rows[0];
        },

        acknowledge: async (alertId, acknowledgedBy) => {
            const result = await query(
                'UPDATE alerts SET acknowledged = true, acknowledged_at = CURRENT_TIMESTAMP, acknowledged_by = $2 WHERE alert_id = $1 RETURNING *',
                [alertId, acknowledgedBy]
            );
            return result.rows[0];
        },

        getUnacknowledged: async () => {
            const result = await query(
                'SELECT * FROM alerts WHERE acknowledged = false ORDER BY severity DESC, created_at DESC'
            );
            return result.rows;
        },

        getActive: async () => {
            const result = await query(
                'SELECT * FROM alerts WHERE acknowledged = false ORDER BY severity DESC, created_at DESC'
            );
            return result.rows;
        }
    },

    // Tactical analysis operations - Weapon focused
    tactical: {
        getWeaponSummary: async () => {
            const result = await query(`
                SELECT 
                    object_type,
                    COUNT(*) as count,
                    AVG(threat_level) as avg_threat_level,
                    MAX(threat_level) as max_threat_level
                FROM detections 
                WHERE timestamp >= NOW() - INTERVAL '24 hours'
                GROUP BY object_type
                ORDER BY max_threat_level DESC
            `);
            return result.rows;
        },

        getActiveThreats: async () => {
            const result = await query('SELECT * FROM active_weapon_threats LIMIT 50');
            return result.rows;
        },

        getCriticalAlerts: async () => {
            const result = await query('SELECT * FROM critical_alerts LIMIT 50');
            return result.rows;
        }
    }
};

// Graceful shutdown
const gracefulShutdown = async () => {
    console.log('🔄 Closing database connections...');
    await pool.end();
    console.log('✅ Database connections closed');
};

// Handle process termination
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = {
    pool,
    query,
    getClient,
    transaction,
    testConnection,
    initializeDatabase,
    dbUtils,
    gracefulShutdown
};

