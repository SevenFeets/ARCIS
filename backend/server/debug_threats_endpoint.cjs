require('dotenv').config();

async function debugThreatsEndpoint() {
    console.log('🔍 Debug Threats Endpoint');
    console.log('========================');

    try {
        // Test the threats endpoint directly
        console.log('📡 Calling /api/detections/threats...');
        const response = await fetch('http://localhost:5000/api/detections/threats');

        if (!response.ok) {
            console.error('❌ Threats endpoint failed:', response.status, response.statusText);
            return;
        }

        const data = await response.json();
        console.log('✅ Threats endpoint response received');

        // Find detection 26
        const detection26 = data.active_weapon_threats?.find(t =>
            t.detection_id === 26 || t.id === 26
        );

        if (!detection26) {
            console.error('❌ Detection 26 not found in threats response');
            console.log('Available detections:', data.active_weapon_threats?.map(t => t.detection_id || t.id));
            return;
        }

        console.log('🎯 Detection 26 found in response:');
        console.log('================================');
        console.log('- detection_id:', detection26.detection_id);
        console.log('- frame_url:', detection26.frame_url);
        console.log('- has_binary_jpeg:', detection26.has_binary_jpeg);
        console.log('- jpeg_endpoint:', detection26.jpeg_endpoint);
        console.log('- detection_frame_data present:', !!detection26.detection_frame_data);
        console.log('- detection_frame_data length:', detection26.detection_frame_data?.length || 'N/A');

        // Check if base64 data starts correctly
        if (detection26.detection_frame_data) {
            const base64Start = detection26.detection_frame_data.substring(0, 50);
            console.log('- base64 data starts with:', base64Start);

            // Check if it's a proper data URL
            if (detection26.detection_frame_data.startsWith('data:image/')) {
                console.log('✅ Base64 data is properly formatted as data URL');
            } else if (detection26.detection_frame_data.startsWith('/9j/') || detection26.detection_frame_data.startsWith('iVBOR')) {
                console.log('⚠️ Base64 data is raw base64, needs data URL prefix');
            } else {
                console.log('❌ Base64 data format unclear');
            }
        }

        // Test direct database query
        console.log('\n🔍 Testing direct database query...');
        const { supabase } = require('./config/supabase');

        const { data: dbData, error: dbError } = await supabase
            .from('detections')
            .select('detection_id, frame_url, detection_frame_data, detection_frame_jpeg')
            .eq('detection_id', 26)
            .single();

        if (dbError) {
            console.error('❌ Database query failed:', dbError);
        } else {
            console.log('✅ Direct database query:');
            console.log('- detection_id:', dbData.detection_id);
            console.log('- frame_url:', dbData.frame_url);
            console.log('- detection_frame_data length:', dbData.detection_frame_data?.length || 'N/A');
            console.log('- detection_frame_jpeg length:', dbData.detection_frame_jpeg?.length || 'N/A');

            if (dbData.detection_frame_data) {
                const dbBase64Start = dbData.detection_frame_data.substring(0, 50);
                console.log('- DB base64 starts with:', dbBase64Start);
            }
        }

    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
}

// Run the debug
debugThreatsEndpoint(); 