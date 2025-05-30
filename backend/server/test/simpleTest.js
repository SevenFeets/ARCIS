const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

async function simpleTest() {
    console.log('🔍 Simple PostgreSQL Test...\n');

    // Debug environment variables
    console.log('DB_PASSWORD type:', typeof process.env.DB_PASSWORD);
    console.log('DB_PASSWORD defined:', process.env.DB_PASSWORD !== undefined);

    const config = {
        user: 'postgres',
        host: 'localhost',
        database: 'postgres', // Connect to default postgres db
        password: process.env.DB_PASSWORD,
        port: 5432,
    };

    console.log('Config:', {
        ...config,
        password: config.password ? '***hidden***' : 'NOT SET'
    });

    try {
        const pool = new Pool(config);
        const client = await pool.connect();
        console.log('✅ Connected successfully!');

        const result = await client.query('SELECT version()');
        console.log('✅ PostgreSQL version:', result.rows[0].version);

        client.release();
        await pool.end();

    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    }
}

simpleTest(); 