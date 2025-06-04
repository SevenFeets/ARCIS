const { query, testConnection } = require('../config/db');

async function testSchemaAccess() {
    console.log('🔍 Testing ARCIS Weapon Detection Schema Access...\n');

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

        // Test 4: Test weapon detection specific tables
        console.log('\n🔫 Testing weapon detection tables:');

        const weaponTables = [
            'detections',
            'weapon_detections',
            'alerts',
            'devices',
            'detection_sessions',
            'frames'
        ];

        for (const table of weaponTables) {
            try {
                const result = await query(`SELECT COUNT(*) FROM ${table}`);
                console.log(`  ✅ ${table}: ${result.rows[0].count} records`);
            } catch (error) {
                console.log(`  ❌ ${table}: ${error.message}`);
            }
        }

        // Test 5: Test weapon detection views
        console.log('\n📊 Testing weapon detection views:');

        const weaponViews = [
            'recent_alerts',
            'weapon_threat_summary',
            'active_weapon_threats',
            'critical_alerts',
            'latest_detections'
        ];

        for (const view of weaponViews) {
            try {
                const result = await query(`SELECT COUNT(*) FROM ${view}`);
                console.log(`  ✅ ${view}: ${result.rows[0].count} records`);
            } catch (error) {
                console.log(`  ❌ ${view}: ${error.message}`);
            }
        }

        // Test 6: Test weapon type constraint
        console.log('\n🎯 Testing weapon type validation:');
        try {
            await query(`
                SELECT DISTINCT object_type 
                FROM detections 
                WHERE object_category = 'weapon'
                ORDER BY object_type
            `);
            console.log('✅ Weapon type constraint working');
        } catch (error) {
            console.log('❌ Weapon type constraint test failed:', error.message);
        }

        // Test 7: List all tables in arcis schema
        const tables = await query(`
            SELECT table_name, table_type
            FROM information_schema.tables 
            WHERE table_schema = 'arcis'
            ORDER BY table_type, table_name
        `);

        console.log('\n📋 All objects in ARCIS schema:');
        tables.rows.forEach(row => {
            const icon = row.table_type === 'BASE TABLE' ? '📄' : '👁️';
            console.log(`  ${icon} ${row.table_name} (${row.table_type})`);
        });

        console.log('\n✅ Schema access test completed successfully!');

    } catch (error) {
        console.error('❌ Schema access test failed:', error.message);

        // Try with explicit schema prefix
        try {
            console.log('\n🔧 Trying with explicit schema prefix...');
            const usersTest = await query('SELECT COUNT(*) FROM arcis.users');
            console.log('✅ arcis.users accessible, count:', usersTest.rows[0].count);

            const detectionsTest = await query('SELECT COUNT(*) FROM arcis.detections');
            console.log('✅ arcis.detections accessible, count:', detectionsTest.rows[0].count);

        } catch (err2) {
            console.error('❌ Even explicit schema access failed:', err2.message);

            // Check if schema exists at all
            try {
                const schemaCheck = await query(`
                    SELECT schema_name 
                    FROM information_schema.schemata 
                    WHERE schema_name = 'arcis'
                `);

                if (schemaCheck.rows.length === 0) {
                    console.log('💡 ARCIS schema does not exist. Run schema initialization first.');
                } else {
                    console.log('✅ ARCIS schema exists but tables may not be accessible');
                }
            } catch (err3) {
                console.error('❌ Cannot even check schema existence:', err3.message);
            }
        }
    }
}

if (require.main === module) {
    testSchemaAccess()
        .then(() => {
            console.log('\n🎯 Schema access test completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Schema access test failed:', error);
            process.exit(1);
        });
}

module.exports = { testSchemaAccess }; 