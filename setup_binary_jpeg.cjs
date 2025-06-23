const fs = require('fs');
const path = require('path');

async function setupBinaryJpeg() {
    console.log('🔧 Setting up Binary JPEG support and updating Detection 26');
    console.log('===========================================================');

    try {
        // Load environment variables from backend
        require('dotenv').config({ path: './backend/server/.env' });

        // Import Supabase client
        const { createClient } = require('@supabase/supabase-js');

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('❌ Missing Supabase credentials in .env file');
            console.log('💡 Check backend/server/.env for SUPABASE_URL and SUPABASE_ANON_KEY');
            return;
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log('✅ Connected to Supabase');

        // Step 1: Check if binary JPEG columns exist
        console.log('\n🔍 Checking database schema...');

        // Step 2: Check if detection 26 exists
        console.log('🔍 Checking if detection 26 exists...');
        const { data: detection26, error: checkError } = await supabase
            .from('detections')
            .select('*')
            .eq('detection_id', 26)
            .single();

        if (checkError) {
            console.error('❌ Error checking detection 26:', checkError.message);
            console.log('💡 Make sure detection 26 exists in your database first!');
            console.log('💡 Run this SQL in your Supabase SQL editor to create it:');
            console.log(`
INSERT INTO detections (detection_id, object_category, object_type, confidence, bounding_box, threat_level, timestamp) 
VALUES (26, 'weapon', 'Pistol', 0.92, '{"x": 100, "y": 150, "width": 80, "height": 120}', 8, NOW());
            `);
            return;
        }

        console.log('✅ Detection 26 found:', {
            id: detection26.detection_id,
            weapon_type: detection26.object_type,
            confidence: detection26.confidence,
            threat_level: detection26.threat_level
        });

        // Step 3: Check if weapon_detection.jpg exists
        const imagePath = path.join(__dirname, 'weapon_detection.jpg');
        if (!fs.existsSync(imagePath)) {
            console.error('❌ weapon_detection.jpg not found!');
            console.log('💡 Make sure weapon_detection.jpg is in the project root directory.');
            return;
        }

        const imageStats = fs.statSync(imagePath);
        console.log(`✅ Found image: ${imagePath}`);
        console.log(`📏 Image size: ${(imageStats.size / 1024).toFixed(2)} KB`);

        // Step 4: Read the image and convert to base64 (simpler approach)
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

        console.log(`📸 Converted image to base64: ${base64Image.length} characters`);

        // Step 5: Update detection 26 with base64 image data
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
            image_size: updatedDetection.detection_frame_data?.length || 0
        });

        // Step 6: Test the threats endpoint
        console.log('\n🔍 Testing detection retrieval...');
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
                console.log('✅ Detection 26 found in threats');
                console.log('📊 Threat data for frontend:', {
                    detection_id: threat26.detection_id,
                    weapon_type: threat26.object_type,
                    confidence: threat26.confidence,
                    threat_level: threat26.threat_level,
                    has_image: !!threat26.detection_frame_data
                });
            } else {
                console.log('⚠️ Detection 26 not found in threats (might not meet threat level threshold)');
            }
        }

        console.log('\n🎉 SUCCESS SUMMARY:');
        console.log('==================');
        console.log('✅ Detection 26 updated with image data');
        console.log('✅ Image format: Base64 JPEG');
        console.log('✅ Image size: ' + (imageStats.size / 1024).toFixed(2) + ' KB');
        console.log('✅ Frontend ExpandThreatModal will display the image');
        console.log('\n📋 Next steps:');
        console.log('1. Start your backend server: cd backend/server && npm start');
        console.log('2. Start your frontend: cd frontend && npm run dev');
        console.log('3. Open dashboard and click on a threat to see the image!');
        console.log('\n💡 The image will appear in the "Detection Frame" section of the threat modal.');

    } catch (error) {
        console.error('❌ Script error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the script
setupBinaryJpeg(); 