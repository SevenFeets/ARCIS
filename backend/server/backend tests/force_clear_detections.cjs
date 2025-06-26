const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function forceClearDetections() {
    try {
        console.log('🗑️  FORCE CLEARING ALL DETECTIONS & ALERTS');
        console.log('===========================================');

        // Get current counts
        const { data: detectionsData, error: detectionsError } = await supabase
            .from('detections')
            .select('detection_id');

        const { data: alertsData, error: alertsError } = await supabase
            .from('alerts')
            .select('alert_id');

        if (detectionsError) {
            console.error('❌ Error counting detections:', detectionsError.message);
            return;
        }

        if (alertsError) {
            console.error('❌ Error counting alerts:', alertsError.message);
            return;
        }

        const detectionCount = detectionsData ? detectionsData.length : 0;
        const alertCount = alertsData ? alertsData.length : 0;

        console.log(`📊 Found ${detectionCount} detections to delete`);
        console.log(`📊 Found ${alertCount} alerts to delete`);

        if (detectionCount === 0 && alertCount === 0) {
            console.log('✅ Database is already empty');
            return;
        }

        // Step 1: Delete all alerts first (to avoid foreign key constraint)
        if (alertCount > 0) {
            console.log('🚨 Deleting all alerts first...');
            const { error: alertDeleteError } = await supabase
                .from('alerts')
                .delete()
                .neq('alert_id', 0); // Matches all rows

            if (alertDeleteError) {
                console.error('❌ Alert deletion failed:', alertDeleteError.message);
                return;
            }
            console.log(`✅ Deleted ${alertCount} alerts`);
        }

        // Step 2: Delete all detections
        if (detectionCount > 0) {
            console.log('🗑️  Deleting all detections...');
            const { error: detectionDeleteError } = await supabase
                .from('detections')
                .delete()
                .neq('detection_id', 0); // Matches all rows

            if (detectionDeleteError) {
                console.error('❌ Detection deletion failed:', detectionDeleteError.message);
                return;
            }
            console.log(`✅ Deleted ${detectionCount} detections`);
        }

        // Verify complete cleanup
        const { data: verifyDetections } = await supabase
            .from('detections')
            .select('detection_id');

        const { data: verifyAlerts } = await supabase
            .from('alerts')
            .select('alert_id');

        const remainingDetections = verifyDetections ? verifyDetections.length : 0;
        const remainingAlerts = verifyAlerts ? verifyAlerts.length : 0;

        console.log('');
        console.log('✅ Cleanup complete!');
        console.log('====================');
        console.log(`📊 Deleted: ${detectionCount} detections, ${alertCount} alerts`);
        console.log(`📊 Remaining: ${remainingDetections} detections, ${remainingAlerts} alerts`);

        if (remainingDetections === 0 && remainingAlerts === 0) {
            console.log('🎉 Database is now completely clean!');
            console.log('💡 Ready for fresh uploads starting from ID 1');
            console.log('');
            console.log('🚀 Next steps:');
            console.log('   • Use fixed_device_upload_test.cjs for new test uploads');
            console.log('   • Images will start with clean ID sequence');
            console.log('   • Frontend will display new images properly');
        } else {
            console.log('⚠️  Some records still remain - manual cleanup may be needed');
        }

    } catch (error) {
        console.error('❌ Script error:', error.message);
        console.error('Full error:', error);
    }
}

forceClearDetections(); 