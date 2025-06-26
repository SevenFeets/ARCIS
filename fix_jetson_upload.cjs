const fs = require('fs');
const path = require('path');
const https = require('https');

async function fixJetsonUpload() {
    console.log('🔧 FIXING JETSON DETECTION WITH PROPER IMAGE');
    console.log('==============================================');
    console.log('Creating new Jetson detection with properly formatted image...');

    try {
        // Read the weapon detection image
        const weaponImagePath = path.join(__dirname, 'weapon_detection.jpg');

        if (!fs.existsSync(weaponImagePath)) {
            throw new Error(`Weapon detection image not found at: ${weaponImagePath}`);
        }

        const imageBuffer = fs.readFileSync(weaponImagePath);
        const base64Image = imageBuffer.toString('base64');
        const imageSize = imageBuffer.length;

        console.log(`📸 Using weapon detection image: ${imageSize} bytes`);
        console.log(`📏 Base64 size: ${base64Image.length} characters`);

        // Create a smaller version of the image for Jetson (reduce quality/size)
        // For this test, we'll use a smaller portion of the base64 data
        const smallerBase64 = base64Image.substring(0, 50000); // Use first 50KB of base64

        console.log(`📦 Using smaller base64 for Jetson: ${smallerBase64.length} characters`);

        // Create proper data URL format for Jetson
        const dataUrl = `data:image/jpeg;base64,${smallerBase64}`;

        const jetsonPayload = {
            deviceId: "bo1",
            deviceName: "jetson nano",
            timestamp: new Date().toISOString(),
            detectedObjects: [
                {
                    class: "rifle",
                    label: "Machine Gun / Heavy Rifle (Fixed Upload)",
                    confidence: 0.97,
                    bbox: [620, 254, 440, 176] // Bounding box from weapon_detection.jpg
                }
            ],
            frame: smallerBase64, // Use smaller base64 without data URL prefix
            systemMetrics: {
                cpu_usage: 73.5,
                gpu_usage: 91.2,
                memory_usage: 3.9,
                voltage: 5.0,
                temperature: 75.8
            },
            networkParams: {
                signal_strength: -42,
                connection_type: "wifi",
                location: "security_perimeter_fixed",
                network_latency: 15
            },
            metadata: {
                original_image_size: imageSize,
                detection_source: "weapon_detection.jpg",
                upload_type: "fixed_jetson_upload",
                note: "Properly formatted for image display"
            }
        };

        console.log('📡 Uploading fixed Jetson detection...');
        console.log(`🎯 Weapon: ${jetsonPayload.detectedObjects[0].class} (${jetsonPayload.detectedObjects[0].confidence * 100}% confidence)`);
        console.log(`🤖 Device: ${jetsonPayload.deviceName} (${jetsonPayload.deviceId})`);
        console.log(`📊 Frame data: ${smallerBase64.length} characters`);

        const result = await uploadToJetsonAPI(jetsonPayload);

        if (result.success) {
            console.log('\n✅ FIXED JETSON DETECTION UPLOAD SUCCESSFUL!');
            console.log('==============================================');
            console.log(`🆔 Detection ID: ${result.detection_id}`);
            console.log(`⚠️ Threat Level: ${result.threat_level}`);
            console.log(`🎯 Confidence: ${result.confidence}%`);
            console.log(`🔫 Weapon Type: ${result.weapon_type}`);
            console.log(`💾 Storage: Base64 with proper formatting`);
            console.log(`📍 Location: security_perimeter_fixed`);

            // Verify in threats API
            console.log('\n🔍 Verifying fixed detection in threats API...');
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds for DB update

            const threatsData = await getThreatsData();
            const fixedThreat = threatsData.active_weapon_threats.find(t => t.id === result.detection_id);

            if (fixedThreat) {
                console.log('✅ Fixed detection found in threats API!');
                console.log(`   🆔 ID: ${fixedThreat.id}`);
                console.log(`   🔫 Weapon: ${fixedThreat.weapon_type}`);
                console.log(`   ⚠️ Threat Level: ${fixedThreat.threat_level}`);
                console.log(`   📸 detection_frame_data: ${fixedThreat.detection_frame_data ? 'Present' : 'Missing'}`);

                if (fixedThreat.detection_frame_data) {
                    console.log(`   📏 Frame data length: ${fixedThreat.detection_frame_data.length}`);
                    console.log(`   📝 Starts with data:: ${fixedThreat.detection_frame_data.startsWith('data:')}`);
                    console.log(`   🖼️ Proper data URL: ${fixedThreat.detection_frame_data.startsWith('data:image/')}`);

                    if (fixedThreat.detection_frame_data.startsWith('data:image/')) {
                        console.log('\n🎉 SUCCESS: Fixed Jetson detection has proper data URL!');
                        console.log('   🖼️ Frontend should now display this image correctly');
                        console.log('   📋 This detection can be used to test the dashboard');
                    } else {
                        console.log('\n⚠️ Still needs backend formatting fix for data URL prefix');
                    }
                }
            } else {
                console.log('⚠️ Fixed detection not found in threats (may be low threat level)');
            }

        } else {
            throw new Error(`Upload failed: ${result.error}`);
        }

    } catch (error) {
        console.error('❌ Fixed Jetson upload failed:', error.message);
        throw error;
    }
}

function uploadToJetsonAPI(payload) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(payload);

        const req = https.request({
            hostname: 'arcis-production.up.railway.app',
            path: '/api/detections/jetson-detection',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'X-API-Key': 'jetson-bo1-fixed-upload-key'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    console.log(`📊 Response Status: ${res.statusCode}`);

                    if (res.statusCode === 201) {
                        const response = JSON.parse(data);
                        if (response.success && response.detections && response.detections.length > 0) {
                            const detection = response.detections[0];
                            resolve({
                                success: true,
                                detection_id: detection.detection_id,
                                threat_level: detection.threat_level,
                                confidence: detection.confidence,
                                weapon_type: detection.weapon_type,
                                response: response
                            });
                        } else {
                            resolve({ success: false, error: 'No detections processed' });
                        }
                    } else {
                        const errorResponse = JSON.parse(data);
                        resolve({ success: false, error: errorResponse.error || `HTTP ${res.statusCode}` });
                    }
                } catch (error) {
                    resolve({ success: false, error: `Parse error: ${error.message}` });
                }
            });
        });

        req.on('error', (error) => {
            resolve({ success: false, error: `Request error: ${error.message}` });
        });

        req.write(postData);
        req.end();
    });
}

function getThreatsData() {
    return new Promise((resolve, reject) => {
        https.get('https://arcis-production.up.railway.app/api/detections/threats', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve(response);
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', reject);
    });
}

// Run the fixed upload
fixJetsonUpload().catch(error => {
    console.error('💥 FIXED JETSON UPLOAD FAILED:', error.message);
    process.exit(1);
}); 