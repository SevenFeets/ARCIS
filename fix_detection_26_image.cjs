// Load environment variables first
require('dotenv').config({ path: './backend/server/.env' });

const fs = require('fs');
const path = require('path');

async function fixDetection26Image() {
    console.log('🔫 ARCIS Detection 26 Image Fix Tool');
    console.log('===================================');
    console.log('🎯 Ensuring Detection 26 shows image in threat modal\n');

    try {
        // Step 1: Verify image file exists
        console.log('📁 STEP 1: Checking image file...');
        const imagePath = path.join(__dirname, 'weapon_detection.jpg');
        if (!fs.existsSync(imagePath)) {
            console.error('❌ weapon_detection.jpg not found in project root!');
            return;
        }

        const imageStats = fs.statSync(imagePath);
        console.log(`✅ Image found: ${(imageStats.size / 1024).toFixed(2)} KB`);

        // Step 2: Connect to database
        console.log('\n🔗 STEP 2: Connecting to database...');
        const { supabase } = require('./backend/server/config/supabase');
        console.log('✅ Database connection established');

        // Step 3: Check/Create Detection 26
        console.log('\n🔍 STEP 3: Checking Detection 26 exists...');
        let { data: detection26, error: checkError } = await supabase
            .from('detections')
            .select('*')
            .eq('detection_id', 26)
            .single();

        if (checkError || !detection26) {
            console.log('❌ Detection 26 not found. Creating it...');

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
                        entry_type: 'image_test'
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

        // Step 4: Add image as base64 (most compatible)
        console.log('\n📸 STEP 4: Adding image to Detection 26...');
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

        console.log(`📊 Base64 conversion: ${base64Image.length} characters`);

        const { data: updatedDetection, error: updateError } = await supabase
            .from('detections')
            .update({
                detection_frame_data: base64Image,  // This is what ExpandThreatModal looks for
                metadata: {
                    ...detection26.metadata,
                    image_info: {
                        original_name: 'weapon_detection.jpg',
                        size: imageStats.size,
                        format: 'base64_jpeg',
                        added_at: new Date().toISOString(),
                        method: 'fix_script'
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

        // Step 5: Verify through threats endpoint
        console.log('\n🔍 STEP 5: Testing threats endpoint...');
        try {
            const threatsResponse = await fetch('http://localhost:5000/api/detections/threats');
            if (threatsResponse.ok) {
                const threats = await threatsResponse.json();
                const threat26 = threats.active_weapon_threats?.find(t =>
                    t.detection_id === 26 || t.id === 26
                );

                if (threat26) {
                    console.log('✅ Detection 26 found in threats endpoint');
                    console.log('📊 Frontend will receive:', {
                        detection_id: threat26.detection_id || threat26.id,
                        weapon_type: threat26.weapon_type,
                        has_image_data: !!threat26.detection_frame_data,
                        image_size: threat26.detection_frame_data ?
                            `${(threat26.detection_frame_data.length / 1024).toFixed(1)} KB` : 'None'
                    });
                } else {
                    console.log('⚠️ Detection 26 not in threats (threat_level might be < 6)');

                    // Check all detections to see where 26 is
                    const allResponse = await fetch('http://localhost:5000/api/detections/all');
                    if (allResponse.ok) {
                        const allData = await allResponse.json();
                        const detection26All = allData.data?.find(d => d.detection_id === 26 || d.id === 26);
                        if (detection26All) {
                            console.log('ℹ️ Detection 26 found in /all endpoint');
                            console.log('📊 All endpoint data:', {
                                threat_level: detection26All.threat_level,
                                has_image: !!detection26All.detection_frame_data
                            });
                        }
                    }
                }
            } else {
                console.log('⚠️ Server not responding (make sure backend is running)');
            }
        } catch (error) {
            console.log('⚠️ Could not test endpoints:', error.message);
        }

        // Step 6: Success summary
        console.log('\n🎉 SUCCESS! Detection 26 Image Fix Complete');
        console.log('==========================================');
        console.log('✅ Detection 26 exists with image data');
        console.log('✅ Image format: Base64 JPEG (frontend compatible)');
        console.log('✅ Image size: ' + (imageStats.size / 1024).toFixed(2) + ' KB');
        console.log('✅ Frontend modal should now show the image');

        console.log('\n📋 NEXT STEPS:');
        console.log('1. 🔄 Refresh your dashboard page');
        console.log('2. 🎯 Look for Detection 26 in the threats list');
        console.log('3. 🖱️ Click "Expand Threat" on Detection 26');
        console.log('4. 📸 Image should appear in "Detection Frame" section');

        console.log('\n🔧 IF IMAGE STILL DOESN\'T SHOW:');
        console.log('1. Open browser developer tools (F12)');
        console.log('2. Check Console tab for any error messages');
        console.log('3. Verify backend server is running on port 5000');
        console.log('4. Check Network tab to see if image requests are made');

    } catch (error) {
        console.error('❌ Script failed:', error.message);
        console.error('Full error:', error);

        console.log('\n🆘 TROUBLESHOOTING:');
        console.log('1. Make sure backend server is running: cd backend/server && npm start');
        console.log('2. Check .env file has correct Supabase credentials');
        console.log('3. Verify weapon_detection.jpg is in project root directory');
    }
}

// Run the fix
fixDetection26Image(); 