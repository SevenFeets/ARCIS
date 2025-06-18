const { Pool } = require('pg');
require('dotenv').config();

async function testSupabaseConnection() {
    console.log('🔍 Testing Supabase Connection...\n');

    // Test configuration
    const config = {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        ssl: {
            rejectUnauthorized: false
        },
        connectionTimeoutMillis: 10000,
    };

    console.log('Connection config:');
    console.log(`  Host: ${config.host}`);
    console.log(`  User: ${config.user}`);
    console.log(`  Database: ${config.database}`);
    console.log(`  Port: ${config.port}`);
    console.log(`  SSL: enabled`);
    console.log('');

    const pool = new Pool(config);

    try {
        console.log('⏳ Attempting connection...');
        const client = await pool.connect();
        console.log('✅ Connection successful!');

        // Test basic query
        console.log('⏳ Testing basic query...');
        const result = await client.query('SELECT NOW() as current_time, version()');
        console.log('✅ Query successful!');
        console.log(`   Current time: ${result.rows[0].current_time}`);
        console.log(`   PostgreSQL version: ${result.rows[0].version.substring(0, 50)}...`);

        // Check if arcis schema exists
        console.log('⏳ Checking for existing ARCIS schema...');
        const schemaCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.schemata 
                WHERE schema_name = 'arcis'
            );
        `);
        console.log(`   ARCIS schema exists: ${schemaCheck.rows[0].exists}`);

        client.release();
        await pool.end();

        console.log('\n🎉 Supabase connection test completed successfully!');
        return true;

    } catch (error) {
        console.error('❌ Connection test failed:');
        console.error(`   Error: ${error.message}`);
        console.error(`   Code: ${error.code}`);

        if (error.message.includes('SASL')) {
            console.log('\n💡 SASL Error Solutions:');
            console.log('   1. Check password has no special characters issues');
            console.log('   2. Try using connection string instead of individual params');
            console.log('   3. Verify Supabase project is fully provisioned');
        }

        if (error.message.includes('ENOTFOUND')) {
            console.log('\n💡 DNS Error Solutions:');
            console.log('   1. Check your internet connection');
            console.log('   2. Try using IPv4 pooler connection');
            console.log('   3. Wait a few minutes for DNS propagation');
        }

        await pool.end();
        return false;
    }
}

if (require.main === module) {
    testSupabaseConnection()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = { testSupabaseConnection }; 