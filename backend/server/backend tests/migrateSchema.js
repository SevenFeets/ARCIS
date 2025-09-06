const { query, testConnection } = require('../../config/db');

async function migrateSchema() {
    console.log('🔄 Migrating ARCIS Database Schema to Weapon Detection System...\n');

    try {
        await testConnection();
        console.log('✅ Database connection successful');

        // Set search path
        await query('SET search_path TO arcis, public');
        console.log('✅ Search path set to arcis schema');

        console.log('\n🔧 Starting schema migration...');

        // 1. Update detection_sessions table
        console.log('1️⃣ Updating detection_sessions table...');
        try {
            // Check if settings column exists
            const settingsCheck = await query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'arcis' AND table_name = 'detection_sessions' AND column_name = 'settings'
            `);

            if (settingsCheck.rows.length === 0) {
                // Rename session_settings to settings if it exists
                const sessionSettingsCheck = await query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_schema = 'arcis' AND table_name = 'detection_sessions' AND column_name = 'session_settings'
                `);

                if (sessionSettingsCheck.rows.length > 0) {
                    await query('ALTER TABLE detection_sessions RENAME COLUMN session_settings TO settings');
                    console.log('   ✅ Renamed session_settings to settings');
                } else {
                    await query('ALTER TABLE detection_sessions ADD COLUMN settings JSONB');
                    console.log('   ✅ Added settings column');
                }
            }

            // Update status column to varchar if it's not
            await query('ALTER TABLE detection_sessions ALTER COLUMN status TYPE VARCHAR(255)');
            console.log('   ✅ Updated status column type');

        } catch (error) {
            console.log(`   ⚠️  detection_sessions migration: ${error.message}`);
        }

        // 2. Update detections table
        console.log('2️⃣ Updating detections table...');
        try {
            // Add missing columns to detections table
            const detectionColumns = [
                { name: 'object_category', type: 'VARCHAR(50) DEFAULT \'weapon\'', check: false },
                { name: 'object_type', type: 'VARCHAR(50)', check: true },
                { name: 'confidence', type: 'FLOAT', check: true },
                { name: 'bounding_box', type: 'JSONB', check: true },
                { name: 'timestamp', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP', check: false },
                { name: 'threat_level', type: 'INTEGER', check: false }
            ];

            for (const col of detectionColumns) {
                const columnCheck = await query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_schema = 'arcis' AND table_name = 'detections' AND column_name = $1
                `, [col.name]);

                if (columnCheck.rows.length === 0) {
                    await query(`ALTER TABLE detections ADD COLUMN ${col.name} ${col.type}`);
                    console.log(`   ✅ Added ${col.name} column`);
                }
            }

            // Add weapon type constraint
            try {
                await query(`
                    ALTER TABLE detections 
                    ADD CONSTRAINT check_weapon_types 
                    CHECK (object_type IN ('Knife', 'Pistol', 'weapon', 'rifle'))
                `);
                console.log('   ✅ Added weapon type constraint');
            } catch (error) {
                if (!error.message.includes('already exists')) {
                    console.log(`   ⚠️  Weapon type constraint: ${error.message}`);
                }
            }

        } catch (error) {
            console.log(`   ⚠️  detections migration: ${error.message}`);
        }

        // 3. Update devices table
        console.log('3️⃣ Updating devices table...');
        try {
            // Update status column to varchar
            await query('ALTER TABLE devices ALTER COLUMN status TYPE VARCHAR(255)');
            console.log('   ✅ Updated devices status column type');
        } catch (error) {
            console.log(`   ⚠️  devices migration: ${error.message}`);
        }

        // 4. Update alerts table
        console.log('4️⃣ Updating alerts table...');
        try {
            // Add acknowledged boolean column if it doesn't exist
            const acknowledgedCheck = await query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'arcis' AND table_name = 'alerts' AND column_name = 'acknowledged'
            `);

            if (acknowledgedCheck.rows.length === 0) {
                await query('ALTER TABLE alerts ADD COLUMN acknowledged BOOLEAN DEFAULT FALSE');
                console.log('   ✅ Added acknowledged column');

                // Update acknowledged based on acknowledged_at
                await query(`
                    UPDATE alerts 
                    SET acknowledged = (acknowledged_at IS NOT NULL)
                `);
                console.log('   ✅ Updated acknowledged values based on acknowledged_at');
            }

        } catch (error) {
            console.log(`   ⚠️  alerts migration: ${error.message}`);
        }

        // 5. Create missing views
        console.log('5️⃣ Creating weapon detection views...');

        const views = [
            {
                name: 'recent_alerts',
                sql: `
                    CREATE OR REPLACE VIEW recent_alerts AS
                    SELECT a.alert_id, a.alert_type, a.severity, a.created_at as timestamp, 
                           d.object_type, d.confidence, d.threat_level,
                           f.file_path, s.device_id
                    FROM alerts a
                    JOIN detections d ON a.detection_id = d.detection_id
                    JOIN frames f ON d.frame_id = f.frame_id
                    JOIN detection_sessions s ON f.session_id = s.session_id
                    WHERE a.acknowledged = FALSE
                    ORDER BY a.created_at DESC
                `
            },
            {
                name: 'weapon_threat_summary',
                sql: `
                    CREATE OR REPLACE VIEW weapon_threat_summary AS
                    SELECT 
                        d.object_type,
                        COUNT(*) AS count,
                        AVG(d.threat_level) AS avg_threat_level,
                        MAX(d.threat_level) AS max_threat_level
                    FROM detections d
                    WHERE d.object_type IS NOT NULL
                    GROUP BY d.object_type
                    ORDER BY max_threat_level DESC
                `
            },
            {
                name: 'active_weapon_threats',
                sql: `
                    CREATE OR REPLACE VIEW active_weapon_threats AS
                    SELECT 
                        d.detection_id,
                        COALESCE(d.timestamp, d.detected_at) as timestamp,
                        d.object_type,
                        d.threat_level,
                        d.confidence,
                        f.file_path,
                        s.device_id
                    FROM detections d
                    JOIN frames f ON d.frame_id = f.frame_id
                    JOIN detection_sessions s ON f.session_id = s.session_id
                    WHERE d.threat_level >= 5 AND d.object_type IS NOT NULL
                    ORDER BY d.threat_level DESC, COALESCE(d.timestamp, d.detected_at) DESC
                `
            },
            {
                name: 'critical_alerts',
                sql: `
                    CREATE OR REPLACE VIEW critical_alerts AS
                    SELECT 
                        a.alert_id,
                        a.alert_type,
                        a.severity,
                        a.created_at as timestamp,
                        d.object_type,
                        d.threat_level,
                        f.file_path,
                        s.device_id,
                        s.session_id
                    FROM alerts a
                    JOIN detections d ON a.detection_id = d.detection_id
                    JOIN frames f ON d.frame_id = f.frame_id
                    JOIN detection_sessions s ON f.session_id = s.session_id
                    WHERE a.acknowledged = FALSE AND a.severity >= 4
                    ORDER BY a.severity DESC, a.created_at DESC
                `
            },
            {
                name: 'latest_detections',
                sql: `
                    CREATE OR REPLACE VIEW latest_detections AS
                    SELECT 
                        d.detection_id,
                        COALESCE(d.timestamp, d.detected_at) as timestamp,
                        d.object_type,
                        d.confidence,
                        d.threat_level,
                        f.file_path,
                        s.device_id
                    FROM detections d
                    JOIN frames f ON d.frame_id = f.frame_id
                    JOIN detection_sessions s ON f.session_id = s.session_id
                    WHERE d.object_type IS NOT NULL
                    ORDER BY COALESCE(d.timestamp, d.detected_at) DESC
                    LIMIT 100
                `
            }
        ];

        for (const view of views) {
            try {
                await query(view.sql);
                console.log(`   ✅ Created/updated ${view.name} view`);
            } catch (error) {
                console.log(`   ⚠️  ${view.name} view: ${error.message}`);
            }
        }

        console.log('\n🎉 Schema migration completed successfully!');
        console.log('\n📊 Migration Summary:');
        console.log('   ✅ Updated detection_sessions table');
        console.log('   ✅ Updated detections table with weapon detection columns');
        console.log('   ✅ Updated devices table');
        console.log('   ✅ Updated alerts table');
        console.log('   ✅ Created weapon detection views');

    } catch (error) {
        console.error('❌ Schema migration failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

if (require.main === module) {
    migrateSchema()
        .then(() => {
            console.log('\n✅ Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateSchema }; 