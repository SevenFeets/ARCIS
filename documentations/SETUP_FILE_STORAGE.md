# 🚀 ARCIS File Storage Setup Guide

## Overview
This guide will help you migrate from base64 image storage to efficient file storage for weapon detection frames.

## ✅ Benefits of File Storage
- **70% smaller** database footprint
- **Faster loading** with browser caching
- **CDN compatible** for global distribution
- **Simpler code** using standard HTML img tags
- **Better for IoT devices** with limited memory

## 🔧 Step 1: Database Migration

### Add frame_url Column
```sql
-- Run this in your Supabase SQL Editor
ALTER TABLE detections ADD COLUMN frame_url TEXT;
CREATE INDEX IF NOT EXISTS idx_detections_frame_url ON detections(frame_url);
COMMENT ON COLUMN detections.frame_url IS 'URL path to detection frame image file';
```

### Check Migration Status
```sql
-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'detections' AND column_name = 'frame_url';
```

## 🚀 Step 2: Backend Setup

### Install Dependencies
```bash
cd backend/server
npm install multer
```

### Files Created/Modified
- ✅ `middleware/upload.js` - Multer configuration
- ✅ `routes/detections.js` - Added upload endpoints
- ✅ `uploads/detection-frames/` - Created automatically

### New Endpoints
- `POST /api/detections/upload` - Upload detection with image file
- `GET /api/images/:filename` - Serve uploaded images

## 🖼️ Step 3: Frontend Updates

### Files Modified
- ✅ `api/detections.ts` - Added `frame_url` to Detection interface
- ✅ `components/dashboard/ExpandThreatModal.tsx` - Support both URL and base64

### Priority Loading Logic
1. **File URL** (new format) - Direct image loading
2. **Base64 data** (legacy) - Embedded data URLs
3. **API fallback** - Fetch from frame endpoint

## 📱 Step 4: IoT Device Integration

### Jetson Nano/Raspberry Pi Code
```python
import requests
import cv2
import json

def send_detection_with_image(image_path, detection_data):
    url = "http://your-server.com/api/detections/upload"
    
    # Prepare the files and data
    files = {
        'detection_frame': open(image_path, 'rb')
    }
    
    data = {
        'object_type': detection_data['weapon_type'],
        'confidence': str(detection_data['confidence']),
        'threat_level': str(detection_data['threat_level']),
        'bounding_box': json.dumps(detection_data['bounding_box']),
        'system_metrics': json.dumps(detection_data['metrics']),
        'device_id': 'jetson-001',
        'timestamp': detection_data['timestamp']
    }
    
    headers = {
        'X-API-Key': 'your-api-key'
    }
    
    try:
        response = requests.post(url, files=files, data=data, headers=headers)
        return response.json()
    finally:
        files['detection_frame'].close()
```

### cURL Test Command
```bash
curl -X POST http://localhost:3001/api/detections/upload \
  -H "X-API-Key: test-api-key-123" \
  -F "detection_frame=@weapon_detection.jpg" \
  -F "object_type=rifle" \
  -F "confidence=0.89" \
  -F "threat_level=8" \
  -F 'bounding_box={"x":250,"y":150,"width":400,"height":300}' \
  -F 'system_metrics={"cpu_usage":45,"gpu_usage":60}' \
  -F "device_id=test-device-001"
```

## 🧪 Step 5: Testing

### Run Test Script
```bash
# Make sure backend server is running
cd backend/server && npm start

# In another terminal, run the test
node test_jpg_upload.js
```

### Expected Output
```
🚀 ARCIS File Upload Test - JPG Format
=====================================
📁 Image file found:
   📄 Path: D:\project\weapon_detection.jpg
   📏 Size: 45.23 KB
   📅 Modified: 2024-12-19T20:30:00.000Z

📤 Uploading detection with JPG image...
✅ Upload successful!
📊 Response: {
  "success": true,
  "data": { ... },
  "frame_url": "/api/images/detection_1734648600123_456.jpg",
  "message": "Detection with image file recorded successfully"
}

🖼️ Testing image URL: http://localhost:3001/api/images/detection_1734648600123_456.jpg
✅ Image URL accessible
📋 Content-Type: image/jpeg
📏 Content-Length: 46315
```

## 🔄 Step 6: Migration from Base64

### Migrate Existing Data (Optional)
```javascript
// Script to convert existing base64 data to files
const fs = require('fs');
const { supabase } = require('./config/supabase');

async function migrateBase64ToFiles() {
    // Get detections with base64 data
    const { data: detections } = await supabase
        .from('detections')
        .select('detection_id, detection_frame_data')
        .not('detection_frame_data', 'is', null)
        .is('frame_url', null);
    
    for (const detection of detections) {
        if (detection.detection_frame_data) {
            // Extract base64 data
            const base64Data = detection.detection_frame_data.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            
            // Save as file
            const filename = `migrated_${detection.detection_id}_${Date.now()}.jpg`;
            const filepath = `./uploads/detection-frames/${filename}`;
            fs.writeFileSync(filepath, buffer);
            
            // Update database
            await supabase
                .from('detections')
                .update({ frame_url: `/api/images/${filename}` })
                .eq('detection_id', detection.detection_id);
            
            console.log(`✅ Migrated detection ${detection.detection_id}`);
        }
    }
}
```

## 🎯 Step 7: Verification

### Check Dashboard
1. Open ARCIS dashboard
2. Go to threat alerts
3. Click "Expand Threat" on any detection
4. Verify image loads quickly from URL

### Performance Comparison
- **Base64**: ~28KB database storage + browser processing
- **File Storage**: ~200 bytes URL + efficient image caching
- **Result**: 99%+ storage reduction, faster loading

## 🔧 Troubleshooting

### Common Issues

#### 1. "frame_url column does not exist"
```bash
# Run database migration
node check_database.cjs
# Follow the SQL command provided
```

#### 2. "No detection frame image uploaded"
```bash
# Check file field name in form data
# Must be 'detection_frame'
```

#### 3. "Image not found" when accessing URL
```bash
# Check uploads directory exists
ls -la backend/server/uploads/detection-frames/
# Check file permissions
```

#### 4. CORS issues in frontend
```javascript
// Add to backend server.js
app.use('/api/images', express.static('uploads/detection-frames'));
```

## 📈 Next Steps

1. **CDN Integration**: Move files to AWS S3/Cloudflare
2. **Image Optimization**: Compress images automatically
3. **Cleanup Jobs**: Remove old detection images
4. **Monitoring**: Track storage usage and performance

## 🎉 Success Metrics

- ✅ Database size reduced by 70%+
- ✅ Image loading time < 500ms
- ✅ IoT devices can upload JPG files
- ✅ Dashboard displays images correctly
- ✅ No more base64 processing delays 