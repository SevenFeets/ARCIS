const pool = require('pg');
const fs = require('fs');
const path = require('path');


// Database configuration
const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'arcis_db',
    password: process.env.DB_PASSWORD || '4wrdjz67',
    port: process.env.DB_PORT || 5432,
    // connection pool configuration
    max: 20, // max number of connections
    idleTimeoutMillis: 30000, // how long a connection can stay idle before being closed
    connectionTimeoutMillis: 2000, // how long to wait before timing out when connecting a new client
};

// Create a connection pool
const pool = new Pool(dbConfig);

// handle connection errors
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Database connection test
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('Database connected successfully');

        // test if the ARCIS schema exists
        const schema_Result = await client.query(
            "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'arcis'"
        );

        if (schema_Result.rows.length === 0) {
            console.log('⚠️  ARCIS schema not found. Please run the database setup script.');
            process.exit(1);
        } else {
            console.log('✅ ARCIS schema found');
        }

        client.release();

    } catch (error) {
        console.error('❌ Database connection failed:', error);
        // process.exit(1);
        throw error;
    }

};


// initialize the database schema
const initializeSchema = async () => {
    try {
        const client = await pool.connect();
        // read and execute the SQL file
        const schemaPath = path.join(__dirname, 'database.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('🔄 Initializing database schema...');
        await client.query(schemaSql);
        console.log('✅ Database schema initialized successfully');

        client.release();
    } catch (error) {
        console.error('❌ Database schema initialization failed:', error);
        throw error;
    }


};

// helper function to execute queries
const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;

        if (duration > 100) {
            console.log('⚠️  Query took longer than 100ms:', {
                text: text.substring(0, 100) + '...',
                duration: `${duration}ms`,
                rows: result.rowCount,
            });
        }

        return result;

    } catch (err) {
        console.error('❌ Query execution failed:', {
            text: text.substring(0, 100) + '...',
            error: err.message
        });

        throw err;
    }
}

// helper function to get a client fron the pool (for transactions)
const getClient = async () => {
    return await pool.connect();
};

// transaction helper
const transaction = async (callback) => {
    const client = await pool.connect();
    try {

        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }

};

