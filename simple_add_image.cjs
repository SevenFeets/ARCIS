const fs = require('fs');
const path = require('path');

async function addImageToDetection26() {
    console.log('🔫 Adding weapon detection image to Detection ID 26');
    console.log('==================================================');

    try {
        // Use existing supabase config from backend
        const { supabase } = require('./config/supabase');

        console.log('✅ Loaded Supabase configuration');

        // Step 1: Check if detection 26 exists
        console.log('🔍 Checking if detection 26 exists...');
        const { data: detection26, error: checkError } = await supabase
            .from('detections')
            .select('*')
            .eq('detection_id', 26)
            .single();

        if (checkError) {
            console.error('❌ Error checking detection 26:', checkError.message);
            console.log('💡 Make sure detection 26 exists in your database first!');
            console.log('💡 You can create it manually in your Supabase dashboard with:');
            console.log('   - detection_id: 26');
            console.log('   - object_type: Pistol');
            console.log('   - confidence: 0.92');
            console.log('   - threat_level: 8');
            return;
        }

        console.log('✅ Detection 26 found:', {
            id: detection26.detection_id,
            weapon_type: detection26.object_type,
            confidence: detection26.confidence,
            threat_level: detection26.threat_level,
            has_existing_image: !!detection26.detection_frame_data
        });

        // Step 2: Check if weapon_detection.jpg exists
        const imagePath = path.join(__dirname, '../../weapon_detection.jpg');
        if (!fs.existsSync(imagePath)) {
            console.error('❌ weapon_detection.jpg not found!');
            console.log('💡 Expected path:', imagePath);
            console.log('💡 Make sure weapon_detection.jpg is in the project root directory.');
            return;
        }

        const imageStats = fs.statSync(imagePath);
        console.log(`✅ Found image: ${imagePath}`);
        console.log(`📏 Image size: ${(imageStats.size / 1024).toFixed(2)} KB`);

        // Step 3: Read the image and convert to base64
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

        console.log(`📸 Converted image to base64: ${base64Image.length} characters`);

        // Step 4: Update detection 26 with image data
        console.log('\n🔄 Updating detection 26 with image data...');
        const { data: updatedDetection, error: updateError } = await supabase
            .from('detections')
            .update({
                detection_frame_data: base64Image,
                metadata: {
                    ...detection26.metadata,
                    image_info: {
                        original_name: 'weapon_detection.jpg',
                        size: imageStats.size,
                        added_at: new Date().toISOString(),
                        format: 'base64_jpeg'
                    }
                }
            })
            .eq('detection_id', 26)
            .select()
            .single();

        if (updateError) {
            console.error('❌ Error updating detection 26:', updateError.message);
            return;
        }

        console.log('✅ Detection 26 updated successfully!');
        console.log('📊 Updated detection:', {
            detection_id: updatedDetection.detection_id,
            weapon_type: updatedDetection.object_type,
            has_image_data: !!updatedDetection.detection_frame_data,
            image_size_chars: updatedDetection.detection_frame_data?.length || 0
        });

        // Step 5: Verify the update by fetching threats
        console.log('\n🔍 Verifying update by fetching high-threat detections...');
        const { data: threats, error: threatsError } = await supabase
            .from('detections')
            .select('*')
            .gte('threat_level', 6)
            .order('timestamp', { ascending: false });

        if (threatsError) {
            console.error('❌ Error getting threats:', threatsError.message);
        } else {
            const threat26 = threats.find(t => t.detection_id === 26);
            if (threat26) {
                console.log('✅ Detection 26 found in threats list');
                console.log('📊 Verification data:', {
                    detection_id: threat26.detection_id,
                    weapon_type: threat26.object_type,
                    confidence: threat26.confidence,
                    threat_level: threat26.threat_level,
                    has_image: !!threat26.detection_frame_data,
                    image_size: threat26.detection_frame_data ? `${(threat26.detection_frame_data.length / 1024).toFixed(2)} KB` : 'N/A'
                });
            } else {
                console.log('⚠️ Detection 26 not found in high-threat list (might not meet threat level ≥6)');
            }
        }

        console.log('\n🎉 SUCCESS! Image added to Detection 26');
        console.log('=========================================');
        console.log('✅ Detection 26 now has image data');
        console.log('✅ Image format: Base64 JPEG in detection_frame_data field');
        console.log('✅ Size: ' + (imageStats.size / 1024).toFixed(2) + ' KB');
        console.log('\n📋 Next steps to see the image:');
        console.log('1. Start your backend server: npm start');
        console.log('2. Start your frontend: cd ../../frontend && npm run dev');
        console.log('3. Open the dashboard and look for Detection ID 26');
        console.log('4. Click on the threat to open the modal');
        console.log('5. The image will appear in the "Detection Frame" section!');

        console.log('\n💡 The ExpandThreatModal will automatically detect and display the base64 image.');

    } catch (error) {
        console.error('❌ Script error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the script
addImageToDetection26(); 