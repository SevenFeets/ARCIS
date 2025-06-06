const { query, testConnection } = require('../config/db');

async function checkDatabase() {
    console.log('🔍 Checking ARCIS Weapon Detection Database State...\n');

    try {
        await testConnection();
        console.log('✅ Database connection successful\n');

        // Check if arcis schema exists
        const schemaCheck = await query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name = 'arcis'
        `);

        console.log('📊 Schema Status:');
        console.log(`   ARCIS Schema exists: ${schemaCheck.rows.length > 0 ? '✅ YES' : '❌ NO'}`);

        // List all schemas
        const allSchemas = await query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
            ORDER BY schema_name
        `);

        console.log('\n📋 Available schemas:');
        allSchemas.rows.forEach(row => {
            const isArcis = row.schema_name === 'arcis';
            console.log(`   ${isArcis ? '🎯' : '📁'} ${row.schema_name}${isArcis ? ' (ARCIS)' : ''}`);
        });

        // If arcis schema exists, check weapon detection tables
        if (schemaCheck.rows.length > 0) {
            console.log('\n🔫 ARCIS Weapon Detection Tables:');

            const weaponTables = [
                'users',
                'devices',
                'detection_sessions',
                'frames',
                'detections',
                'weapon_detections',
                'alerts'
            ];

            for (const tableName of weaponTables) {
                try {
                    const tableCheck = await query(`
                        SELECT COUNT(*) as count
                        FROM information_schema.tables 
                        WHERE table_schema = 'arcis' AND table_name = $1
                    `, [tableName]);

                    if (tableCheck.rows[0].count > 0) {
                        // Table exists, get record count
                        const recordCount = await query(`SELECT COUNT(*) as count FROM arcis.${tableName}`);
                        console.log(`   ✅ ${tableName}: ${recordCount.rows[0].count} records`);
                    } else {
                        console.log(`   ❌ ${tableName}: Table missing`);
                    }
                } catch (error) {
                    console.log(`   ⚠️  ${tableName}: Error accessing (${error.message})`);
                }
            }

            // Check weapon detection views
            console.log('\n👁️ ARCIS Weapon Detection Views:');

            const weaponViews = [
                'recent_alerts',
                'weapon_threat_summary',
                'active_weapon_threats',
                'critical_alerts',
                'latest_detections'
            ];

            for (const viewName of weaponViews) {
                try {
                    const viewCheck = await query(`
                        SELECT COUNT(*) as count
                        FROM information_schema.views 
                        WHERE table_schema = 'arcis' AND table_name = $1
                    `, [viewName]);

                    if (viewCheck.rows[0].count > 0) {
                        console.log(`   ✅ ${viewName}: View exists`);
                    } else {
                        console.log(`   ❌ ${viewName}: View missing`);
                    }
                } catch (error) {
                    console.log(`   ⚠️  ${viewName}: Error checking (${error.message})`);
                }
            }

            // Check weapon types in detections
            console.log('\n🎯 Weapon Detection Data:');
            try {
                const weaponTypes = await query(`
                    SELECT object_type, COUNT(*) as count
                    FROM arcis.detections 
                    WHERE object_type IN ('Knife', 'Pistol', 'weapon', 'rifle')
                    GROUP BY object_type
                    ORDER BY count DESC
                `);

                if (weaponTypes.rows.length > 0) {
                    console.log('   Detected weapon types:');
                    weaponTypes.rows.forEach(row => {
                        const icon = row.object_type === 'rifle' ? '🔫' :
                            row.object_type === 'Pistol' ? '🔫' :
                                row.object_type === 'Knife' ? '🔪' : '⚔️';
                        console.log(`     ${icon} ${row.object_type}: ${row.count} detections`);
                    });
                } else {
                    console.log('   📭 No weapon detections found');
                }

                // Check recent activity
                const recentDetections = await query(`
                    SELECT COUNT(*) as count
                    FROM arcis.detections 
                    WHERE timestamp >= NOW() - INTERVAL '24 hours'
                `);

                const activeAlerts = await query(`
                    SELECT COUNT(*) as count
                    FROM arcis.alerts 
                    WHERE acknowledged = false
                `);

                console.log(`   📊 Recent activity (24h): ${recentDetections.rows[0].count} detections`);
                console.log(`   ⚠️  Active alerts: ${activeAlerts.rows[0].count} unacknowledged`);

            } catch (error) {
                console.log(`   ❌ Error checking weapon data: ${error.message}`);
            }

            // Check system status
            console.log('\n🖥️ System Status:');
            try {
                const onlineDevices = await query(`
                    SELECT COUNT(*) as count
                    FROM arcis.devices 
                    WHERE status = 'online'
                `);

                const activeSessions = await query(`
                    SELECT COUNT(*) as count
                    FROM arcis.detection_sessions 
                    WHERE status = 'active'
                `);

                console.log(`   📱 Online devices: ${onlineDevices.rows[0].count}`);
                console.log(`   🎥 Active sessions: ${activeSessions.rows[0].count}`);

            } catch (error) {
                console.log(`   ❌ Error checking system status: ${error.message}`);
            }

        } else {
            console.log('\n💡 ARCIS schema not found. To initialize:');
            console.log('   1. Run: node test/initializeOnly.js');
            console.log('   2. Or run: node test/testWeaponDetection.js');
        }

        console.log('\n✅ Database check completed successfully!');

    } catch (error) {
        console.error('❌ Database check failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Check PostgreSQL is running');
        console.log('   2. Verify database credentials in .env');
        console.log('   3. Ensure database user has proper permissions');
    }
}

if (require.main === module) {
    checkDatabase()
        .then(() => {
            console.log('\n🎯 Database check completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Database check failed:', error);
            process.exit(1);
        });
}

module.exports = { checkDatabase }; 