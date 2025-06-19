const { query } = require('../config/db');

async function checkSchema() {
    console.log('🔍 Checking current database schema...\n');

    try {
        // Check detection_sessions table structure
        console.log('📋 detection_sessions table structure:');
        const sessionCols = await query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_schema = 'arcis' AND table_name = 'detection_sessions' 
            ORDER BY ordinal_position
        `);

        sessionCols.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
        });

        // Check detections table structure
        console.log('\n📋 detections table structure:');
        const detectionCols = await query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_schema = 'arcis' AND table_name = 'detections' 
            ORDER BY ordinal_position
        `);

        detectionCols.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
        });

        // Check devices table structure
        console.log('\n📋 devices table structure:');
        const deviceCols = await query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_schema = 'arcis' AND table_name = 'devices' 
            ORDER BY ordinal_position
        `);

        deviceCols.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
        });

        // Check alerts table structure
        console.log('\n📋 alerts table structure:');
        const alertCols = await query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_schema = 'arcis' AND table_name = 'alerts' 
            ORDER BY ordinal_position
        `);

        alertCols.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
        });

    } catch (error) {
        console.error('❌ Schema check failed:', error.message);
    }
}

checkSchema(); 