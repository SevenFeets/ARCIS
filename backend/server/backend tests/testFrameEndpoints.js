const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testFrameEndpoints() {
    try {
        console.log('🧪 Testing Frame Storage and Metrics Endpoints...\n');

        // Test 1: Create a detection with frame data
        console.log('1️⃣ Testing detection creation with frame data...');

        const testFrameData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='; // 1x1 pixel PNG
        const testSystemMetrics = {
            cpu_usage: 45.2,
            gpu_usage: 67.8,
            ram_usage: 52.1,
            cpu_temp: 65.5,
            gpu_temp: 72.3,
            cpu_voltage: 1.2,
            gpu_voltage: 1.1,
            network_status: 'Connected',
            network_speed: 100,
            network_signal_strength: -45,
            disk_usage: 75.3,
            detection_latency: 125,
            distance_to_detection: 5.2,
            database_status: 'Connected',
            alert_played: true
        };

        const detectionData = {
            object_type: 'Knife',
            confidence: 0.89,
            bounding_box: { x: 100, y: 150, width: 50, height: 75 },
            device_id: 'test-jetson-001',
            image_path: '/test/frame.jpg',
            metadata: {
                device_type: 'jetson_nano',
                test_data: true
            },
            frame_data: testFrameData,
            system_metrics: testSystemMetrics
        };

        const createResponse = await axios.post(`${BASE_URL}/detections/incoming`, detectionData);

        if (createResponse.data.success) {
            const detectionId = createResponse.data.detection.detection_id;
            console.log(`✅ Detection created successfully with ID: ${detectionId}`);

            // Test 2: Get system metrics
            console.log('\n2️⃣ Testing system metrics endpoint...');
            try {
                const metricsResponse = await axios.get(`${BASE_URL}/detections/${detectionId}/metrics`);

                if (metricsResponse.data.success) {
                    console.log('✅ System metrics retrieved successfully');
                    console.log(`   - CPU Usage: ${metricsResponse.data.metrics.cpu_usage}%`);
                    console.log(`   - GPU Usage: ${metricsResponse.data.metrics.gpu_usage}%`);
                    console.log(`   - Network Status: ${metricsResponse.data.metrics.network_status}`);
                    console.log(`   - Alert Played: ${metricsResponse.data.metrics.alert_played}`);
                } else {
                    console.log('❌ Failed to retrieve system metrics');
                }
            } catch (error) {
                console.log(`❌ Metrics endpoint error: ${error.response?.data?.error || error.message}`);
            }

            // Test 3: Get detection frame
            console.log('\n3️⃣ Testing detection frame endpoint...');
            try {
                const frameResponse = await axios.get(`${BASE_URL}/detections/${detectionId}/frame`);

                if (frameResponse.data.success) {
                    console.log('✅ Detection frame retrieved successfully');
                    console.log(`   - Frame data length: ${frameResponse.data.frame_data.length} characters`);
                    console.log(`   - Timestamp: ${frameResponse.data.timestamp}`);
                } else {
                    console.log('❌ Failed to retrieve detection frame');
                }
            } catch (error) {
                console.log(`❌ Frame endpoint error: ${error.response?.data?.error || error.message}`);
            }

            // Test 4: Test with detection that has no frame data
            console.log('\n4️⃣ Testing frame endpoint with detection without frame data...');

            const noFrameData = {
                object_type: 'Pistol',
                confidence: 0.75,
                bounding_box: { x: 200, y: 250, width: 60, height: 80 },
                device_id: 'test-device-002',
                image_path: '/test/frame2.jpg',
                metadata: {
                    device_type: 'raspberry_pi',
                    test_data: true
                }
                // No frame_data or system_metrics
            };

            const noFrameResponse = await axios.post(`${BASE_URL}/detections/incoming`, noFrameData);

            if (noFrameResponse.data.success) {
                const noFrameDetectionId = noFrameResponse.data.detection.detection_id;
                console.log(`✅ Detection without frame created with ID: ${noFrameDetectionId}`);

                try {
                    const noFrameTestResponse = await axios.get(`${BASE_URL}/detections/${noFrameDetectionId}/frame`);
                    console.log('❌ Expected 404 but got success response');
                } catch (error) {
                    if (error.response?.status === 404) {
                        console.log('✅ Correctly returned 404 for detection without frame data');
                    } else {
                        console.log(`❌ Unexpected error: ${error.response?.data?.error || error.message}`);
                    }
                }
            }

        } else {
            console.log('❌ Failed to create detection');
        }

        console.log('\n🎉 Frame storage and metrics endpoint tests completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Run if called directly
if (require.main === module) {
    testFrameEndpoints()
        .then(() => {
            console.log('\nTests completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Tests failed:', error);
            process.exit(1);
        });
}

module.exports = { testFrameEndpoints }; 