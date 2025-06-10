const axios = require('axios');

async function checkDetections() {
    try {
        console.log('🔍 Checking which detections have frame data...');

        // Get all detections
        const response = await axios.get('http://localhost:5000/api/detections/all');
        const detections = response.data.data || [];
        console.log('Total detections found:', detections.length);

        if (detections.length === 0) {
            console.log('No detections found');
            return;
        }

        // Check last 5 detections for frame data
        const recentDetections = detections.slice(-5);
        console.log('\nChecking recent detections for frame data:');

        for (const detection of recentDetections) {
            try {
                const frameResponse = await axios.get(`http://localhost:5000/api/detections/${detection.id}/frame`);
                console.log(`✅ Detection ${detection.id}: Has frame data (${frameResponse.data.frame_data.length} chars)`);
            } catch (e) {
                console.log(`❌ Detection ${detection.id}: No frame data`);
            }
        }

        console.log('\nChecking recent detections for metrics:');
        for (const detection of recentDetections) {
            try {
                const metricsResponse = await axios.get(`http://localhost:5000/api/detections/${detection.id}/metrics`);
                console.log(`✅ Detection ${detection.id}: Has metrics data`);
            } catch (e) {
                console.log(`❌ Detection ${detection.id}: No metrics data`);
            }
        }

        // Show the structure of recent detections
        console.log('\nStructure of recent detections:');
        recentDetections.forEach(detection => {
            console.log(`Detection ${detection.id}: ${detection.weapon_type || detection.object_type} - Confidence: ${detection.confidence}% - Time: ${detection.timestamp}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkDetections(); 