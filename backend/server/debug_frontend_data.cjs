require('dotenv').config();
const { supabase } = require('./config/supabase');

async function debugFrontendData() {
    console.log('🔍 ARCIS Frontend Data Debug');
    console.log('===========================');

    try {
        // Step 1: Check what threats endpoint returns
        console.log('📡 Testing /api/detections/threats endpoint...');
        const threatsResponse = await fetch('http://localhost:5000/api/detections/threats');

        if (!threatsResponse.ok) {
            console.error('❌ Threats endpoint failed:', threatsResponse.status);
            return;
        }

        const threats = await threatsResponse.json();
        console.log('✅ Threats endpoint working');

        // Find Detection 26
        const threat26 = threats.active_weapon_threats?.find(t =>
            t.detection_id === 26 || t.id === 26
        );

        if (!threat26) {
            console.error('❌ Detection 26 not found in threats endpoint');
            console.log('Available threats:', threats.active_weapon_threats?.map(t => ({
                id: t.detection_id || t.id,
                weapon_type: t.weapon_type,
                threat_level: t.threat_level
            })));
            return;
        }

        console.log('✅ Detection 26 found in threats');
        console.log('📊 Frontend receives this data:');
        console.log(JSON.stringify({
            id: threat26.id || threat26.detection_id,
            weapon_type: threat26.weapon_type,
            confidence: threat26.confidence,
            threat_level: threat26.threat_level,
            has_detection_frame_data: !!threat26.detection_frame_data,
            has_frame_url: !!threat26.frame_url,
            has_binary_jpeg: !!threat26.has_binary_jpeg,
            jpeg_endpoint: threat26.jpeg_endpoint,
            detection_frame_data_preview: threat26.detection_frame_data ?
                threat26.detection_frame_data.substring(0, 50) + '...' : null,
            frame_url: threat26.frame_url
        }, null, 2));

        // Step 2: Test frame endpoint specifically
        console.log('\n📡 Testing /api/detections/26/frame endpoint...');
        const frameResponse = await fetch('http://localhost:5000/api/detections/26/frame');

        if (frameResponse.ok) {
            const frameData = await frameResponse.json();
            console.log('✅ Frame endpoint working');
            console.log('📊 Frame endpoint returns:', {
                success: frameData.success,
                detection_id: frameData.detection_id,
                has_frame_data: !!frameData.frame_data,
                frame_data_length: frameData.frame_data ? frameData.frame_data.length : 0,
                frame_data_preview: frameData.frame_data ?
                    frameData.frame_data.substring(0, 50) + '...' : null
            });
        } else {
            console.error('❌ Frame endpoint failed:', frameResponse.status);
        }

        // Step 3: Direct database check
        console.log('\n💾 Direct database check...');
        const { data: dbData, error } = await supabase
            .from('detections')
            .select('detection_id, object_type, detection_frame_data, frame_url, detection_frame_jpeg')
            .eq('detection_id', 26)
            .single();

        if (error) {
            console.error('❌ Database error:', error.message);
            return;
        }

        console.log('✅ Database data:', {
            detection_id: dbData.detection_id,
            object_type: dbData.object_type,
            has_detection_frame_data: !!dbData.detection_frame_data,
            detection_frame_data_length: dbData.detection_frame_data ? dbData.detection_frame_data.length : 0,
            detection_frame_data_starts_with: dbData.detection_frame_data ?
                dbData.detection_frame_data.substring(0, 30) : null,
            has_frame_url: !!dbData.frame_url,
            frame_url: dbData.frame_url,
            has_detection_frame_jpeg: !!dbData.detection_frame_jpeg
        });

        // Step 4: Validate base64 format
        if (dbData.detection_frame_data) {
            console.log('\n🔍 Validating base64 format...');
            const isValidBase64 = dbData.detection_frame_data.startsWith('data:image/');
            console.log('✅ Valid data URL format:', isValidBase64);

            if (!isValidBase64) {
                console.log('❌ Invalid format! Should start with "data:image/"');
                console.log('Actual start:', dbData.detection_frame_data.substring(0, 30));
            }
        }

        console.log('\n🎯 DIAGNOSIS COMPLETE');
        console.log('====================');
        if (threat26.detection_frame_data && threat26.detection_frame_data.startsWith('data:image/')) {
            console.log('✅ Data looks correct for frontend display');
            console.log('📋 Next steps:');
            console.log('1. Open browser dev tools (F12)');
            console.log('2. Go to Console tab');
            console.log('3. Click "Expand Threat" on Detection 26');
            console.log('4. Look for ExpandThreatModal console logs');
            console.log('5. Check for any image loading errors');
        } else {
            console.log('❌ Data format issue detected');
            console.log('💡 The image data might not be in the correct format for frontend display');
        }

    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

debugFrontendData(); 