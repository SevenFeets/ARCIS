const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function quickTest() {
    console.log('🚀 Quick Test of Frame Storage Features\n');

    try {
        // Test 1: Health check
        console.log('1️⃣ Testing health check...');
        const health = await axios.get(`${BASE_URL}/detections/test`);
        console.log('✅ Health check passed:', health.data.message);
        console.log('   Total detections:', health.data.total_detections);

        // Test 2: Create detection with frame data
        console.log('\n2️⃣ Testing detection creation with frame data...');
        const detectionData = {
            object_type: 'Knife',
            confidence: 0.89,
            bounding_box: { x: 100, y: 150, width: 50, height: 75 },
            device_id: 'test-device-001',
            image_path: '/test/frame.jpg',
            metadata: { device_type: 'test', test_data: true },
            frame_data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            system_metrics: {
                cpu_usage: 45.2,
                gpu_usage: 67.8,
                ram_usage: 52.1,
                cpu_temp: 65.5,
                detection_latency: 125,
                alert_played: true
            }
        };

        const createResponse = await axios.post(`${BASE_URL}/detections/incoming`, detectionData);
        console.log('✅ Detection created successfully');
        console.log('   Response:', createResponse.data);

        if (createResponse.data.success && createResponse.data.detection) {
            const detectionId = createResponse.data.detection.detection_id;
            console.log('   Detection ID:', detectionId);

            // Test 3: Get system metrics
            console.log('\n3️⃣ Testing system metrics endpoint...');
            try {
                const metricsResponse = await axios.get(`${BASE_URL}/detections/${detectionId}/metrics`);
                console.log('✅ System metrics retrieved successfully');
                console.log('   CPU Usage:', metricsResponse.data.metrics.cpu_usage);
                console.log('   GPU Usage:', metricsResponse.data.metrics.gpu_usage);
                console.log('   Detection Latency:', metricsResponse.data.metrics.detection_latency);
            } catch (error) {
                console.log('❌ Metrics endpoint error:', error.response?.data?.error || error.message);
            }

            // Test 4: Get detection frame
            console.log('\n4️⃣ Testing detection frame endpoint...');
            try {
                const frameResponse = await axios.get(`${BASE_URL}/detections/${detectionId}/frame`);
                console.log('✅ Detection frame retrieved successfully');
                console.log('   Frame data length:', frameResponse.data.frame_data.length, 'characters');
            } catch (error) {
                console.log('❌ Frame endpoint error:', error.response?.data?.error || error.message);
            }
        }

        // Test 5: Check threats endpoint
        console.log('\n5️⃣ Testing threats endpoint...');
        const threatsResponse = await axios.get(`${BASE_URL}/detections/threats`);
        console.log('✅ Threats retrieved successfully');
        console.log('   Active threats:', threatsResponse.data.threat_count);
        console.log('   Threats with potential frame data:', threatsResponse.data.active_weapon_threats.length);

        console.log('\n🎉 Quick test completed successfully!');
        console.log('\n📋 Next Steps:');
        console.log('1. Open frontend at http://localhost:5173');
        console.log('2. Login and navigate to /dashboard');
        console.log('3. Test the new System Metrics and Expand Threat buttons');
        console.log('4. Use Postman for more detailed API testing (see TESTING_GUIDE.md)');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('- Ensure PostgreSQL database is running');
        console.log('- Ensure backend server is running (npm start)');
        console.log('- Check backend/.env configuration');
    }
}

quickTest(); 