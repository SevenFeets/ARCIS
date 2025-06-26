const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkDetection() {
    try {
        const { data, error } = await supabase
            .from('detections')
            .select('detection_id, detection_frame_jpeg')
            .eq('detection_id', 7)
            .single();

        if (error) {
            console.error('Error:', error);
            return;
        }

        console.log('Detection 7 data format:');
        console.log('Type:', typeof data.detection_frame_jpeg);
        console.log('Is Buffer:', Buffer.isBuffer(data.detection_frame_jpeg));
        console.log('First 50 chars:', typeof data.detection_frame_jpeg === 'string' ? data.detection_frame_jpeg.substring(0, 50) : 'not-string');
        console.log('Starts with x:', typeof data.detection_frame_jpeg === 'string' && data.detection_frame_jpeg.startsWith('x'));
        console.log('Length:', data.detection_frame_jpeg ? data.detection_frame_jpeg.length : 'null');
    } catch (err) {
        console.error('Error:', err);
    }
}

checkDetection(); 