// Database utility functions for ARCIS
const dbUtils = {
    // User management
    users: {
        create: async (username, email, passwordHash, role = 'user') => {
            const result = await query(
                'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING user_id',
                [username, email, passwordHash, role]
            );
            return result.rows[0];
        },

        findByEmail: async (email) => {
            const result = await query('SELECT * FROM users WHERE email = $1', [email]);
            return result.rows[0];
        },

        findById: async (userId) => {
            const result = await query('SELECT * FROM users WHERE user_id = $1', [userId]);
            return result.rows[0];
        },

        updateLastLogin: async (userId) => {
            await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1', [userId]);
        }
    },

    // Device management
    devices: {
        create: async (deviceName, deviceType, ipAddress, macAddress, configuration = {}) => {
            const result = await query(
                'INSERT INTO devices (device_name, device_type, ip_address, mac_address, configuration) VALUES ($1, $2, $3, $4, $5) RETURNING device_id',
                [deviceName, deviceType, ipAddress, macAddress, JSON.stringify(configuration)]
            );
            return result.rows[0];
        },

        updateStatus: async (deviceId, status) => {
            await query(
                'UPDATE devices SET status = $1, last_seen = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE device_id = $2',
                [status, deviceId]
            );
        },

        getAll: async () => {
            const result = await query('SELECT * FROM devices ORDER BY device_name');
            return result.rows;
        },

        getOnline: async () => {
            const result = await query("SELECT * FROM devices WHERE status = 'online' ORDER BY device_name");
            return result.rows;
        }
    },

    // Detection session management
    sessions: {
        create: async (deviceId, createdBy, settings = {}) => {
            const result = await query(
                'INSERT INTO detection_sessions (device_id, created_by, settings) VALUES ($1, $2, $3) RETURNING session_id',
                [deviceId, createdBy, JSON.stringify(settings)]
            );
            return result.rows[0];
        },

        end: async (sessionId) => {
            await query(
                'UPDATE detection_sessions SET end_time = CURRENT_TIMESTAMP, status = $1 WHERE session_id = $2',
                ['completed', sessionId]
            );
        },

        getActive: async () => {
            const result = await query("SELECT * FROM detection_sessions WHERE status = 'active' ORDER BY start_time DESC");
            return result.rows;
        }
    },

    // Frame management
    frames: {
        create: async (sessionId, filePath, width, height, metadata = {}) => {
            const result = await query(
                'INSERT INTO frames (session_id, file_path, width, height, metadata) VALUES ($1, $2, $3, $4, $5) RETURNING frame_id',
                [sessionId, filePath, width, height, JSON.stringify(metadata)]
            );
            return result.rows[0];
        },

        markProcessed: async (frameId) => {
            await query('UPDATE frames SET processed = TRUE WHERE frame_id = $1', [frameId]);
        },

        getUnprocessed: async (limit = 100) => {
            const result = await query('SELECT * FROM frames WHERE processed = FALSE ORDER BY timestamp LIMIT $1', [limit]);
            return result.rows;
        }
    },

    // Detection management
    detections: {
        create: async (frameId, objectCategory, objectType, confidence, boundingBox, threatLevel = 0, poseData = null, metadata = {}) => {
            const result = await query(
                'INSERT INTO detections (frame_id, object_category, object_type, confidence, bounding_box, threat_level, pose_data, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING detection_id',
                [frameId, objectCategory, objectType, confidence, JSON.stringify(boundingBox), threatLevel, poseData ? JSON.stringify(poseData) : null, JSON.stringify(metadata)]
            );
            return result.rows[0];
        },

        getRecent: async (limit = 100) => {
            const result = await query('SELECT * FROM latest_detections LIMIT $1', [limit]);
            return result.rows;
        },

        getByThreatLevel: async (minThreatLevel = 5) => {
            const result = await query(
                'SELECT * FROM detections WHERE threat_level >= $1 ORDER BY threat_level DESC, timestamp DESC',
                [minThreatLevel]
            );
            return result.rows;
        }
    },

    // Alert management
    alerts: {
        create: async (detectionId, alertType, alertCategory, severity, actionRequired, threatAnalysisId = null) => {
            const result = await query(
                'INSERT INTO alerts (detection_id, threat_analysis_id, alert_type, alert_category, severity, action_required) VALUES ($1, $2, $3, $4, $5, $6) RETURNING alert_id',
                [detectionId, threatAnalysisId, alertType, alertCategory, severity, actionRequired]
            );
            return result.rows[0];
        },

        acknowledge: async (alertId, userId, notes = '') => {
            await query(
                'UPDATE alerts SET acknowledged = TRUE, acknowledged_by = $1, acknowledged_at = CURRENT_TIMESTAMP, notes = $2 WHERE alert_id = $3',
                [userId, notes, alertId]
            );
        },

        getUnacknowledged: async () => {
            const result = await query('SELECT * FROM recent_alerts');
            return result.rows;
        },

        getCritical: async () => {
            const result = await query('SELECT * FROM critical_alerts');
            return result.rows;
        }
    },

    // Specialized detection functions
    weapons: {
        create: async (detectionId, weaponType, visibleAmmunition = false, estimatedCaliber = null, orientationAngle = null, inUse = false, metadata = {}) => {
            const result = await query(
                'INSERT INTO weapon_detections (detection_id, weapon_type, visible_ammunition, estimated_caliber, orientation_angle, in_use, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING weapon_detection_id',
                [detectionId, weaponType, visibleAmmunition, estimatedCaliber, orientationAngle, inUse, JSON.stringify(metadata)]
            );
            return result.rows[0];
        }
    },

    militaryVehicles: {
        create: async (detectionId, vehicleType, vehicleClass = null, nationality = null, armamentVisible = false, movementStatus = null, orientationAngle = null, metadata = {}) => {
            const result = await query(
                'INSERT INTO military_vehicle_detections (detection_id, vehicle_type, vehicle_class, nationality, armament_visible, movement_status, orientation_angle, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING vehicle_detection_id',
                [detectionId, vehicleType, vehicleClass, nationality, armamentVisible, movementStatus, orientationAngle, JSON.stringify(metadata)]
            );
            return result.rows[0];
        }
    },

    aircraft: {
        create: async (detectionId, aircraftType, aircraftClass = null, nationality = null, altitudeEstimate = null, speedEstimate = null, headingAngle = null, metadata = {}) => {
            const result = await query(
                'INSERT INTO aircraft_detections (detection_id, aircraft_type, aircraft_class, nationality, altitude_estimate, speed_estimate, heading_angle, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING aircraft_detection_id',
                [detectionId, aircraftType, aircraftClass, nationality, altitudeEstimate, speedEstimate, headingAngle, JSON.stringify(metadata)]
            );
            return result.rows[0];
        }
    },

    environmentalHazards: {
        create: async (detectionId, hazardType, intensity = null, spreadRate = null, color = null, coverageArea = null, metadata = {}) => {
            const result = await query(
                'INSERT INTO environmental_hazard_detections (detection_id, hazard_type, intensity, spread_rate, color, coverage_area, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING hazard_detection_id',
                [detectionId, hazardType, intensity, spreadRate, color, coverageArea ? JSON.stringify(coverageArea) : null, JSON.stringify(metadata)]
            );
            return result.rows[0];
        }
    },

    behaviors: {
        create: async (detectionId, behaviorType, intensity = null, peopleInvolved = null, behaviorCategory = null, directionOfMovement = null, metadata = {}) => {
            const result = await query(
                'INSERT INTO behavior_detections (detection_id, behavior_type, intensity, people_involved, behavior_category, direction_of_movement, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING behavior_detection_id',
                [detectionId, behaviorType, intensity, peopleInvolved, behaviorCategory, directionOfMovement ? JSON.stringify(directionOfMovement) : null, JSON.stringify(metadata)]
            );
            return result.rows[0];
        }
    },

    // Tactical analysis
    tactical: {
        getSituation: async () => {
            const result = await query('SELECT * FROM tactical_situation_summary');
            return result.rows;
        },

        getMilitaryThreats: async () => {
            const result = await query('SELECT * FROM military_threats');
            return result.rows;
        },

        getEnvironmentalHazards: async () => {
            const result = await query('SELECT * FROM environmental_hazards');
            return result.rows;
        },

        getViolentBehaviors: async () => {
            const result = await query('SELECT * FROM violent_behaviors');
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






// Run the connection test
testConnection();

module.exports = {
    query,
    initializeSchema,
    pool
};

