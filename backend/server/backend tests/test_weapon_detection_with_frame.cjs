const fs = require('fs');
const axios = require('axios');

// Read the base64 data from the file
const base64Data = fs.readFileSync('weapon_detection_base64.txt', 'utf8').trim();

const testDetectionWithFrame = async () => {
    try {
        console.log('🧪 Testing weapon detection with frame data...');
        console.log('📸 Base64 data length:', base64Data.length);

        // Create detection with frame data
        const detectionData = {
            object_type: 'Pistol',
            confidence: 0.92,
            bounding_box: {
                x: 100,
                y: 150,
                width: 200,
                height: 180
            },
            threat_level: 8,
            frame_data: `data:image/png;base64,${base64Data}`,
            system_metrics: {
                cpu_usage: 45.2,
                memory_usage: 67.8,
                gpu_usage: 23.1,
                detection_latency: 0.15
            },
            session_id: 1,
            timestamp: new Date().toISOString()
        };

        console.log('📤 Sending detection data...');
        const response = await axios.post('http://localhost:5000/api/detections', detectionData, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'test-api-key-123'
            }
        });

        console.log('✅ Detection created successfully!');
        console.log('🆔 Detection ID:', response.data.data.detection_id);
        console.log('🎯 Weapon Type:', response.data.data.object_type);
        console.log('⚠️ Threat Level:', response.data.data.threat_level);
        console.log('📊 Confidence:', response.data.data.confidence);
        console.log('🚨 Alert Created:', response.data.alert_created);

        // Test getting the detection back
        console.log('\n🔍 Testing detection retrieval...');
        const getResponse = await axios.get(`http://localhost:5000/api/detections/${response.data.data.detection_id}`);

        if (getResponse.data.detection) {
            console.log('✅ Detection retrieved successfully!');
            console.log('📸 Has frame data:', !!getResponse.data.detection.detection_frame_data);
        }

        // Test getting frame data specifically
        console.log('\n🖼️ Testing frame data retrieval...');
        try {
            const frameResponse = await axios.get(`http://localhost:5000/api/detections/${response.data.data.detection_id}/frame`);
            console.log('✅ Frame data retrieved successfully!');
            console.log('📏 Frame data length:', frameResponse.data.frame_data.length);
        } catch (frameError) {
            console.log('❌ Frame endpoint not available:', frameError.response?.status);
        }

        console.log('\n🎉 Test completed! Check your dashboard at http://localhost:3000/dashboard');
        console.log('👀 The detection should appear with the weapon image frame');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
};

testDetectionWithFrame(); 