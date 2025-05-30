const { dbUtils, query, testConnection, initializeDatabase } = require('../config/db');

async function testVehicleDetection() {
    console.log('🚗 Testing Vehicle Detection Specifically...\n');

    try {
        await testConnection();
        await initializeDatabase();

        // Create test user
        const testUser = await dbUtils.users.create(
            'vehicletest_' + Date.now(),
            'vehicletest' + Date.now() + '@arcis.mil',
            '$2b$10$hashedpassword123',
            'operator'
        );

        // Create test device
        const testDevice = await dbUtils.devices.create(
            'Vehicle-Test-Camera',
            'IP Camera',
            '192.168.1.201',
            '00:11:22:33:44:AA',
            'Vehicle Test Location',
            { resolution: '4K', fps: 30 }
        );

        // Create test session
        const testSession = await dbUtils.sessions.create(
            testDevice.device_id,
            testUser.user_id,
            { detection_threshold: 0.8 }
        );

        // Create test frame
        const testFrame = await dbUtils.frames.create(
            testSession.session_id,
            '/test/vehicle_frame.jpg',
            1920,
            1080,
            1024000,
            { test: true }
        );

        // Create vehicle detection
        const vehicleDetection = await dbUtils.detections.create(
            testFrame.frame_id,
            'vehicle',
            'military_truck',
            0.88,
            { x: 300, y: 400, width: 150, height: 100 },
            7,
            null,
            { confidence_details: 'Military vehicle detected' }
        );

        console.log('✅ Vehicle detection created:', vehicleDetection.detection_id);

        // Test different ways to create vehicle details
        console.log('Testing vehicle details creation...');

        // Method 1: Pass objects directly
        try {
            const vehicleDetails1 = await dbUtils.vehicles.create(
                vehicleDetection.detection_id,
                'military_truck',
                'M35A2 Cargo Truck',
                4,
                180.0,
                45.5,
                'steel',
                ['mounted_gun', 'radio_antenna'], // Array
                { manufacturer: 'AM General', year: '1990' } // Object
            );
            console.log('✅ Method 1 (objects) worked:', vehicleDetails1.vehicle_type);
        } catch (error) {
            console.log('❌ Method 1 failed:', error.message);

            // Method 2: Pre-stringify JSON
            try {
                const vehicleDetails2 = await dbUtils.vehicles.create(
                    vehicleDetection.detection_id,
                    'military_truck',
                    'M35A2 Cargo Truck',
                    4,
                    180.0,
                    45.5,
                    'steel',
                    JSON.stringify(['mounted_gun', 'radio_antenna']), // Pre-stringified
                    JSON.stringify({ manufacturer: 'AM General', year: '1990' }) // Pre-stringified
                );
                console.log('✅ Method 2 (pre-stringified) worked:', vehicleDetails2.vehicle_type);
            } catch (error2) {
                console.log('❌ Method 2 also failed:', error2.message);

                // Method 3: Check the actual database schema
                const schemaCheck = await query(`
                    SELECT column_name, data_type, is_nullable 
                    FROM information_schema.columns 
                    WHERE table_name = 'vehicle_detections' 
                    AND table_schema = 'arcis'
                    ORDER BY ordinal_position
                `);

                console.log('📋 Vehicle detections table schema:');
                schemaCheck.rows.forEach(col => {
                    console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
                });
            }
        }

    } catch (error) {
        console.error('❌ Vehicle detection test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

if (require.main === module) {
    testVehicleDetection();
}

module.exports = { testVehicleDetection }; 