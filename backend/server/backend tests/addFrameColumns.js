const { dbUtils } = require('../../config/db');

async function addFrameColumns() {
    try {
        console.log('🔄 Adding frame storage columns to detections table...');

        // Add the new columns if they don't exist
        await dbUtils.query(`
            ALTER TABLE arcis.detections 
            ADD COLUMN IF NOT EXISTS detection_frame_data TEXT,
            ADD COLUMN IF NOT EXISTS system_metrics JSONB;
        `);

        console.log('✅ Successfully added frame storage columns');

        // Test the columns by inserting a sample detection with frame data
        console.log('🧪 Testing new columns with sample data...');

        const testFrameData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='; // 1x1 pixel PNG
        const testSystemMetrics = {
            cpu_usage: 45.2,
            gpu_usage: 67.8,
            ram_usage: 52.1,
            cpu_temp: 65.5,
            gpu_temp: 72.3,
            network_status: 'Connected',
            detection_latency: 125,
            alert_played: true
        };

        const insertResult = await dbUtils.query(`
            INSERT INTO arcis.detections 
            (object_category, object_type, confidence, bounding_box, threat_level, metadata, detection_frame_data, system_metrics) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING detection_id
        `, [
            'weapon',
            'Knife',
            0.89,
            JSON.stringify({ x: 100, y: 150, width: 50, height: 75 }),
            7,
            JSON.stringify({
                device_id: 'test-device-001',
                device_type: 'jetson_nano',
                test_data: true
            }),
            testFrameData,
            JSON.stringify(testSystemMetrics)
        ]);

        const testDetectionId = insertResult.rows[0].detection_id;
        console.log(`✅ Test detection created with ID: ${testDetectionId}`);

        // Verify we can retrieve the frame data
        const retrieveResult = await dbUtils.query(`
            SELECT detection_id, detection_frame_data, system_metrics 
            FROM arcis.detections 
            WHERE detection_id = $1
        `, [testDetectionId]);

        if (retrieveResult.rows.length > 0) {
            const row = retrieveResult.rows[0];
            console.log('✅ Frame data retrieval test passed');
            console.log(`   - Frame data length: ${row.detection_frame_data ? row.detection_frame_data.length : 0} characters`);
            console.log(`   - System metrics keys: ${Object.keys(JSON.parse(row.system_metrics)).join(', ')}`);
        }

        console.log('🎉 Frame storage migration completed successfully!');

    } catch (error) {
        console.error('❌ Error adding frame columns:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    addFrameColumns()
        .then(() => {
            console.log('Migration completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { addFrameColumns }; 