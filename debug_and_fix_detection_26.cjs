// Load environment variables first
console.log('🔧 Loading environment variables...');
require('dotenv').config({ path: './backend/server/.env' });

const fs = require('fs');
const path = require('path');

async function debugAndFixDetection26() {
    console.log('🔫 ARCIS Detection 26 Debug & Fix Tool');
    console.log('====================================');
    console.log('🎯 Goal: Ensure Detection 26 has visible image in threat modal\n');

    try {
        // Step 1: Check if weapon_detection.jpg exists
        console.log('📁 STEP 1: Checking image file...');
        const imagePath = path.join(__dirname, 'weapon_detection.jpg');
        if (!fs.existsSync(imagePath)) {
            console.error('❌ weapon_detection.jpg not found!');
            console.log('💡 Please ensure weapon_detection.jpg is in the project root.');
            return;
        }

        const imageStats = fs.statSync(imagePath);
        console.log(`✅ Image found: ${(imageStats.size / 1024).toFixed(2)} KB`);

        // Step 2: Test Supabase connection
        console.log('\n🔗 STEP 2: Testing database connection...');
        const { supabase } = require('./backend/server/config/supabase');

        // Test basic connection
        const { data: testData, error: testError } = await supabase
            .from('detections')
            .select('count')
            .limit(1);

        if (testError && testError.code !== 'PGRST116') {
            console.error('❌ Database connection failed:', testError.message);
            return;
        }
        console.log('✅ Database connection successful');

        // Step 3: Check if detection 26 exists
        console.log('\n🔍 STEP 3: Checking Detection 26...');
        const { data: detection26, error: checkError } = await supabase
            .from('detections')
            .select('*')
            .eq('detection_id', 26)
            .single();

        if (checkError || !detection26) {
            console.log('❌ Detection 26 not found! Creating it...');

            // Create Detection 26
            const { data: newDetection, error: createError } = await supabase
                .from('detections')
                .insert([{
                    detection_id: 26,
                    object_category: 'weapon',
                    object_type: 'Pistol',
                    confidence: 0.92,
                    bounding_box: { x: 100, y: 150, width: 80, height: 120 },
                    threat_level: 8,
                    timestamp: new Date().toISOString(),
                    metadata: {
                        device_type: 'test_device',
                        entry_type: 'manual_test',
                        created_for: 'demo_purposes'
                    }
                }])
                .select()
                .single();

            if (createError) {
                console.error('❌ Failed to create Detection 26:', createError.message);
                return;
            }

            console.log('✅ Detection 26 created successfully');
            detection26 = newDetection;
        } else {
            console.log('✅ Detection 26 found:', {
                id: detection26.detection_id,
                weapon_type: detection26.object_type,
                confidence: detection26.confidence,
                threat_level: detection26.threat_level,
                has_base64_data: !!detection26.detection_frame_data,
                has_binary_jpeg: !!detection26.detection_frame_jpeg,
                has_frame_url: !!detection26.frame_url
            });
        }

        // Step 4: Add image data using base64 (most compatible)
        console.log('\n📸 STEP 4: Adding image data to Detection 26...');

        // Read and convert image to base64
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

        console.log(`📊 Base64 image created: ${base64Image.length} characters`);

        // Update detection with image data
        const { data: updatedDetection, error: updateError } = await supabase
            .from('detections')
            .update({
                detection_frame_data: base64Image, // Base64 for maximum compatibility
                metadata: {
                    ...detection26.metadata,
                    image_info: {
                        original_name: 'weapon_detection.jpg',
                        size: imageStats.size,
                        format: 'base64_jpeg',
                        added_at: new Date().toISOString(),
                        added_by: 'debug_script'
                    }
                }
            })
            .eq('detection_id', 26)
            .select()
            .single();

        if (updateError) {
            console.error('❌ Failed to update Detection 26:', updateError.message);
            return;
        }

        console.log('✅ Detection 26 updated with image data');
        console.log('📊 Image data length:', updatedDetection.detection_frame_data?.length || 0);

        // Step 5: Test the threats endpoint
        console.log('\n🔍 STEP 5: Testing threats endpoint...');
        try {
            const threatsResponse = await fetch('http://localhost:5000/api/detections/threats');
            if (threatsResponse.ok) {
                const threats = await threatsResponse.json();
                const threat26 = threats.active_weapon_threats?.find(t => t.detection_id === 26);

                if (threat26) {
                    console.log('✅ Detection 26 found in threats endpoint');
                    console.log('📊 Threat data for frontend:', {
                        detection_id: threat26.detection_id,
                        weapon_type: threat26.weapon_type,
                        confidence: threat26.confidence,
                        threat_level: threat26.threat_level,
                        has_image_data: !!threat26.detection_frame_data,
                        has_binary_jpeg: threat26.has_binary_jpeg,
                        jpeg_endpoint: threat26.jpeg_endpoint
                    });
                } else {
                    console.log('⚠️ Detection 26 not found in threats (might not meet threat level threshold)');
                }
            } else {
                console.log('⚠️ Threats endpoint not accessible (server might not be running)');
            }
        } catch (error) {
            console.log('⚠️ Could not test threats endpoint:', error.message);
        }

        // Step 6: Test frame endpoint
        console.log('\n🖼️ STEP 6: Testing frame endpoint...');
        try {
            const frameResponse = await fetch('http://localhost:5000/api/detections/26/frame');
            if (frameResponse.ok) {
                const frameData = await frameResponse.json();
                console.log('✅ Frame endpoint working');
                console.log('📊 Frame data available:', !!frameData.frame_data);
            } else {
                console.log('⚠️ Frame endpoint returned status:', frameResponse.status);
            }
        } catch (error) {
            console.log('⚠️ Could not test frame endpoint:', error.message);
        }

        // Step 7: Success summary and next steps
        console.log('\n🎉 SUCCESS SUMMARY');
        console.log('==================');
        console.log('✅ Detection 26 exists and has image data');
        console.log('✅ Image format: Base64 JPEG (most compatible)');
        console.log('✅ Image size: ' + (imageStats.size / 1024).toFixed(2) + ' KB');
        console.log('✅ Ready for frontend display');

        console.log('\n📋 NEXT STEPS:');
        console.log('1. ✅ Detection 26 is ready');
        console.log('2. 🔄 Refresh your frontend dashboard');
        console.log('3. 🎯 Click on Detection 26 threat to test the modal');
        console.log('4. 📸 The image should now appear in the "Detection Frame" section');

        console.log('\n💡 TROUBLESHOOTING:');
        console.log('- If image still doesn\'t show: Check browser developer console for errors');
        console.log('- If threats endpoint shows no data: Make sure backend server is running');
        console.log('- If detection not found: Threat level might be below threshold (currently 8)');

    } catch (error) {
        console.error('❌ Script error:', error.message);
        console.error('Stack trace:', error.stack);

        console.log('\n🔧 TROUBLESHOOTING STEPS:');
        console.log('1. Ensure backend server is running: cd backend/server && npm start');
        console.log('2. Check .env file in backend/server/ has correct Supabase credentials');
        console.log('3. Verify weapon_detection.jpg exists in project root');
        console.log('4. Try running: node backend/server/test/checkDatabase.js');
    }
}

// Run the script
debugAndFixDetection26(); 