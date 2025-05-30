const { Pool } = require('pg');

async function testDirectConnection() {
    console.log('🔧 Testing Direct Database Connection...\n');

    // Test with explicit configuration
    const pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'arcis',
        password: '4wrdjz67', // Your actual password
        port: 5432,
    });

    try {
        const client = await pool.connect();
        console.log('✅ Direct connection successful!');

        const result = await client.query('SELECT NOW() as current_time');
        console.log('✅ Query successful:', result.rows[0].current_time);

        client.release();
        await pool.end();

    } catch (error) {
        console.error('❌ Direct connection failed:', error.message);

        // Try with postgres database instead
        console.log('\n🔄 Trying with postgres database...');

        const postgresPool = new Pool({
            user: 'postgres',
            host: 'localhost',
            database: 'postgres',
            password: '4wrdjz67',
            port: 5432,
        });

        try {
            const client = await postgresPool.connect();
            console.log('✅ Connection to postgres database successful!');

            // Check if arcis database exists
            const dbResult = await client.query(
                "SELECT 1 FROM pg_database WHERE datname = 'arcis'"
            );

            if (dbResult.rows.length === 0) {
                console.log('❌ ARCIS database does not exist');
                console.log('💡 Creating ARCIS database...');
                await client.query('CREATE DATABASE arcis');
                console.log('✅ ARCIS database created');
            } else {
                console.log('✅ ARCIS database exists');
            }

            client.release();
            await postgresPool.end();

        } catch (error2) {
            console.error('❌ Even postgres database connection failed:', error2.message);
            console.log('\n💡 Possible solutions:');
            console.log('1. Check if PostgreSQL service is running');
            console.log('2. Verify the password is correct');
            console.log('3. Check pg_hba.conf authentication settings');
        }
    }
}

if (require.main === module) {
    testDirectConnection();
}

module.exports = { testDirectConnection }; 