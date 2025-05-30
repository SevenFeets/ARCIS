const { testConnection, initializeDatabase, pool } = require('../config/db');

async function quickTest() {
    console.log('🧪 Quick PostgreSQL Test...\n');

    try {
        console.log('Testing basic connection to postgres database...');

        // First test connection to default postgres database
        const { Pool } = require('pg');
        const testPool = new Pool({
            user: process.env.DB_USER || 'postgres',
            host: process.env.DB_HOST || 'localhost',
            database: 'postgres', // Connect to default postgres db first
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT || 5432,
        });

        const client = await testPool.connect();
        console.log('✅ Connected to PostgreSQL server');

        // Check if arcis database exists
        const dbCheck = await client.query("SELECT 1 FROM pg_database WHERE datname = 'arcis'");

        if (dbCheck.rows.length === 0) {
            console.log('📝 Creating arcis database...');
            await client.query('CREATE DATABASE arcis');
            console.log('✅ Database arcis created');
        } else {
            console.log('✅ Database arcis already exists');
        }

        client.release();
        await testPool.end();

        // Now test connection to arcis database
        console.log('Testing connection to arcis database...');
        await testConnection();

        // Initialize schema
        console.log('Initializing schema...');
        await initializeDatabase();

        console.log('✅ PostgreSQL is working perfectly!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Full error:', error);
    }
}

quickTest(); 