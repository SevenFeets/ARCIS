// Fix Detection 26 Image - Run from backend/server directory
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { supabase } = require('./config/supabase');

async function fixDetection26() {
    console.log('🔫 ARCIS Detection 26 - Image Fix');
    console.log('=================================');

    try {
        // Step 1: Check if image exists (go up 2 levels to project root)
        console.log('📁 Checking for weapon_detection.jpg...');
        const imagePath = path.join(__dirname, '../../weapon_detection.jpg');

        if (!fs.existsSync(imagePath)) {
            console.error('❌ weapon_detection.jpg not found!');
            console.log('💡 Expected location:', imagePath);
            console.log('💡 Make sure weapon_detection.jpg is in the project root directory');
            return;
        }

        const imageStats = fs.statSync(imagePath);
        console.log(`✅ Image found: ${(imageStats.size / 1024).toFixed(2)} KB`);

        // Step 2: Test database connection
        console.log('\n🔗 Testing database connection...');
        const { data: testData, error: testError } = await supabase
            .from('detections')
            .select('count')
            .limit(1);

        if (testError && testError.code !== 'PGRST116') {
            console.error('❌ Database connection failed:', testError.message);
            return;
        }
        console.log('✅ Database connected successfully');

        // Step 3: Check Detection 26
        console.log('\n🔍 Checking Detection 26...');
        let { data: detection26, error: checkError } = await supabase
            .from('detections')
            .select('*')
            .eq('detection_id', 26)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('❌ Error checking Detection 26:', checkError.message);
            return;
        }

        if (!detection26) {
            console.log('❌ Detection 26 not found. Creating it...');

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
                        device_type: 'demo_device',
                        location: 'Test Area',
                        device_id: 'ARCIS-001',
                        entry_type: 'image_fix_script'
                    }
                }])
                .select()
                .single();

            if (createError) {
                console.error('❌ Failed to create Detection 26:', createError.message);
                return;
            }

            detection26 = newDetection;
            console.log('✅ Detection 26 created successfully');
        } else {
            console.log('✅ Detection 26 found');
        }

        console.log('📊 Current detection state:', {
            id: detection26.detection_id,
            weapon_type: detection26.object_type,
            confidence: detection26.confidence,
            threat_level: detection26.threat_level,
            has_base64_data: !!detection26.detection_frame_data,
            has_binary_jpeg: !!detection26.detection_frame_jpeg,
            has_frame_url: !!detection26.frame_url
        });

        // Step 4: Convert image to base64 and update detection
        console.log('\n📸 Adding image to Detection 26...');
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

        console.log(`📊 Base64 conversion complete: ${(base64Image.length / 1024).toFixed(1)} KB`);

        // Update detection with image data
        const { data: updatedDetection, error: updateError } = await supabase
            .from('detections')
            .update({
                detection_frame_data: base64Image,  // This is what ExpandThreatModal looks for first
                metadata: {
                    ...detection26.metadata,
                    image_info: {
                        original_name: 'weapon_detection.jpg',
                        size: imageStats.size,
                        format: 'base64_jpeg',
                        added_at: new Date().toISOString(),
                        method: 'backend_fix_script'
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

        // Step 5: Test the endpoints
        console.log('\n🔍 Testing API endpoints...');

        // Test frame endpoint
        try {
            const frameResponse = await fetch('http://localhost:5000/api/detections/26/frame');
            if (frameResponse.ok) {
                const frameData = await frameResponse.json();
                console.log('✅ Frame endpoint working');
                console.log('📊 Frame data size:', frameData.frame_data ?
                    `${(frameData.frame_data.length / 1024).toFixed(1)} KB` : 'None');
            } else {
                console.log('⚠️ Frame endpoint status:', frameResponse.status);
            }
        } catch (error) {
            console.log('⚠️ Frame endpoint test failed (server might not be running)');
        }

        // Test threats endpoint
        try {
            const threatsResponse = await fetch('http://localhost:5000/api/detections/threats');
            if (threatsResponse.ok) {
                const threats = await threatsResponse.json();
                const threat26 = threats.active_weapon_threats?.find(t =>
                    t.detection_id === 26 || t.id === 26
                );

                if (threat26) {
                    console.log('✅ Detection 26 found in threats endpoint');
                    console.log('📊 Threat data for frontend:', {
                        detection_id: threat26.detection_id || threat26.id,
                        weapon_type: threat26.weapon_type || threat26.object_type,
                        threat_level: threat26.threat_level,
                        has_image_data: !!threat26.detection_frame_data
                    });
                } else {
                    console.log('⚠️ Detection 26 not found in threats (checking threat level...)');
                    console.log('ℹ️ Threat level is:', detection26.threat_level, '(needs to be ≥6 for threats endpoint)');
                }
            } else {
                console.log('⚠️ Threats endpoint status:', threatsResponse.status);
            }
        } catch (error) {
            console.log('⚠️ Threats endpoint test failed (server might not be running)');
        }

        // Step 6: Success summary
        console.log('\n🎉 SUCCESS! Detection 26 Image Fix Complete');
        console.log('==========================================');
        console.log('✅ Detection 26 exists with image data');
        console.log('✅ Image format: Base64 JPEG (frontend compatible)');
        console.log('✅ Image size: ' + (imageStats.size / 1024).toFixed(2) + ' KB');
        console.log('✅ Database updated successfully');

        console.log('\n📋 NEXT STEPS:');
        console.log('1. 🚀 Start backend server: npm start (from this directory)');
        console.log('2. 🚀 Start frontend: cd ../../frontend && npm run dev');
        console.log('3. 🔄 Refresh your dashboard page');
        console.log('4. 🎯 Look for Detection 26 in the threats list');
        console.log('5. 🖱️ Click "Expand Threat" button on Detection 26');
        console.log('6. 📸 Image should appear in "Detection Frame" section!');

        console.log('\n🔧 If image still doesn\'t show:');
        console.log('- Open browser dev tools (F12) and check Console for errors');
        console.log('- Verify both servers are running (backend:5000, frontend:5173)');
        console.log('- Check Network tab to see if image requests are being made');

    } catch (error) {
        console.error('❌ Script failed:', error.message);
        console.error('Full error:', error);

        console.log('\n🆘 TROUBLESHOOTING:');
        console.log('1. Make sure you\'re running from backend/server directory');
        console.log('2. Verify weapon_detection.jpg is in project root (../../weapon_detection.jpg)');
        console.log('3. Check .env file has correct Supabase credentials');
        console.log('4. Ensure internet connection for database access');
    }
}

// Run the fix
fixDetection26(); 