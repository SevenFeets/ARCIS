# 🧪 ARCIS Postman Testing Guide

## Overview
This guide explains how to test the Jetson Nano and Raspberry Pi detection endpoints using Postman with the provided weapon detection image.

## 📁 Generated Files
- `jetson_postman_request.json` - Jetson Nano endpoint test request
- `raspberry_pi_postman_request.json` - Raspberry Pi endpoint test request
- `weapon_detection_base64.txt` - Base64 encoded weapon image data

## 🚀 Setup Instructions

### Step 1: Import Requests into Postman
1. Open Postman
2. Click **Import** → **Upload Files**
3. Select both JSON files:
   - `jetson_postman_request.json`
   - `raspberry_pi_postman_request.json`

### Step 2: Set Environment Variables
1. In Postman, go to **Environments** → **Create Environment**
2. Name it "ARCIS Testing"
3. Add a variable:
   - **Variable**: `WEAPON_DETECTION_BASE64`
   - **Initial Value**: Copy the entire content from `weapon_detection_base64.txt`
   - **Current Value**: Same as initial value

### Step 3: Alternative - Direct Base64 Replacement
If you prefer not to use environment variables:
1. Open the request body in Postman
2. Replace `{{WEAPON_DETECTION_BASE64}}` with the actual base64 string from `weapon_detection_base64.txt`

## 📝 Request Details

### 1. Jetson Nano Detection Request
- **URL**: `http://localhost:5000/api/detections/jetson-detection`
- **Method**: POST
- **Headers**:
  - `Content-Type: application/json`
  - `X-API-Key: test-jetson-api-key`

**Payload Structure**:
```json
{
  "detectedObjects": [
    {
      "class": 0,
      "label": "weapon",
      "confidence": 0.92,
      "bbox": [150, 200, 80, 120]  // [x, y, width, height]
    }
  ],
  "frame": "{{WEAPON_DETECTION_BASE64}}",
  "systemMetrics": {
    "cpu_usage": 65.2,
    "gpu_usage": 78.5,
    "ram_usage": 58.7,
    "disk_usage": 42.3,
    "cpu_temp": 72.1,
    "gpu_temp": 68.9,
    "cpu_voltage": 1.25,
    "gpu_voltage": 1.15,
    "network_status": "Connected",
    "network_speed": 100,
    "network_signal_strength": -45,
    "detection_latency": 125,
    "distance_to_detection": 3.2,
    "alert_played": true,
    "database_status": "Connected"
  },
  "timestamp": "2024-12-08T10:30:45Z",
  "deviceId": "jetson-nano-test-001"
}
```

### 2. Raspberry Pi Detection Request
- **URL**: `http://localhost:5000/api/detections/raspberry-detection`
- **Method**: POST
- **Headers**:
  - `Content-Type: application/json`
  - `X-API-Key: test-raspberry-api-key`

**Payload Structure**:
```json
{
  "cloudVisionResults": [
    {
      "description": "weapon detected",
      "score": 0.89,
      "boundingPoly": {
        "vertices": [
          {"x": 150, "y": 200},
          {"x": 230, "y": 200},
          {"x": 230, "y": 320},
          {"x": 150, "y": 320}
        ]
      }
    }
  ],
  "frame": "{{WEAPON_DETECTION_BASE64}}",
  "systemMetrics": {
    "cpu_usage": 42.8,
    "gpu_usage": 0,
    "ram_usage": 35.6,
    "disk_usage": 68.2,
    "cpu_temp": 58.3,
    "gpu_temp": 0,
    "cpu_voltage": 1.2,
    "gpu_voltage": 0,
    "network_status": "Connected",
    "network_speed": 50,
    "network_signal_strength": -52,
    "detection_latency": 180,
    "distance_to_detection": 4.1,
    "alert_played": false,
    "database_status": "Connected"
  },
  "timestamp": "2024-12-08T10:30:45Z",
  "deviceId": "raspberry-pi-test-002"
}
```

## 🔧 Testing Steps

### Before Testing:
1. **Start the backend server**:
   ```bash
   cd backend/server
   npm start
   ```
2. **Verify server is running** at `http://localhost:5000`

### Test Execution:
1. Select the environment "ARCIS Testing" in Postman
2. Send the **Jetson Nano** request first
3. Send the **Raspberry Pi** request second
4. Check responses for success status (201)

### Expected Responses:
**Success Response (201)**:
```json
{
  "success": true,
  "message": "Jetson detection data processed successfully",
  "processed_detections": 1,
  "detections": [
    {
      "detection_id": 123,
      "weapon_type": "weapon",
      "threat_level": "HIGH",
      "confidence": 92
    }
  ],
  "device_id": "jetson-nano-test-001"
}
```

## 🎯 Verification Steps

### 1. Database Verification
Check if detections were created:
```sql
SELECT detection_id, object_type, confidence, threat_level, metadata->>'device_type'
FROM detections 
ORDER BY created_at DESC 
LIMIT 5;
```

### 2. Frontend Verification
1. Open the ARCIS dashboard: `http://localhost:3000`
2. Go to the **Threats** section
3. Look for new detections with your test device IDs
4. Click on detection to open threat modal
5. **Verify the weapon image displays properly** (this is the main test!)

### 3. System Metrics Verification
1. In the threat modal, click **System Metrics**
2. Verify all the metrics from your payload are displayed:
   - CPU/GPU usage and temperatures
   - Network status and signal strength
   - Detection latency and distance
   - Alert status

## 🐛 Troubleshooting

### Common Issues:
1. **401 Unauthorized**: Remove or modify the `X-API-Key` header
2. **404 Not Found**: Check if backend server is running on port 5000
3. **Base64 Error**: Ensure the base64 string is complete and properly formatted
4. **Image Not Displaying**: Check that `detection_frame_data` is properly stored in database

### Debug Commands:
```bash
# Check if detection was created
psql -d your_database -c "SELECT * FROM detections ORDER BY created_at DESC LIMIT 1;"

# Check image data length
psql -d your_database -c "SELECT detection_id, LENGTH(detection_frame_data) FROM detections WHERE detection_frame_data IS NOT NULL ORDER BY created_at DESC LIMIT 5;"
```

## 📊 Expected Results
After successful testing:
- ✅ Two new detections in database
- ✅ Images display properly in threat modals
- ✅ System metrics show in dashboard
- ✅ Device information correctly categorized (Jetson vs Pi)
- ✅ No frame_url conflicts (thanks to our database trigger)

## 🎉 Success Criteria
Your test is successful if:
1. Both requests return HTTP 201 status
2. New detections appear in the frontend dashboard
3. **Weapon images display properly in threat modals** (main goal!)
4. System metrics are populated and visible
5. No database errors or conflicts occur 