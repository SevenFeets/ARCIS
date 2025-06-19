# 🧪 ARCIS Frame Storage & System Metrics Testing Guide

## Overview
This guide provides step-by-step instructions to test all the new features we've implemented:
1. Detection Frame Images Storage
2. System Metrics Tracking
3. Expand Threat Modal
4. API Endpoints

## Prerequisites
- ✅ Database running (PostgreSQL)
- ✅ Backend server running (`npm start` in backend/server)
- ✅ Frontend running (`npm run dev` in frontend)
- ✅ Postman installed for API testing

---

## 🗄️ Step 1: Database Verification

### Check New Columns
1. Connect to your PostgreSQL database
2. Run this query to verify the new columns exist:

```sql
-- Check if new columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'arcis' 
AND table_name = 'detections' 
AND column_name IN ('detection_frame_data', 'system_metrics');
```

Expected result:
```
column_name          | data_type | is_nullable
--------------------|-----------|------------
detection_frame_data | text      | YES
system_metrics      | jsonb     | YES
```

### Check Sample Data
```sql
-- Check if we have detections with frame data
SELECT 
    detection_id,
    object_type,
    confidence,
    threat_level,
    CASE 
        WHEN detection_frame_data IS NOT NULL 
        THEN 'Has Frame Data' 
        ELSE 'No Frame Data' 
    END as frame_status,
    CASE 
        WHEN system_metrics IS NOT NULL 
        THEN jsonb_object_keys(system_metrics) 
        ELSE NULL 
    END as metrics_keys
FROM arcis.detections 
ORDER BY detection_id DESC 
LIMIT 5;
```

---

## 🌐 Step 2: API Testing with Postman

### Test Collection Setup
Create a new Postman collection called "ARCIS Frame Storage Tests"

### 2.1 Test Creating Detection with Frame Data

**POST** `http://localhost:5000/api/detections/incoming`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "object_type": "Knife",
  "confidence": 0.89,
  "bounding_box": {
    "x": 100,
    "y": 150,
    "width": 50,
    "height": 75
  },
  "device_id": "test-jetson-001",
  "image_path": "/test/frame.jpg",
  "metadata": {
    "device_type": "jetson_nano",
    "test_data": true
  },
  "frame_data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "system_metrics": {
    "cpu_usage": 45.2,
    "gpu_usage": 67.8,
    "ram_usage": 52.1,
    "cpu_temp": 65.5,
    "gpu_temp": 72.3,
    "cpu_voltage": 1.2,
    "gpu_voltage": 1.1,
    "network_status": "Connected",
    "network_speed": 100,
    "network_signal_strength": -45,
    "disk_usage": 75.3,
    "detection_latency": 125,
    "distance_to_detection": 5.2,
    "database_status": "Connected",
    "alert_played": true
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Detection processed successfully",
  "detection": {
    "detection_id": 44,
    "weapon_type": "Knife",
    "threat_level": 7,
    "confidence": 89
  }
}
```

**Note the `detection_id` from the response for the next tests!**

### 2.2 Test System Metrics Endpoint

**GET** `http://localhost:5000/api/detections/{detection_id}/metrics`

Replace `{detection_id}` with the ID from step 2.1

**Expected Response:**
```json
{
  "success": true,
  "metrics": {
    "detection_id": 44,
    "timestamp": "2024-01-15T10:30:00Z",
    "confidence_score": 89,
    "threat_level": 7,
    "device_type": "jetson_nano",
    "device_id": "test-jetson-001",
    "cpu_usage": 45.2,
    "gpu_usage": 67.8,
    "ram_usage": 52.1,
    "cpu_temp": 65.5,
    "gpu_temp": 72.3,
    "cpu_voltage": 1.2,
    "gpu_voltage": 1.1,
    "network_status": "Connected",
    "network_speed": 100,
    "network_signal_strength": -45,
    "disk_usage": 75.3,
    "detection_latency": 125,
    "distance_to_detection": 5.2,
    "database_status": "Connected",
    "alert_played": true
  },
  "message": "System metrics retrieved for detection 44"
}
```

