const { dbUtils, query, testConnection, initializeDatabase } = require('../config/db');

async function testPersonDetection() {
    console.log('👤 Testing Person Detection Specifically...\n');

    try {
        await testConnection();
        await initializeDatabase();

        // Create test user
        const testUser = await dbUtils.users.create(
            'persontest_' + Date.now(),
            'persontest' + Date.now() + '@arcis.mil',
            '$2b$10$hashedpassword123',
            'operator'
        );

        // Create test device
        const testDevice = await dbUtils.devices.create(
            'Person-Test-Camera',
            'IP Camera',
            '192.168.1.202',
            '00:11:22:33:44:BB',
            'Person Test Location',
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
            '/test/person_frame.jpg',
            1920,
            1080,
            1024000,
            { test: true }
        );

        // Create person detection
        const personDetection = await dbUtils.detections.create(
            testFrame.frame_id,
            'person',
            'military_personnel',
            0.92,
            { x: 200, y: 300, width: 80, height: 200 },
            6,
            null,
            { confidence_details: 'Military personnel detected' }
        );

        console.log('✅ Person detection created:', personDetection.detection_id);

        // Test different ways to create person details
        console.log('Testing person details creation...');

        // Method 1: Pass proper data types with correct column names
        try {
            const personDetails1 = await dbUtils.persons.create(
                personDetection.detection_id,
                'military_combat_uniform', // uniform_type
                '20-30', // estimated_age_range
                'male', // gender
                ['rifle', 'backpack', 'radio'], // carrying_equipment (array -> JSON)
                'standing_alert', // pose_classification
                'patrol', // activity_classification
                {
                    confidence_level: 'high',
                    detection_method: 'computer_vision',
                    threat_assessment: 'medium'
                } // metadata (object -> JSON)
            );
            console.log('✅ Method 1 (correct schema) worked:', personDetails1.uniform_type);
        } catch (error) {
            console.log('❌ Method 1 failed:', error.message);

            // Method 2: Pre-stringify all JSON fields
            try {
                const personDetails2 = await dbUtils.persons.create(
                    personDetection.detection_id,
                    'military_combat_uniform',
                    '20-30',
                    'male',
                    JSON.stringify(['rifle', 'backpack', 'radio']), // Pre-stringified
                    'standing_alert',
                    'patrol',
                    JSON.stringify({
                        confidence_level: 'high',
                        detection_method: 'computer_vision',
                        threat_assessment: 'medium'
                    }) // Pre-stringified
                );
                console.log('✅ Method 2 (pre-stringified) worked:', personDetails2.uniform_type);
            } catch (error2) {
                console.log('❌ Method 2 also failed:', error2.message);
            }
        }

    } catch (error) {
        console.error('❌ Person detection test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

if (require.main === module) {
    testPersonDetection();
}

module.exports = { testPersonDetection }; 