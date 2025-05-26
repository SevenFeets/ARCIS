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

};

