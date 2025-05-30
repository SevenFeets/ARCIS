require('dotenv').config();
const { Client } = require('pg');

async function testConfig() {
    console.log('🔧 Testing ARCIS Configuration...\n');

    console.log('Environment Variables:');
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_NAME:', process.env.DB_NAME);
    console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***found***' : 'NOT SET');
    console.log('DB_PORT:', process.env.DB_PORT);
    console.log();

    // Test database configuration
    const dbConfig = {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'arcis',
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
    };

    console.log('Final Database Config:');
    console.log('User:', dbConfig.user);
    console.log('Host:', dbConfig.host);
    console.log('Database:', dbConfig.database);
    console.log('Port:', dbConfig.port);
    console.log('Password:', dbConfig.password ? '***found***' : 'NOT SET');
    console.log();

    // Test actual connection
    console.log('Testing database connection...');
    const client = new Client(dbConfig);

    try {
        await client.connect();
        console.log('✅ Database connection successful!');

        const result = await client.query('SELECT NOW() as current_time');
        console.log('✅ Query test successful:', result.rows[0].current_time);

        await client.end();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);

        if (error.message.includes('database "arcis" does not exist')) {
            console.log('\n💡 Solution: Run the database setup script:');
            console.log('   node scripts/setupDatabase.js');
        } else if (error.message.includes('authentication failed')) {
            console.log('\n💡 Solution: Check your database password in .env file');
        } else if (error.message.includes('connection refused')) {
            console.log('\n💡 Solution: Make sure PostgreSQL is running');
        }
    }
}

if (require.main === module) {
    testConfig();
}

module.exports = { testConfig }; 