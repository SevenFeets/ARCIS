const { testConnection, initializeDatabase, query } = require('../config/db');

async function initializeOnly() {
    console.log('🚀 Initializing ARCIS Database from Scratch...\n');

    try {
        // Test connection
        console.log('1️⃣ Testing connection...');
        await testConnection();
        console.log('✅ Connection successful\n');

        // Initialize schema
        console.log('2️⃣ Initializing schema...');
        await initializeDatabase();
        console.log('✅ Schema initialized\n');

        // Verify users table exists
        console.log('3️⃣ Verifying tables...');
        const userTableCheck = await query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'arcis' 
                AND table_name = 'users'
            );
        `);

        console.log('Users table exists:', userTableCheck.rows[0].exists);

        if (userTableCheck.rows[0].exists) {
            console.log('🎉 Database initialization successful!');
            console.log('✅ Ready to run full tests');
        } else {
            console.log('❌ Users table not found after initialization');
        }

    } catch (error) {
        console.error('❌ Initialization failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

if (require.main === module) {
    initializeOnly();
}

module.exports = { initializeOnly }; 