### 2.3 Test Detection Frame Endpoint

**GET** `http://localhost:5000/api/detections/{detection_id}/frame`

**Expected Response:**
```json
{
  "success": true,
  "detection_id": 44,
  "frame_data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "timestamp": "2024-01-15T10:30:00Z",
  "message": "Frame data retrieved for detection 44"
}
```

### 2.4 Test Jetson Detection Endpoint

**POST** `http://localhost:5000/api/detections/jetson-detection`

**Body (JSON):**
```json
{
  "detectedObjects": [
    {
      "class": 0,
      "label": "knife",
      "confidence": 0.85,
      "bbox": [120, 180, 60, 90]
    }
  ],
  "frame": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "systemMetrics": {
    "cpu_usage": 52.1,
    "gpu_usage": 78.3,
    "ram_usage": 63.2,
    "cpu_temp": 68.2,
    "gpu_temp": 75.8,
    "network_status": "Connected",
    "detection_latency": 135,
    "alert_played": false
  },
  "timestamp": "2024-01-15T11:00:00Z",
  "deviceId": "jetson-nano-001"
}
```

### 2.5 Test Raspberry Pi Detection Endpoint

**POST** `http://localhost:5000/api/detections/raspberry-detection`

**Body (JSON):**
```json
{
  "cloudVisionResults": [
    {
      "description": "weapon",
      "score": 0.92,
      "boundingPoly": {
        "vertices": [
          {"x": 100, "y": 120},
          {"x": 200, "y": 120},
          {"x": 200, "y": 220},
          {"x": 100, "y": 220}
        ]
      }
    }
  ],
  "frame": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "systemMetrics": {
    "cpu_usage": 38.5,
    "ram_usage": 45.7,
    "cpu_temp": 55.3,
    "network_status": "Connected",
    "network_speed": 50,
    "detection_latency": 95,
    "alert_played": true
  },
  "timestamp": "2024-01-15T11:15:00Z",
  "deviceId": "rpi-cloud-002"
}
```

### 2.6 Test Error Handling - Non-existent Detection

**GET** `http://localhost:5000/api/detections/99999/frame`

**Expected Response:**
```json
{
  "success": false,
  "error": "Detection not found",
  "code": "DETECTION_NOT_FOUND"
}
```

---

## 🎨 Step 3: Frontend Testing

### 3.1 Dashboard Navigation
1. Open `http://localhost:5173` (or your frontend port)
2. Login with your credentials
3. Navigate to `/dashboard`
4. Verify you see the dashboard with threats displayed

### 3.2 Test System Metrics Modal
1. Look for threats with "📊 System Metrics" buttons
2. Click the "📊 System Metrics" button on any threat
3. Verify the SystemMetricsModal opens with:
   - Detection information (confidence, threat level, device info)
   - System performance metrics with progress bars
   - Temperature and voltage readings
   - Network and detection metrics
   - Database status

**Expected Behavior:**
- Modal opens smoothly
- All metrics display with proper formatting
- Progress bars show appropriate colors (green < 40%, yellow 40-60%, orange 60-80%, red > 80%)
- Refresh button works
- Close button works

### 3.3 Test Expand Threat Modal
1. Click the "🔍 Expand Threat" button on any threat
2. Verify the ExpandThreatModal opens with:
   - Full-screen modal (95% viewport)
   - Left column: Threat details, location, device info, comments
   - Right column: Detection frame image or placeholder
   - Action buttons at bottom

**Expected Behavior:**
- Modal opens in full-screen mode
- Threat information displays correctly
- Detection frame loads (if available) or shows appropriate fallback
- "🔄 Refresh Frame Data" button works
- "✅ Acknowledge Threat" button shows toast notification
- Modal closes properly

### 3.4 Test Responsive Design
1. Resize browser window to mobile size
2. Test both modals on smaller screens
3. Verify layouts adapt appropriately

---

## 🔄 Step 4: End-to-End Testing

