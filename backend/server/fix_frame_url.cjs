// Forcefully clear frame_url for detection 26 - Run from backend/server
require('dotenv').config();
const { supabase } = require('./config/supabase');

async function forceFixFrameUrl() {
    console.log('🔧 Force Fix Frame URL for Detection 26');
    console.log('======================================');

    try {
        // Step 1: Check current state
        console.log('📊 Checking current state...');
        const { data: before, error: beforeError } = await supabase
            .from('detections')
            .select('detection_id, frame_url, detection_frame_data')
            .eq('detection_id', 26)
            .single();

        if (beforeError) {
            console.error('❌ Could not fetch Detection 26:', beforeError);
            return;
        }

        console.log('Current state:');
        console.log('- detection_id:', before.detection_id);
        console.log('- frame_url:', before.frame_url);
        console.log('- base64 data length:', before.detection_frame_data?.length || 'N/A');

        // Step 2: Force clear frame_url using raw SQL for certainty
        console.log('\n🔧 Force clearing frame_url with raw SQL...');
        const { data: sqlResult, error: sqlError } = await supabase
            .rpc('exec_sql', {
                sql: `UPDATE detections SET frame_url = NULL WHERE detection_id = 26 RETURNING detection_id, frame_url;`
            });

        if (sqlError) {
            console.log('⚠️ Raw SQL failed, trying regular update...');

            // Fallback to regular update
            const { data: updateResult, error: updateError } = await supabase
                .from('detections')
                .update({ frame_url: null })
                .eq('detection_id', 26)
                .select('detection_id, frame_url');

            if (updateError) {
                console.error('❌ Update failed:', updateError);
                return;
            } else {
                console.log('✅ Regular update successful');
            }
        } else {
            console.log('✅ Raw SQL update successful');
        }

        // Step 3: Verify the change
        console.log('\n🔍 Verifying the fix...');
        const { data: after, error: afterError } = await supabase
            .from('detections')
            .select('detection_id, frame_url, detection_frame_data')
            .eq('detection_id', 26)
            .single();

        if (afterError) {
            console.error('❌ Verification failed:', afterError);
            return;
        }

        console.log('After fix:');
        console.log('- detection_id:', after.detection_id);
        console.log('- frame_url:', after.frame_url);
        console.log('- base64 data length:', after.detection_frame_data?.length || 'N/A');

        if (after.frame_url === null) {
            console.log('\n🎉 SUCCESS! frame_url is now null');
            console.log('✅ Frontend will now use base64 data');
        } else {
            console.log('\n❌ frame_url is still not null:', after.frame_url);
        }

        // Step 4: Test the threats endpoint
        console.log('\n📡 Testing threats endpoint after fix...');
        const response = await fetch('http://localhost:5000/api/detections/threats');
        if (response.ok) {
            const data = await response.json();
            const detection26 = data.active_weapon_threats?.find(t => t.detection_id === 26);

            if (detection26) {
                console.log('Threats endpoint after fix:');
                console.log('- frame_url:', detection26.frame_url);
                console.log('- base64 data present:', !!detection26.detection_frame_data);
            }
        }

    } catch (error) {
        console.error('❌ Script error:', error);
    }
}

// Run the fix
forceFixFrameUrl(); 