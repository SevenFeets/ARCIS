// Load environment variables first
require('dotenv').config({ path: './backend/server/.env' });

const fs = require('fs');
const path = require('path');
const { supabase } = require('./backend/server/config/supabase');

async function addImageToDetection26() {
    console.log('🔫 Adding weapon detection image to Detection ID 26');
    console.log('==================================================');

    try {
        // Step 1: Check if detection 26 exists
        console.log('🔍 Checking if detection 26 exists...');
        const { data: existingDetection, error: checkError } = await supabase
            .from('detections')
            .select('detection_id, object_type, threat_level, confidence, detection_frame_jpeg, frame_url, detection_frame_data')
            .eq('detection_id', 26)
            .single();

        if (checkError) {
            console.error('❌ Error checking detection 26:', checkError.message);
            console.log('💡 Make sure detection 26 exists in your database first!');
            return;
        }

        if (!existingDetection) {
            console.error('❌ Detection 26 not found in database!');
            console.log('💡 Create detection 26 first before adding an image.');
            return;
        }

        console.log('✅ Detection 26 found:', {
            id: existingDetection.detection_id,
            weapon_type: existingDetection.object_type,
            confidence: existingDetection.confidence,
            threat_level: existingDetection.threat_level,
            has_binary_jpeg: !!existingDetection.detection_frame_jpeg,
            has_frame_url: !!existingDetection.frame_url,
            has_base64_data: !!existingDetection.detection_frame_data
        });

        // Step 2: Check if weapon_detection.jpg exists
        const imagePath = path.join(__dirname, 'weapon_detection.jpg');
        if (!fs.existsSync(imagePath)) {
            console.error('❌ weapon_detection.jpg not found!');
            console.log('💡 Make sure weapon_detection.jpg is in the project root directory.');
            return;
        }

        const imageStats = fs.statSync(imagePath);
        console.log(`📁 Found image: ${imagePath}`);
        console.log(`📏 Image size: ${(imageStats.size / 1024).toFixed(2)} KB`);

        // Step 3: Read the binary JPEG data
        const jpegBuffer = fs.readFileSync(imagePath);
        console.log(`📸 JPEG buffer loaded: ${jpegBuffer.length} bytes`);

        // Step 4: Create frame metadata
        const frameMetadata = {
            original_name: 'weapon_detection.jpg',
            size: jpegBuffer.length,
            mimetype: 'image/jpeg',
            format: 'jpeg',
            uploaded_at: new Date().toISOString(),
            added_via: 'test_script'
        };

        console.log('📋 Frame metadata:', frameMetadata);

        // Step 5: Update detection 26 with binary JPEG data
        console.log('🔄 Updating detection 26 with binary JPEG data...');
        const { data: updatedDetection, error: updateError } = await supabase
            .from('detections')
            .update({
                detection_frame_jpeg: jpegBuffer,
                frame_metadata: frameMetadata,
                // Clear old data to avoid confusion
                detection_frame_data: null,
                frame_url: null
            })
            .eq('detection_id', 26)
            .select()
            .single();

        if (updateError) {
            console.error('❌ Error updating detection 26:', updateError.message);
            return;
        }

        console.log('✅ Detection 26 updated successfully!');
        console.log('📊 Updated detection data:', {
            detection_id: updatedDetection.detection_id,
            weapon_type: updatedDetection.object_type,
            has_binary_jpeg: !!updatedDetection.detection_frame_jpeg,
            frame_metadata: updatedDetection.frame_metadata
        });

        // Step 6: Test the binary JPEG endpoint
        console.log('\n🔍 Testing binary JPEG endpoint...');
        const jpegEndpoint = `http://localhost:5000/api/detections/26/jpeg`;
        console.log('🔗 JPEG endpoint:', jpegEndpoint);

        try {
            const response = await fetch(jpegEndpoint);
            if (response.ok) {
                const contentType = response.headers.get('content-type');
                const contentLength = response.headers.get('content-length');
                console.log('✅ JPEG endpoint working!');
                console.log(`📄 Content-Type: ${contentType}`);
                console.log(`📏 Content-Length: ${contentLength} bytes`);
            } else {
                console.log(`⚠️ JPEG endpoint returned status: ${response.status}`);
            }
        } catch (error) {
            console.log('⚠️ Could not test JPEG endpoint (server might not be running):', error.message);
        }

        // Step 7: Test the threats endpoint to verify frontend compatibility
        console.log('\n🔍 Testing threats endpoint...');
        try {
            const threatsResponse = await fetch('http://localhost:5000/api/detections/threats');
            if (threatsResponse.ok) {
                const threats = await threatsResponse.json();
                const threat26 = threats.active_weapon_threats.find(t => t.detection_id === 26);
                if (threat26) {
                    console.log('✅ Detection 26 found in threats endpoint');
                    console.log('📊 Threat data for frontend:', {
                        detection_id: threat26.detection_id,
                        weapon_type: threat26.weapon_type,
                        has_binary_jpeg: threat26.has_binary_jpeg,
                        jpeg_endpoint: threat26.jpeg_endpoint,
                        frame_metadata: threat26.frame_metadata
                    });
                } else {
                    console.log('⚠️ Detection 26 not found in threats (might not meet threat level threshold)');
                }
            }
        } catch (error) {
            console.log('⚠️ Could not test threats endpoint (server might not be running):', error.message);
        }

        console.log('\n🎉 SUCCESS SUMMARY:');
        console.log('==================');
        console.log('✅ Detection 26 updated with binary JPEG image');
        console.log('✅ Image size: ' + (jpegBuffer.length / 1024).toFixed(2) + ' KB');
        console.log('✅ Binary JPEG endpoint: /api/detections/26/jpeg');
        console.log('✅ Frontend ExpandThreatModal will display the image');
        console.log('\n📋 Next steps:');
        console.log('1. Start your backend server: cd backend/server && npm start');
        console.log('2. Start your frontend: cd frontend && npm run dev');
        console.log('3. Open dashboard and click on detection 26 threat to see the image!');

    } catch (error) {
        console.error('❌ Script error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the script
addImageToDetection26(); 