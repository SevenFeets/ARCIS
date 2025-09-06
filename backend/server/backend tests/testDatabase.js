const { testConnection, initializeDatabase, dbUtils, query } = require('../../config/db');

async function runFullARCISTests() {
    console.log('🧪 Starting Full ARCIS Database Tests...\n');

    try {
        // Test 1: Database Connection
        console.log('1️⃣ Testing database connection...');
        await testConnection();
        console.log('✅ Connection test passed\n');

        // Test 2: Schema Initialization
        console.log('2️⃣ Initializing ARCIS database schema...');
        await initializeDatabase();
        console.log('✅ Schema initialization passed\n');

        // Test 3: User Operations
        console.log('3️⃣ Testing user operations...');
        const testUser = await dbUtils.users.create(
            'testuser_' + Date.now(),
            'test' + Date.now() + '@arcis.mil',
            '$2b$10$hashedpassword123',
            'operator'
        );
        console.log('✅ User created:', testUser.username);

        const foundUser = await dbUtils.users.findById(testUser.user_id);
        console.log('✅ User found by ID:', foundUser.username);

        await dbUtils.users.updateLastLogin(testUser.user_id);
        console.log('✅ User last login updated');

        const allUsers = await dbUtils.users.getAll();
        console.log('✅ Total users in system:', allUsers.length);
        console.log();

        // Test 4: Device Operations
        console.log('4️⃣ Testing device operations...');
        const testDevice = await dbUtils.devices.create(
            'Test-Camera-' + Date.now(),
            'IP Camera',
            '192.168.1.200',
            '00:11:22:33:44:99',
            'Test Location',
            { resolution: '4K', fps: 30 }
        );
        console.log('✅ Device created:', testDevice.device_name);

        await dbUtils.devices.updateStatus(testDevice.device_id, 'online');
        console.log('✅ Device status updated to online');

        const onlineDevices = await dbUtils.devices.getOnline();
        console.log('✅ Online devices count:', onlineDevices.length);
        console.log();

        // Test 5: Detection Session Operations
        console.log('5️⃣ Testing detection session operations...');
        const testSession = await dbUtils.sessions.create(
            testDevice.device_id,
            testUser.user_id,
            { detection_threshold: 0.8, alert_level: 'high' }
        );
        console.log('✅ Detection session created:', testSession.session_id);

        const activeSessions = await dbUtils.sessions.getActive();
        console.log('✅ Active sessions count:', activeSessions.length);
        console.log();

        // Test 6: Frame Operations
        console.log('6️⃣ Testing frame operations...');
        const testFrame = await dbUtils.frames.create(
            testSession.session_id,
            '/uploads/frames/test_frame_' + Date.now() + '.jpg',
            1920,
            1080,
            2048576,
            { camera_settings: { iso: 100, shutter: '1/60' } }
        );
        console.log('✅ Frame created:', testFrame.frame_id);

        const sessionFrames = await dbUtils.frames.getBySession(testSession.session_id);
        console.log('✅ Frames in session:', sessionFrames.length);
        console.log();

        // Test 7: Detection Operations
        console.log('7️⃣ Testing detection operations...');

        // Create weapon detection
        const weaponDetection = await dbUtils.detections.create(
            testFrame.frame_id,
            'weapon',
            'assault_rifle',
            0.95,
            { x: 100, y: 200, width: 50, height: 30 },
            9,
            null,
            { confidence_details: 'High confidence weapon detection' }
        );
        console.log('✅ Weapon detection created:', weaponDetection.detection_id);

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

        // Create person detection
        const personDetection = await dbUtils.detections.create(
            testFrame.frame_id,
            'person',
            'soldier',
            0.92,
            { x: 500, y: 300, width: 40, height: 80 },
            6,
            { pose: 'standing', joints: [] },
            { confidence_details: 'Person in military uniform' }
        );
        console.log('✅ Person detection created:', personDetection.detection_id);

        const highThreatDetections = await dbUtils.detections.getHighThreat();
        console.log('✅ High threat detections count:', highThreatDetections.length);
        console.log();

        // Test 8: Weapon Detection Operations
        console.log('8️⃣ Testing weapon detection operations...');
        const weaponDetails = await dbUtils.weapons.create(
            weaponDetection.detection_id,
            'assault_rifle',
            true,
            '5.56mm',
            45.0,
            true,
            { manufacturer: 'unknown', condition: 'operational' }
        );
        console.log('✅ Weapon details created:', weaponDetails.weapon_type);

        const activeWeapons = await dbUtils.weapons.getActive();
        console.log('✅ Active weapons count:', activeWeapons.length);
        console.log();

        // Test 9: Vehicle Detection Operations
        console.log('9️⃣ Testing vehicle detection operations...');
        const vehicleDetails = await dbUtils.vehicles.create(
            vehicleDetection.detection_id,
            'military_truck',
            'M35A2 Cargo Truck',
            4,
            180.0,
            45.5,
            'steel',
            JSON.stringify(['mounted_gun', 'radio_antenna']),
            { manufacturer: 'AM General', year: '1990' }
        );
        console.log('✅ Vehicle details created:', vehicleDetails.vehicle_type);

        const militaryVehicles = await dbUtils.vehicles.getMilitary();
        console.log('✅ Military vehicles count:', militaryVehicles.length);
        console.log();

        // Test 10: Person Detection Operations
        console.log('🔟 Testing person detection operations...');
        const personDetails = await dbUtils.persons.create(
            personDetection.detection_id,
            'military_combat_uniform',
            '20-30',
            'male',
            ['rifle', 'backpack', 'radio'],
            'standing_alert',
            'patrol',
            {
                confidence_level: 'high',
                detection_method: 'computer_vision',
                threat_assessment: 'medium'
            }
        );
        console.log('✅ Person details created, uniform type:', personDetails.uniform_type);

        const militaryPersonnel = await dbUtils.persons.getMilitary();
        console.log('✅ Military personnel count:', militaryPersonnel.length);
        console.log();

        // Test 11: Environmental Hazard Operations
        console.log('1️⃣1️⃣ Testing environmental hazard operations...');
        const environmentalDetection = await dbUtils.detections.create(
            testFrame.frame_id,
            'environmental',
            'fire',
            0.89,
            { x: 700, y: 500, width: 80, height: 60 },
            8,
            null,
            { temperature: 'high', smoke_visible: true }
        );

        const hazardDetails = await dbUtils.environmental.create(
            environmentalDetection.detection_id,
            'fire',
            8,
            25.5,
            270.0,
            { temperature: '800C', spread_rate: 'moderate' }
        );
        console.log('✅ Environmental hazard created:', hazardDetails.hazard_type);

        const activeHazards = await dbUtils.environmental.getActive();
        console.log('✅ Active hazards count:', activeHazards.length);
        console.log();

        // Test 12: Alert Operations
        console.log('1️⃣2️⃣ Testing alert operations...');
        const alert = await dbUtils.alerts.create(
            environmentalDetection.detection_id,
            'environmental_hazard',
            'high',
            'Fire Detected in Sector 7',
            'Fire detected in sector 7 - immediate evacuation required',
            {
                evacuation_zone: 'sector_7',
                estimated_response_time: '5_minutes'
            }
        );
        console.log('✅ Alert created:', alert.alert_type);

        await dbUtils.alerts.acknowledge(alert.alert_id, testUser.user_id);
        console.log('✅ Alert acknowledged');

        const activeAlerts = await dbUtils.alerts.getActive();
        console.log('✅ Active alerts count:', activeAlerts.length);
        console.log();

        // Test 13: Tactical Analysis Operations
        console.log('1️⃣3️⃣ Testing tactical analysis operations...');

        const tacticalSituation = await dbUtils.tactical.getSituation();
        console.log('✅ Tactical situation entries:', tacticalSituation.length);

        const militaryThreats = await dbUtils.tactical.getMilitaryThreats();
        console.log('✅ Military threats count:', militaryThreats.length);

        const environmentalOverview = await dbUtils.tactical.getEnvironmentalHazards();
        console.log('✅ Environmental hazards overview:', environmentalOverview.length);

        const threatSummary = await dbUtils.tactical.getThreatSummary();
        console.log('✅ Threat summary categories:', threatSummary.length);
        threatSummary.forEach(summary => {
            console.log(`   - ${summary.object_category}: ${summary.count} detections, max threat: ${summary.max_threat_level}`);
        });
        console.log();

        // Test 14: Complex Query Test
        console.log('1️⃣4️⃣ Testing complex queries...');
        const complexResult = await query(`
            SELECT 
                COUNT(CASE WHEN d.threat_level >= 8 THEN 1 END) as critical_threats,
                COUNT(CASE WHEN d.threat_level >= 6 AND d.threat_level < 8 THEN 1 END) as high_threats,
                COUNT(CASE WHEN d.object_category = 'weapon' THEN 1 END) as weapon_detections,
                COUNT(CASE WHEN d.object_category = 'vehicle' THEN 1 END) as vehicle_detections,
                COUNT(CASE WHEN d.object_category = 'person' THEN 1 END) as person_detections,
                COUNT(CASE WHEN d.object_category = 'environmental' THEN 1 END) as environmental_detections
            FROM detections d
            WHERE d.detected_at >= NOW() - INTERVAL '1 hour'
        `);

        const stats = complexResult.rows[0];
        console.log('✅ Threat Statistics (last hour):');
        console.log(`   - Critical threats: ${stats.critical_threats}`);
        console.log(`   - High threats: ${stats.high_threats}`);
        console.log(`   - Weapon detections: ${stats.weapon_detections}`);
        console.log(`   - Vehicle detections: ${stats.vehicle_detections}`);
        console.log(`   - Person detections: ${stats.person_detections}`);
        console.log(`   - Environmental detections: ${stats.environmental_detections}`);
        console.log();

        console.log('🎉 All ARCIS database tests passed successfully!');
        console.log('📊 System is ready for tactical operations!');

    } catch (error) {
        console.error('❌ ARCIS test failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the tests
if (require.main === module) {
    runFullARCISTests()
        .then(() => {
            console.log('\n✅ ARCIS testing completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ ARCIS testing failed:', error);
            process.exit(1);
        });
}

module.exports = { runFullARCISTests };