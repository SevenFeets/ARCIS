require('dotenv').config();
const { supabase } = require('./config/supabase');

async function fixFrameUrlIssue() {
    console.log('🔧 Fix Frame URL Issue for Detection 26');
    console.log('=====================================');

    try {
        // Step 1: Check current state
        console.log('📊 Current state of Detection 26...');
        const { data: currentDetection, error: fetchError } = await supabase
            .from('detections')
            .select('detection_id, frame_url, detection_frame_data')
            .eq('detection_id', 26)
            .single();

        if (fetchError || !currentDetection) {
            console.error('❌ Could not fetch Detection 26:', fetchError);
            return;
        }

        console.log('✅ Detection 26 found');
        console.log(`   frame_url: ${currentDetection.frame_url}`);
        console.log(`   base64 data length: ${currentDetection.detection_frame_data ? currentDetection.detection_frame_data.length : 'null'}`);

        // Step 2: Clear frame_url so frontend uses base64 data
        console.log('\n🔧 Clearing frame_url to force base64 usage...');
        const { data: updateData, error: updateError } = await supabase
            .from('detections')
            .update({
                frame_url: null,  // Clear this so frontend uses base64
                updated_at: new Date().toISOString()
            })
            .eq('detection_id', 26)
            .select();

        if (updateError) {
            console.error('❌ Failed to update Detection 26:', updateError);
            return;
        }

        console.log('✅ Successfully cleared frame_url for Detection 26');
        console.log('📱 Frontend will now use base64 data instead');

        // Step 3: Verify the fix
        console.log('\n🔍 Verifying fix...');
        const { data: verifyData, error: verifyError } = await supabase
            .from('detections')
            .select('detection_id, frame_url, detection_frame_data')
            .eq('detection_id', 26)
            .single();

        if (verifyError) {
            console.error('❌ Could not verify fix:', verifyError);
            return;
        }

        console.log('✅ Verification complete:');
        console.log(`   frame_url: ${verifyData.frame_url}`);
        console.log(`   base64 data: ${verifyData.detection_frame_data ? 'PRESENT' : 'MISSING'}`);

        console.log('\n🎯 SUCCESS! Detection 26 should now show the image');
        console.log('💡 Refresh your frontend and try opening the threat modal again');

    } catch (error) {
        console.error('❌ Script error:', error);
    }
}

// Run the fix
fixFrameUrlIssue(); 