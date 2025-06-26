// Load environment variables first
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { supabase } = require('./config/supabase');

async function updateDetection26() {
    console.log('🔄 Updating Detection ID 26 with weapon_detection.jpg');
    console.log('====================================================');

    try {
        // Step 1: Copy the weapon_detection.jpg to the uploads directory
        const sourceFile = path.join(__dirname, '../../weapon_detection.jpg');
        const uploadsDir = path.join(__dirname, 'uploads/detection-frames');

        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
            console.log('📁 Created uploads directory:', uploadsDir);
        }

        // Create a unique filename for the image
        const timestamp = Date.now();
        const filename = `detection_${timestamp}_26.jpg`;
        const targetFile = path.join(uploadsDir, filename);

        // Copy the file
        fs.copyFileSync(sourceFile, targetFile);
        console.log('📸 Copied weapon_detection.jpg to:', filename);

        // Step 2: Update detection 26 in the database
        const frameUrl = `/api/images/${filename}`;

        const { data, error } = await supabase
            .from('detections')
            .update({
                frame_url: frameUrl,
                metadata: {
                    file_info: {
                        original_name: 'weapon_detection.jpg',
                        filename: filename,
                        size: fs.statSync(targetFile).size,
                        mimetype: 'image/jpeg'
                    },
                    updated_at: new Date().toISOString()
                }
            })
            .eq('detection_id', 26)
            .select();

        if (error) {
            console.error('❌ Database update error:', error);
            return;
        }

        if (data && data.length > 0) {
            console.log('✅ Detection 26 updated successfully!');
            console.log('🔗 Frame URL:', frameUrl);
            console.log('📊 Detection data:', JSON.stringify(data[0], null, 2));

            // Test if the image is accessible
            const imageUrl = `http://localhost:5000${frameUrl}`;
            console.log('🖼️ Image should be accessible at:', imageUrl);

            // Test the threats endpoint
            console.log('\n🔍 Testing threats endpoint...');
            const threatsResponse = await fetch('http://localhost:5000/api/detections/threats');
            if (threatsResponse.ok) {
                const threats = await threatsResponse.json();
                const threat26 = threats.active_weapon_threats.find(t => t.detection_id === 26);
                if (threat26) {
                    console.log('✅ Detection 26 found in threats');
                    console.log('🔗 Has frame_url:', threat26.frame_url ? 'Yes' : 'No');
                    console.log('📸 Has base64 data:', threat26.detection_frame_data ? 'Yes' : 'No');
                    if (threat26.frame_url) {
                        console.log('🔗 Frame URL:', threat26.frame_url);
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

updateDetection26(); 