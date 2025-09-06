const { Pool } = require('pg');
require('dotenv').config();

async function testConnectionString() {
    console.log('🔍 Testing Supabase with CONNECTION_URL directly...\n');

    // Use the DATABASE_URL directly
    const connectionString = process.env.DATABASE_URL;

    console.log('Connection string:');
    console.log(`  URL: ${connectionString.substring(0, 50)}...`);
    console.log('');

    if (!connectionString) {
        console.error('❌ DATABASE_URL not found in environment variables');
        return false;
    }

    const pool = new Pool({
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('⏳ Attempting connection using CONNECTION_URL...');
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

        console.log('\n🎉 Connection string test completed successfully!');
        console.log('\n✅ Your Supabase database is ready!');
        console.log('\n📋 Next steps:');
        console.log('   1. Initialize ARCIS schema');
        console.log('   2. Test your weapon detection endpoints');

        return true;

    } catch (error) {
        console.error('❌ Connection string test failed:');
        console.error(`   Error: ${error.message}`);
        console.error(`   Code: ${error.code}`);

        if (error.message.includes('getaddrinfo ENOTFOUND')) {
            console.log('\n💡 DNS Resolution Failed:');
            console.log('   Your Supabase project may not be fully provisioned yet');
            console.log('   Try waiting 5-10 minutes and test again');
            console.log('   Or use the Supabase SQL Editor to initialize the schema');
        }

        if (error.message.includes('password authentication failed')) {
            console.log('\n💡 Authentication Failed:');
            console.log('   Check your password in the DATABASE_URL');
            console.log('   Make sure special characters are URL encoded');
        }

        await pool.end();
        return false;
    }
}

if (require.main === module) {
    testConnectionString()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = { testConnectionString }; 