// Debug what the frontend actually receives from threats endpoint
const axios = require('axios');

async function debugFrontendResponse() {
    console.log('🔍 Debugging Frontend Response Structure');
    console.log('=======================================');

    try {
        const response = await axios.get('https://arcis-production.up.railway.app/api/detections/threats');
        const data = response.data;

        console.log('📊 Response Overview:');
        console.log('- Threat Count:', data.threat_count);
        console.log('- Active Threats:', data.active_weapon_threats?.length);

        if (data.active_weapon_threats && data.active_weapon_threats.length > 0) {
            data.active_weapon_threats.forEach((threat, index) => {
                console.log(`\n🔍 Threat ${index + 1} (ID: ${threat.id}):`);
                console.log('- detection_id:', threat.detection_id);
                console.log('- has_binary_jpeg:', threat.has_binary_jpeg);
                console.log('- jpeg_endpoint:', threat.jpeg_endpoint);
                console.log('- frame_url:', threat.frame_url);
                console.log('- detection_frame_data:', threat.detection_frame_data ? `${threat.detection_frame_data.substring(0, 50)}...` : 'null');

                // Check what the frontend priority system would choose
                console.log('\n🎯 Frontend Priority Analysis:');
                if (threat.has_binary_jpeg && threat.jpeg_endpoint) {
                    console.log('✅ Priority 1: Would use Binary JPEG endpoint');
                    console.log(`   URL: https://arcis-production.up.railway.app${threat.jpeg_endpoint}`);
                } else if (threat.frame_url) {
                    console.log('⚠️ Priority 2: Would use frame_url (potential problem)');
                    console.log(`   URL: https://arcis-production.up.railway.app/api${threat.frame_url}`);
                } else if (threat.detection_frame_data) {
                    console.log('📄 Priority 3: Would use base64 data');
                } else {
                    console.log('❌ Priority 4: Would use fallback API endpoint');
                }
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

debugFrontendResponse(); 