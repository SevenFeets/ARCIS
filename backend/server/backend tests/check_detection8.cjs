const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkDetection() {
    try {
        const { data, error } = await supabase
            .from('detections')
            .select('detection_id, detection_frame_jpeg')
            .eq('detection_id', 8)
            .single();

        if (error) {
            console.error('Error:', error);
            return;
        }

        console.log('Detection 8 data format:');
        console.log('Type:', typeof data.detection_frame_jpeg);
        console.log('Is Buffer:', Buffer.isBuffer(data.detection_frame_jpeg));
        console.log('First 50 chars:', typeof data.detection_frame_jpeg === 'string' ? data.detection_frame_jpeg.substring(0, 50) : 'not-string');
        console.log('Starts with /9j:', typeof data.detection_frame_jpeg === 'string' && data.detection_frame_jpeg.startsWith('/9j'));
        console.log('Length:', data.detection_frame_jpeg ? data.detection_frame_jpeg.length : 'null');

        // Try to decode as base64 to see if it's valid
        if (typeof data.detection_frame_jpeg === 'string' && data.detection_frame_jpeg.startsWith('/9j')) {
            try {
                const buffer = Buffer.from(data.detection_frame_jpeg, 'base64');
                console.log('Base64 decode successful:', buffer.length, 'bytes');
                console.log('First 4 bytes (hex):', buffer.slice(0, 4).toString('hex'));
                console.log('Is valid JPEG:', buffer.slice(0, 2).toString('hex') === 'ffd8');
            } catch (e) {
                console.log('Base64 decode failed:', e.message);
            }
        }

    } catch (error) {
        console.error('Script error:', error.message);
    }
}

checkDetection(); 