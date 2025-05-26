// Load environment variables
require('dotenv').config();

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'arcis',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
    max: 10,
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

        // Read and execute the schema file
        const schemaPath = path.join(__dirname, 'database.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('🔄 Initializing database schema...');
        await client.query(schemaSql);
        console.log('✅ Database schema initialized successfully');

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
        const res = await pool.query(text, params);
        const duration = Date.now() - start;

        console.log('Query executed:', {
            text: text.substring(0, 50) + '...',
            duration: `${duration}ms`,
            rows: res.rowCount
        });

        return res;
    } catch (err) {
        console.error('❌ Query execution failed:', {
            text: text.substring(0, 50) + '...',
            error: err.message
        });
        throw err;
    }
};

// Simple database operations for testing
const dbUtils = {
    // Test user operations
    testUsers: {
        // Get all users
        getAll: async () => {
            const result = await query('SELECT * FROM test_users ORDER BY created_at DESC');
            return result.rows;
        },

        // Create a new user
        create: async (name, email) => {
            const result = await query(
                'INSERT INTO test_users (name, email) VALUES ($1, $2) RETURNING *',
                [name, email]
            );
            return result.rows[0];
        },

        // Find user by ID
        findById: async (id) => {
            const result = await query('SELECT * FROM test_users WHERE id = $1', [id]);
            return result.rows[0];
        },

        // Find user by email
        findByEmail: async (email) => {
            const result = await query('SELECT * FROM test_users WHERE email = $1', [email]);
            return result.rows[0];
        },

        // Update user
        update: async (id, name, email) => {
            const result = await query(
                'UPDATE test_users SET name = $1, email = $2 WHERE id = $3 RETURNING *',
                [name, email, id]
            );
            return result.rows[0];
        },

        // Delete user
        delete: async (id) => {
            const result = await query('DELETE FROM test_users WHERE id = $1 RETURNING *', [id]);
            return result.rows[0];
        },

        // Count users
        count: async () => {
            const result = await query('SELECT COUNT(*) as total FROM test_users');
            return parseInt(result.rows[0].total);
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
    testConnection,
    initializeDatabase,
    dbUtils,
    gracefulShutdown
};
