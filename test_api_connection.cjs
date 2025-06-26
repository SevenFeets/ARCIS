// Quick test to verify Railway API connection
const axios = require('axios');

async function testAPIConnection() {
    console.log('🔍 Testing Railway API Connection');
    console.log('================================');

    // Your actual Railway URL
    const RAILWAY_URL = 'https://arcis-production.up.railway.app';

    try {
        // Test 1: Health check
        console.log('1️⃣ Testing health endpoint...');
        const healthResponse = await axios.get(`${RAILWAY_URL}/api/health`);
        console.log('✅ Health check:', healthResponse.data);

        // Test 2: Threats endpoint
        console.log('\n2️⃣ Testing threats endpoint...');
        const threatsResponse = await axios.get(`${RAILWAY_URL}/api/detections/threats`);
        console.log('✅ Threats count:', threatsResponse.data.threat_count);

        if (threatsResponse.data.active_weapon_threats && threatsResponse.data.active_weapon_threats.length > 0) {
            const firstThreat = threatsResponse.data.active_weapon_threats[0];
            console.log('\n📋 First threat details:');
            console.log('- ID:', firstThreat.id);
            console.log('- Detection ID:', firstThreat.detection_id);
            console.log('- Has Binary JPEG:', firstThreat.has_binary_jpeg);
            console.log('- JPEG Endpoint:', firstThreat.jpeg_endpoint);

            // Test 3: Binary JPEG endpoint
            if (firstThreat.has_binary_jpeg && firstThreat.jpeg_endpoint) {
                console.log('\n3️⃣ Testing binary JPEG endpoint...');
                try {
                    const jpegResponse = await axios.head(`${RAILWAY_URL}${firstThreat.jpeg_endpoint}`);
                    console.log('✅ JPEG endpoint working!');
                    console.log('- Content-Type:', jpegResponse.headers['content-type']);
                    console.log('- Content-Length:', jpegResponse.headers['content-length']);
                } catch (jpegError) {
                    console.log('❌ JPEG endpoint failed:', jpegError.response?.status);
                }
            } else {
                console.log('⚠️ No binary JPEG endpoint available');
                console.log('This is why images are not loading!');
            }
        }

    } catch (error) {
        console.error('❌ API connection failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('URL:', error.config?.url);
        }
    }
}

testAPIConnection(); 