### 4.1 Create Detection via API → View in Frontend
1. Use Postman to create a detection with frame data (Step 2.1)
2. Refresh the dashboard in frontend
3. Find the new detection in the threats list
4. Test both "System Metrics" and "Expand Threat" buttons
5. Verify all data displays correctly

### 4.2 Test Manual Detection Entry
1. In the dashboard, look for the manual entry form
2. Create a manual detection without frame data
3. Verify it appears in the list
4. Test that clicking "System Metrics" shows "N/A" values appropriately
5. Test that clicking "Expand Threat" shows "No frame data available"

---

## 🐛 Step 5: Error Scenarios Testing

### 5.1 Network Errors
1. Stop the backend server
2. Try to open System Metrics modal
3. Verify error handling displays appropriate messages

### 5.2 Invalid Detection IDs
1. Manually edit the URL to access `/api/detections/99999/metrics`
2. Verify 404 error handling

### 5.3 Missing Frame Data
1. Create a detection without frame_data
2. Try to access the frame endpoint
3. Verify appropriate "No frame data available" message

---

## ✅ Expected Results Summary

### Database
- ✅ New columns `detection_frame_data` and `system_metrics` exist
- ✅ Sample data can be inserted and retrieved
- ✅ JSONB system_metrics stores complex objects

### API Endpoints
- ✅ `/api/detections/incoming` accepts frame_data and system_metrics
- ✅ `/api/detections/jetson-detection` works with new fields
- ✅ `/api/detections/raspberry-detection` works with new fields
- ✅ `/api/detections/:id/metrics` returns formatted system metrics
- ✅ `/api/detections/:id/frame` returns Base64 image data
- ✅ Error handling works for non-existent detections

### Frontend
- ✅ SystemMetricsModal displays all metrics with proper formatting
- ✅ ExpandThreatModal shows full threat details and frame image
- ✅ Both modals are responsive and handle errors gracefully
- ✅ Action buttons work and provide user feedback
- ✅ Modals integrate seamlessly with existing dashboard

### Performance
- ✅ Base64 images load quickly
- ✅ Modals open/close smoothly
- ✅ API calls complete within reasonable time
- ✅ No memory leaks or performance issues

---

## 🔧 Troubleshooting

### Common Issues

1. **"Cannot connect to database"**
   - Ensure PostgreSQL is running
   - Check connection settings in backend/.env

2. **"Frame data not loading"**
   - Verify Base64 string is valid
   - Check network tab in browser for API errors

3. **"System metrics show N/A"**
   - This is expected for detections created before the new system
   - Create new detections to test metrics functionality

4. **"Modal not opening"**
   - Check console for JavaScript errors
   - Verify React component imports are correct

5. **"API returns 500 error"**
   - Check backend server logs
   - Verify database schema is updated correctly

---

## 📋 Testing Checklist

Copy this checklist and check off items as you test:

### Database Testing
- [ ] New columns exist in detections table
- [ ] Sample data inserts successfully
- [ ] Data retrieval works correctly

### API Testing
- [ ] Create detection with frame data (POST /incoming)
- [ ] Get system metrics (GET /:id/metrics) 
- [ ] Get detection frame (GET /:id/frame)
- [ ] Test Jetson endpoint (POST /jetson-detection)
- [ ] Test Raspberry Pi endpoint (POST /raspberry-detection)
- [ ] Error handling for invalid IDs

### Frontend Testing
- [ ] Dashboard loads successfully
- [ ] System Metrics button appears on threats
- [ ] System Metrics modal opens and displays data
- [ ] Expand Threat button appears on threats
- [ ] Expand Threat modal opens in full-screen
- [ ] Frame images display correctly
- [ ] Error states handled gracefully
- [ ] Mobile responsiveness works

### Integration Testing
- [ ] API → Frontend data flow works
- [ ] Manual entries work without frame data
- [ ] Real-time updates function correctly
- [ ] Performance is acceptable

**Testing Complete! 🎉**

If all items are checked, your ARCIS Frame Storage and System Metrics implementation is working correctly! 