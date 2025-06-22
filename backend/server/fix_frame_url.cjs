// Load environment variables first
require('dotenv').config();

const { supabase } = require('./config/supabase');

async function fixFrameUrl() {
    console.log('🔧 Fixing frame URL for Detection ID 26');
    console.log('=====================================');

    try {
        // Update detection 26 with the correct frame URL
        const correctFrameUrl = '/api/detections/images/detection_1750626534718_26.jpg';

        const { data, error } = await supabase
            .from('detections')
            .update({
                frame_url: correctFrameUrl
            })
            .eq('detection_id', 26)
            .select();

        if (error) {
            console.error('❌ Database update error:', error);
            return;
        }

        if (data && data.length > 0) {
            console.log('✅ Detection 26 frame URL fixed!');
            console.log('🔗 New Frame URL:', correctFrameUrl);

            // Test the threats endpoint again
            console.log('\n🔍 Testing threats endpoint...');
            const threatsResponse = await fetch('http://localhost:5000/api/detections/threats');
            if (threatsResponse.ok) {
                const threats = await threatsResponse.json();
                const threat26 = threats.active_weapon_threats.find(t => t.detection_id === 26);
                if (threat26) {
                    console.log('✅ Detection 26 found in threats');
                    console.log('🔗 Updated frame_url:', threat26.frame_url);

                    // Test the image URL
                    const imageUrl = `http://localhost:5000${threat26.frame_url}`;
                    console.log('\n🖼️ Testing image URL:', imageUrl);

                    try {
                        const imageResponse = await fetch(imageUrl);
                        if (imageResponse.ok) {
                            console.log('✅ Image URL is accessible!');
                            console.log('📏 Content-Length:', imageResponse.headers.get('content-length'));
                            console.log('🎨 Content-Type:', imageResponse.headers.get('content-type'));
                        } else {
                            console.log('❌ Image URL not accessible');
                        }
                    } catch (e) {
                        console.log('❌ Error accessing image:', e.message);
                    }
                }
            }

        } else {
            console.log('❌ Detection 26 not found in database');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

fixFrameUrl(); 