const { query, testConnection } = require('../config/db');

async function testSchemaAccess() {
    console.log('🔍 Testing schema access...\n');

    try {
        await testConnection();

        // Test 1: Check current search path
        const searchPath = await query('SHOW search_path');
        console.log('Current search path:', searchPath.rows[0].search_path);

        // Test 2: Set search path and test
        await query('SET search_path TO arcis, public');
        console.log('✅ Search path set to arcis');

        // Test 3: Try to access users table
        const usersTest = await query('SELECT COUNT(*) FROM users');
        console.log('✅ Users table accessible, count:', usersTest.rows[0].count);

        // Test 4: List all tables in arcis schema
        const tables = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'arcis'
            ORDER BY table_name
        `);

        console.log('Tables in arcis schema:');
        tables.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

    } catch (error) {
        console.error('❌ Schema access test failed:', error.message);

        // Try with explicit schema prefix
        try {
            console.log('Trying with explicit schema prefix...');
            const usersTest = await query('SELECT COUNT(*) FROM arcis.users');
            console.log('✅ arcis.users accessible, count:', usersTest.rows[0].count);
        } catch (err2) {
            console.error('❌ Even arcis.users failed:', err2.message);
        }
    }
}

if (require.main === module) {
    testSchemaAccess();
}

module.exports = { testSchemaAccess }; 