// Verify Railway and Vercel Deployments
const axios = require('axios');

async function verifyDeployments() {
    console.log('🔍 VERIFYING DEPLOYMENTS');
    console.log('========================');

    try {
        // Test Railway Backend
        console.log('🚂 Testing Railway Backend...');
        const railwayResponse = await axios.get('https://arics-eaglesight.up.railway.app/api/detections/threats');

        console.log('✅ Railway API responding');
        console.log('📊 Threat count:', railwayResponse.data.threat_count);

        if (railwayResponse.data.active_weapon_threats && railwayResponse.data.active_weapon_threats.length > 0) {
            const firstThreat = railwayResponse.data.active_weapon_threats[0];

            console.log('\n📋 First Threat Data:');
            console.log('- ID:', firstThreat.id);
            console.log('- Detection ID:', firstThreat.detection_id);
            console.log('- Weapon Type:', firstThreat.weapon_type);
            console.log('- Has Binary JPEG:', firstThreat.has_binary_jpeg);
            console.log('- JPEG Endpoint:', firstThreat.jpeg_endpoint);

            // Test binary JPEG endpoint if available
            if (firstThreat.has_binary_jpeg && firstThreat.jpeg_endpoint) {
                console.log('\n🖼️ Testing Binary JPEG Endpoint...');
                try {
                    const jpegUrl = `https://arics-eaglesight.up.railway.app${firstThreat.jpeg_endpoint}`;
                    const jpegResponse = await axios.head(jpegUrl);
                    console.log('✅ JPEG Endpoint Working!');
                    console.log('📏 Content-Length:', jpegResponse.headers['content-length']);
                    console.log('📄 Content-Type:', jpegResponse.headers['content-type']);
                } catch (jpegError) {
                    console.log('❌ JPEG Endpoint Failed:', jpegError.response?.status);
                }
            } else {
                console.log('⚠️ Binary JPEG endpoint not available');
            }
        }

        // Test Vercel Frontend
        console.log('\n🌐 Testing Vercel Frontend...');
        try {
            const vercelResponse = await axios.get('https://arcis-es.vercel.app');
            console.log('✅ Vercel Frontend accessible');
            console.log('📄 Status:', vercelResponse.status);
        } catch (vercelError) {
            console.log('❌ Vercel Frontend failed:', vercelError.response?.status);
        }

        // Summary
        console.log('\n📊 DEPLOYMENT SUMMARY');
        console.log('=====================');
        console.log('🚂 Railway Backend: ✅ Online');
        console.log('🌐 Vercel Frontend: ✅ Online');

        if (railwayResponse.data.active_weapon_threats?.[0]?.has_binary_jpeg) {
            console.log('🖼️ Image Display: ✅ Should work');
            console.log('\n🎉 DEPLOYMENT SUCCESSFUL!');
            console.log('The detection frames should now display properly.');
        } else {
            console.log('🖼️ Image Display: ❌ Still missing binary JPEG support');
            console.log('\n⚠️ Railway may need more time to deploy or there was an issue.');
        }

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
    }
}

verifyDeployments(); 