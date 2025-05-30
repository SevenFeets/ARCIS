const path = require('path');

// Try different ways to load .env
console.log('🔍 Testing different .env loading methods...\n');

// Method 1: Default
require('dotenv').config();
console.log('Method 1 - Default dotenv:');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***SET***' : 'NOT SET');

// Method 2: Explicit path
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
console.log('Method 2 - Explicit path:');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***SET***' : 'NOT SET');

// Method 3: Current directory
require('dotenv').config({ path: '.env' });
console.log('Method 3 - Current directory:');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***SET***' : 'NOT SET');

console.log('\n🔧 Testing database connection...');

const { Pool } = require('pg');

// Use the loaded environment variables
const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'arcis',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
};

console.log('Final config:');
console.log('User:', dbConfig.user);
console.log('Host:', dbConfig.host);
console.log('Database:', dbConfig.database);
console.log('Password:', dbConfig.password ? '***SET***' : 'NOT SET');
console.log('Port:', dbConfig.port);

async function testConnection() {
    const pool = new Pool(dbConfig);

    try {
        const client = await pool.connect();
        console.log('\n✅ Connection successful!');

        const result = await client.query('SELECT NOW() as current_time');
        console.log('✅ Query successful:', result.rows[0].current_time);

        client.release();
        await pool.end();

    } catch (error) {
        console.error('\n❌ Connection failed:', error.message);
        console.error('Error code:', error.code);

        if (error.code === '28P01') {
            console.log('\n💡 This is an authentication error. Possible causes:');
            console.log('1. Wrong password');
            console.log('2. User does not exist');
            console.log('3. pg_hba.conf authentication method mismatch');
        }
    }
}

testConnection(); 