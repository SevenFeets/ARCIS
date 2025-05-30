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

// ARCIS Database Operations
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
            const result = await query('SELECT user_id, username, email, role, created_at, last_login, is_active FROM users ORDER BY created_at DESC');
            return result.rows;
        },

        updateLastLogin: async (userId) => {
            const result = await query(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING *',
                [userId]
            );
            return result.rows[0];
        },

        deactivate: async (userId) => {
            const result = await query(
                'UPDATE users SET is_active = false WHERE user_id = $1 RETURNING *',
                [userId]
            );
            return result.rows[0];
        }
    },

    // Device operations
    devices: {
        create: async (deviceName, deviceType, ipAddress, macAddress, locationDescription, configuration) => {
            const result = await query(
                'INSERT INTO devices (device_name, device_type, ip_address, mac_address, location_description, configuration) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [deviceName, deviceType, ipAddress, macAddress, locationDescription, configuration]
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
        create: async (deviceId, createdBy, sessionSettings) => {
            const result = await query(
                'INSERT INTO detection_sessions (device_id, created_by, session_settings) VALUES ($1, $2, $3) RETURNING *',
                [deviceId, createdBy, sessionSettings]
            );
            return result.rows[0];
        },

        findById: async (sessionId) => {
            const result = await query('SELECT * FROM detection_sessions WHERE session_id = $1', [sessionId]);
            return result.rows[0];
        },

        getActive: async () => {
            const result = await query('SELECT * FROM detection_sessions WHERE is_active = true ORDER BY started_at DESC');
            return result.rows;
        },

        end: async (sessionId) => {
            const result = await query(
                'UPDATE detection_sessions SET ended_at = CURRENT_TIMESTAMP, is_active = false WHERE session_id = $1 RETURNING *',
                [sessionId]
            );
            return result.rows[0];
        }
    },

    // Frame operations
    frames: {
        create: async (sessionId, filePath, width, height, fileSize, metadata) => {
            const result = await query(
                'INSERT INTO frames (session_id, file_path, width, height, file_size, metadata) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [sessionId, filePath, width, height, fileSize, metadata]
            );
            return result.rows[0];
        },

        findById: async (frameId) => {
            const result = await query('SELECT * FROM frames WHERE frame_id = $1', [frameId]);
            return result.rows[0];
        },

        getBySession: async (sessionId) => {
            const result = await query('SELECT * FROM frames WHERE session_id = $1 ORDER BY captured_at DESC', [sessionId]);
            return result.rows;
        }
    },

    // Detection operations
    detections: {
        create: async (frameId, objectCategory, objectType, confidence, boundingBox, threatLevel, poseData, metadata) => {
            const result = await query(
                'INSERT INTO detections (frame_id, object_category, object_type, confidence, bounding_box, threat_level, pose_data, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                [frameId, objectCategory, objectType, confidence, boundingBox, threatLevel, poseData, metadata]
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
                'SELECT * FROM detections WHERE threat_level >= $1 ORDER BY threat_level DESC, detected_at DESC',
                [threshold]
            );
            return result.rows;
        },

        getRecent: async (hours = 24) => {
            const result = await query(
                'SELECT * FROM detections WHERE detected_at >= NOW() - INTERVAL $1 ORDER BY detected_at DESC',
                [`${hours} hours`]
            );
            return result.rows;
        }
    },

    // Weapon detection operations
    weapons: {
        create: async (detectionId, weaponType, visibleAmmunition, estimatedCaliber, orientationAngle, inUse, metadata) => {
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
                 WHERE wd.in_use = true AND d.detected_at >= NOW() - INTERVAL '1 hour' 
                 ORDER BY d.threat_level DESC`
            );
            return result.rows;
        }
    },

    // Vehicle detection operations
    vehicles: {
        create: async (detectionId, vehicleType, militaryClassification, estimatedOccupants, movementDirection, estimatedSpeed, armorType, visibleWeapons, metadata) => {
            const result = await query(
                'INSERT INTO vehicle_detections (detection_id, vehicle_type, military_classification, estimated_occupants, movement_direction, estimated_speed, armor_type, visible_weapons, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
                [
                    detectionId,
                    vehicleType,
                    militaryClassification,
                    estimatedOccupants,
                    movementDirection,
                    estimatedSpeed,
                    armorType,
                    typeof visibleWeapons === 'string' ? visibleWeapons : JSON.stringify(visibleWeapons),
                    typeof metadata === 'string' ? metadata : JSON.stringify(metadata)
                ]
            );
            return result.rows[0];
        },

        findByDetection: async (detectionId) => {
            const result = await query('SELECT * FROM vehicle_detections WHERE detection_id = $1', [detectionId]);
            return result.rows[0];
        },

        getMilitary: async () => {
            const result = await query(
                `SELECT vd.*, d.* FROM vehicle_detections vd 
                 JOIN detections d ON vd.detection_id = d.detection_id 
                 WHERE vd.military_classification IS NOT NULL 
                 ORDER BY d.detected_at DESC`
            );
            return result.rows;
        }
    },

    // Person detection operations
    persons: {
        create: async (detectionId, uniformType, estimatedAgeRange, gender, carryingEquipment, poseClassification, activityClassification, metadata) => {
            const result = await query(
                'INSERT INTO person_detections (detection_id, uniform_type, estimated_age_range, gender, carrying_equipment, pose_classification, activity_classification, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                [
                    detectionId,
                    uniformType,
                    estimatedAgeRange,
                    gender,
                    typeof carryingEquipment === 'string' ? carryingEquipment : JSON.stringify(carryingEquipment || []),
                    poseClassification,
                    activityClassification,
                    typeof metadata === 'string' ? metadata : JSON.stringify(metadata || {})
                ]
            );
            return result.rows[0];
        },

        findById: async (personDetectionId) => {
            const result = await query('SELECT * FROM person_detections WHERE person_detection_id = $1', [personDetectionId]);
            return result.rows[0];
        },

        getByDetection: async (detectionId) => {
            const result = await query('SELECT * FROM person_detections WHERE detection_id = $1', [detectionId]);
            return result.rows[0];
        },

        getMilitary: async () => {
            const result = await query(
                `SELECT pd.*, d.* FROM person_detections pd 
                 JOIN detections d ON pd.detection_id = d.detection_id 
                 WHERE pd.uniform_type LIKE '%military%' OR pd.uniform_type LIKE '%combat%'
                 ORDER BY d.detected_at DESC`
            );
            return result.rows;
        },

        getByActivity: async (activity) => {
            const result = await query(
                'SELECT * FROM person_detections WHERE activity_classification = $1 ORDER BY person_detection_id DESC',
                [activity]
            );
            return result.rows;
        }
    },

    // Environmental hazard operations
    environmental: {
        create: async (detectionId, hazardType, severityLevel, estimatedRadius, windDirection, metadata) => {
            const result = await query(
                'INSERT INTO environmental_hazards (detection_id, hazard_type, severity_level, estimated_radius, wind_direction, metadata) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [detectionId, hazardType, severityLevel, estimatedRadius, windDirection, typeof metadata === 'string' ? metadata : JSON.stringify(metadata || {})]
            );
            return result.rows[0];
        },

        findByDetection: async (detectionId) => {
            const result = await query('SELECT * FROM environmental_hazards WHERE detection_id = $1', [detectionId]);
            return result.rows[0];
        },

        getBySeverity: async (minSeverity = 5) => {
            const result = await query(
                'SELECT * FROM environmental_hazards WHERE severity_level >= $1 ORDER BY severity_level DESC',
                [minSeverity]
            );
            return result.rows;
        },

        getActive: async () => {
            const result = await query(
                `SELECT eh.*, d.* FROM environmental_hazards eh 
                 JOIN detections d ON eh.detection_id = d.detection_id 
                 WHERE d.detected_at >= NOW() - INTERVAL '24 hours' 
                 ORDER BY eh.severity_level DESC, d.detected_at DESC`
            );
            return result.rows;
        }
    },

    // Alert operations
    alerts: {
        create: async (detectionId, alertType, severity, title, description, metadata) => {
            const result = await query(
                'INSERT INTO alerts (detection_id, alert_type, severity, title, description, metadata) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [detectionId, alertType, severity, title, description, typeof metadata === 'string' ? metadata : JSON.stringify(metadata || {})]
            );
            return result.rows[0];
        },

        findById: async (alertId) => {
            const result = await query('SELECT * FROM alerts WHERE alert_id = $1', [alertId]);
            return result.rows[0];
        },

        acknowledge: async (alertId, acknowledgedBy) => {
            const result = await query(
                'UPDATE alerts SET acknowledged_at = CURRENT_TIMESTAMP, acknowledged_by = $2 WHERE alert_id = $1 RETURNING *',
                [alertId, acknowledgedBy]
            );
            return result.rows[0];
        },

        resolve: async (alertId, resolvedBy, resolution) => {
            const result = await query(
                'UPDATE alerts SET resolved_at = CURRENT_TIMESTAMP, resolved_by = $2, metadata = metadata || $3 WHERE alert_id = $1 RETURNING *',
                [alertId, resolvedBy, JSON.stringify({ resolution })]
            );
            return result.rows[0];
        },

        getUnacknowledged: async () => {
            const result = await query(
                'SELECT * FROM alerts WHERE acknowledged_at IS NULL ORDER BY severity DESC, created_at DESC'
            );
            return result.rows;
        },

        getActive: async () => {
            const result = await query(
                'SELECT * FROM alerts WHERE resolved_at IS NULL ORDER BY severity DESC, created_at DESC'
            );
            return result.rows;
        }
    },

    // Tactical analysis operations
    tactical: {
        getSituation: async () => {
            const result = await query('SELECT * FROM tactical_situation LIMIT 100');
            return result.rows;
        },

        getMilitaryThreats: async () => {
            const result = await query('SELECT * FROM military_threats LIMIT 50');
            return result.rows;
        },

        getEnvironmentalHazards: async () => {
            const result = await query('SELECT * FROM environmental_overview LIMIT 50');
            return result.rows;
        },

        getThreatSummary: async () => {
            const result = await query(`
                SELECT 
                    object_category,
                    COUNT(*) as count,
                    AVG(threat_level) as avg_threat_level,
                    MAX(threat_level) as max_threat_level
                FROM detections 
                WHERE detected_at >= NOW() - INTERVAL '24 hours'
                GROUP BY object_category
                ORDER BY max_threat_level DESC
            `);
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

