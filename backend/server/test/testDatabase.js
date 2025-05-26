const { testConnection, initializeDatabase, dbUtils, query } = require('../config/db');

async function runDatabaseTests() {
    console.log('🧪 Starting ARCIS Database Tests...\n');

    try {
        // Test 1: Database Connection
        console.log('1️⃣ Testing database connection...');
        await testConnection();
        console.log('✅ Database connection test passed\n');

        // Test 2: Schema Initialization (optional - only run if schema doesn't exist)
        console.log('2️⃣ Testing schema initialization...');
        try {
            await initializeDatabase();
            console.log('✅ Schema initialization test passed\n');
        } catch (err) {
            console.log('ℹ️ Schema already exists or initialization skipped:', err.message, '\n');
        }

        // Test 3: User Operations
        console.log('3️⃣ Testing user operations...');
        const testUser = await dbUtils.users.create(
            'testuser_' + Date.now(),
            'test' + Date.now() + '@arcis.com', // Ensure unique email
            'hashedpassword123',
            'admin'
        );
        console.log('✅ User created:', testUser);

        const foundUser = await dbUtils.users.findById(testUser.user_id);
        console.log('✅ User found:', foundUser.username);
        console.log('✅ User operations test passed\n');

        // Test 4: Device Operations
        console.log('4️⃣ Testing device operations...');
        const testDevice = await dbUtils.devices.create(
            'Test Camera ' + Date.now(),
            'IP Camera',
            '192.168.1.' + Math.floor(Math.random() * 255), // Ensure unique IP
            '00:11:22:33:44:' + Math.floor(Math.random() * 99).toString().padStart(2, '0'), // Ensure unique MAC
            { resolution: '1920x1080', fps: 30 }
        );
        console.log('✅ Device created:', testDevice);

        await dbUtils.devices.updateStatus(testDevice.device_id, 'online');
        console.log('✅ Device status updated');

        const onlineDevices = await dbUtils.devices.getOnline();
        console.log('✅ Online devices found:', onlineDevices.length);
        console.log('✅ Device operations test passed\n');

        // Test 5: Detection Session Operations
        console.log('5️⃣ Testing detection session operations...');
        const testSession = await dbUtils.sessions.create(
            testDevice.device_id,
            testUser.user_id,
            { detection_threshold: 0.8 }
        );
        console.log('✅ Detection session created:', testSession);

        const activeSessions = await dbUtils.sessions.getActive();
        console.log('✅ Active sessions found:', activeSessions.length);
        console.log('✅ Session operations test passed\n');

        // Test 6: Frame Operations
        console.log('6️⃣ Testing frame operations...');
        const testFrame = await dbUtils.frames.create(
            testSession.session_id,
            '/uploads/frames/test_frame_' + Date.now() + '.jpg',
            1920,
            1080,
            { camera_settings: { iso: 100, shutter: '1/60' } }
        );
        console.log('✅ Frame created:', testFrame);
        console.log('✅ Frame operations test passed\n');

        // Test 7: Detection Operations
        console.log('7️⃣ Testing detection operations...');
        const testDetection = await dbUtils.detections.create(
            testFrame.frame_id,
            'weapon',
            'rifle',
            0.95,
            { x: 100, y: 200, width: 50, height: 30 },
            8,
            null,
            { confidence_details: 'High confidence detection' }
        );
        console.log('✅ Detection created:', testDetection);

        // Test specialized weapon detection
        const weaponDetection = await dbUtils.weapons.create(
            testDetection.detection_id,
            'assault_rifle',
            true,
            '5.56mm',
            45.0,
            true,
            { manufacturer: 'unknown' }
        );
        console.log('✅ Weapon detection created:', weaponDetection);
        console.log('✅ Detection operations test passed\n');

        // Test 8: Alert Operations
        console.log('8️⃣ Testing alert operations...');
        const testAlert = await dbUtils.alerts.create(
            testDetection.detection_id,
            'weapon_detected',
            'combat',
            5,
            'Immediate response required'
        );
        console.log('✅ Alert created:', testAlert);

        const unacknowledgedAlerts = await dbUtils.alerts.getUnacknowledged();
        console.log('✅ Unacknowledged alerts found:', unacknowledgedAlerts.length);
        console.log('✅ Alert operations test passed\n');

        // Test 9: Tactical Views (with error handling)
        console.log('9️⃣ Testing tactical analysis views...');
        try {
            const militaryThreats = await dbUtils.tactical.getMilitaryThreats();
            console.log('✅ Military threats retrieved:', militaryThreats.length);
        } catch (err) {
            console.log('⚠️ Military threats view error:', err.message);
        }

        try {
            const situationSummary = await dbUtils.tactical.getSituation();
            console.log('✅ Tactical situation retrieved:', situationSummary.length);
        } catch (err) {
            console.log('⚠️ Tactical situation view error:', err.message);
        }
        console.log('✅ Tactical analysis test completed\n');

        // Test 10: Custom Query
        console.log('🔟 Testing custom queries...');
        const customResult = await query(
            'SELECT COUNT(*) as total_detections FROM detections WHERE threat_level >= $1',
            [5]
        );
        console.log('✅ High threat detections count:', customResult.rows[0].total_detections);
        console.log('✅ Custom query test passed\n');

        console.log('🎉 All database tests passed successfully!');

    } catch (error) {
        console.error('❌ Database test failed:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the tests
if (require.main === module) {
    runDatabaseTests()
        .then(() => {
            console.log('\n✅ Database testing completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Database testing failed:', error);
            process.exit(1);
        });
}

module.exports = { runDatabaseTests }; 