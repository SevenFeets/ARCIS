const { supabase } = require('./config/supabase');

const debugJpegData = async () => {
    console.log('🔍 Debugging JPEG Data in Database');
    console.log('==================================');

    try {
        // Get detection records with JPEG data
        const { data, error } = await supabase
            .from('detections')
            .select('detection_id, detection_frame_jpeg, frame_metadata')
            .not('detection_frame_jpeg', 'is', null)
            .limit(2);

        if (error) {
            console.error('❌ Database error:', error);
            return;
        }

        if (!data || data.length === 0) {
            console.log('❌ No JPEG data found in database');
            return;
        }

        for (const detection of data) {
            console.log(`\n📊 Detection ID: ${detection.detection_id}`);

            if (detection.detection_frame_jpeg) {
                const jpegData = detection.detection_frame_jpeg;
                console.log(`   JPEG data type: ${typeof jpegData}`);
                console.log(`   JPEG data length: ${jpegData.length}`);

                // Check if it's a Buffer or string
                if (Buffer.isBuffer(jpegData)) {
                    console.log(`   ✅ Data is Buffer`);
                    console.log(`   First 10 bytes (hex): ${jpegData.slice(0, 10).toString('hex')}`);
                    console.log(`   Is valid JPEG: ${jpegData.slice(0, 2).toString('hex') === 'ffd8'}`);
                } else if (typeof jpegData === 'string') {
                    console.log(`   ⚠️  Data is string (length: ${jpegData.length})`);
                    console.log(`   First 20 chars: ${jpegData.substring(0, 20)}`);

                    // Check if it looks like base64
                    if (jpegData.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
                        console.log(`   🔍 Looks like base64, trying to decode...`);
                        try {
                            const buffer = Buffer.from(jpegData, 'base64');
                            console.log(`   Base64 decoded length: ${buffer.length}`);
                            console.log(`   Decoded first 10 bytes: ${buffer.slice(0, 10).toString('hex')}`);
                            console.log(`   Is valid JPEG after decode: ${buffer.slice(0, 2).toString('hex') === 'ffd8'}`);
                        } catch (decodeError) {
                            console.log(`   ❌ Base64 decode failed: ${decodeError.message}`);
                        }
                    } else {
                        console.log(`   ❌ Not base64 format`);
                    }
                } else if (jpegData && jpegData.type === 'Buffer') {
                    console.log(`   🔧 Data is Buffer object with data array`);
                    const buffer = Buffer.from(jpegData.data);
                    console.log(`   Buffer length: ${buffer.length}`);
                    console.log(`   First 10 bytes (hex): ${buffer.slice(0, 10).toString('hex')}`);
                    console.log(`   Is valid JPEG: ${buffer.slice(0, 2).toString('hex') === 'ffd8'}`);
                } else {
                    console.log(`   ❌ Unknown data type: ${typeof jpegData}`);
                    console.log(`   Data preview:`, jpegData);
                }
            }

            if (detection.frame_metadata) {
                console.log(`   Frame metadata:`, detection.frame_metadata);
            }
        }

        console.log('\n🎯 Analysis:');
        console.log('- JPEG data should be binary (Buffer)');
        console.log('- First 2 bytes should be FFD8 (JPEG magic)');
        console.log('- If data is string, it might be incorrectly encoded');

    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
};

debugJpegData(); 