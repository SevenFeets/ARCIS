# 📸 Raspberry Pi JPG Upload Update

## Overview
Updated the `/raspberry-detection` endpoint to receive JPG files via multipart/form-data instead of base64 in JSON, matching the updated Postman collection.

## Changes Made

### 1. Updated `/raspberry-detection` Endpoint

**Before (Base64 in JSON):**
```javascript
router.post('/raspberry-detection', async (req, res) => {
    const { cloudVisionResults, frame, systemMetrics, timestamp, deviceId } = req.body;
    // frame was base64 string in JSON
```

**After (JPG File Upload):**
```javascript
router.post('/raspberry-detection', validateApiKey, uploadSingle, async (req, res) => {
    const { cloudVisionResults, systemMetrics, timestamp, deviceId } = req.body;
    // req.file contains the uploaded JPG file
```

### 2. Key Improvements

#### **Binary JPEG Storage (Best Performance)**
- Stores JPG files directly as binary data in `detection_frame_jpeg` column
- Eliminates base64 encoding/decoding overhead
- Provides direct binary JPEG serving via `/api/detections/:id/jpeg`

#### **Multipart Form Data Support**
- Added `uploadSingle` middleware for file uploads
- Handles form fields for detection metadata
- Validates JPEG file types
- Automatic file cleanup after database storage

#### **Frontend Integration Flags**
- Sets `has_binary_jpeg: true` for frontend detection
- Provides `jpeg_endpoint` URL for direct image access
- Maintains backward compatibility with legacy formats

### 3. Updated Response Format

**New Response Includes:**
```json
{
  "success": true,
  "message": "Raspberry Pi detection data with JPG file processed successfully",
  "processed_detections": 1,
  "detections": [
    {
      "detection_id": 123,
      "weapon_type": "weapon",
      "threat_level": 7,
      "confidence": 85,
      "has_binary_jpeg": true,
      "jpeg_endpoint": "/api/detections/123/jpeg",
      "storage_method": "binary_jpeg_database"
    }
  ],
  "device_id": "PI-001",
  "file_processed": true,
  "jpeg_size": 45123,
  "storage_method": "binary_jpeg_database"
}
```

### 4. Frontend Compatibility

The frontend `ExpandThreatModal` already supports this with its priority system:

1. **Priority 1:** Binary JPEG endpoint (NEW - what we added)
2. **Priority 2:** File URL (legacy file storage)
3. **Priority 3:** Base64 data (legacy format)
4. **Priority 4:** API fallback

### 5. Updated Endpoints

#### **Modified:**
- `POST /api/detections/raspberry-detection` - Now accepts multipart JPG uploads
- `GET /api/detections/all` - Now includes binary JPEG flags
- `GET /api/detections/threats` - Already had binary JPEG flags

#### **Existing (Unchanged):**
- `POST /api/detections/jetson-detection` - Still uses base64 in JSON
- `POST /api/detections/upload` - File storage method
- `POST /api/detections/upload-jpeg` - Binary JPEG method
- `GET /api/detections/:id/jpeg` - Binary JPEG serving

## Testing

### Postman Collection
The updated collection should now work with:
- **Jetson Nano:** Sends base64 in JSON → uses `detection_frame_data`
- **Raspberry Pi:** Sends JPG file → uses `detection_frame_jpeg` (binary)

### Test Script
Run the test script to verify functionality:
```bash
cd backend/server
node test_raspberry_pi_upload.cjs
```

## Benefits

1. **Performance:** Binary JPEG storage is faster than base64
2. **Efficiency:** No encoding/decoding overhead
3. **Compatibility:** Frontend automatically uses best available format
4. **Future-Proof:** Supports multiple image storage methods
5. **Device-Specific:** Each device can use its optimal format

## Architecture

```
Jetson Nano → JSON + base64 → detection_frame_data (legacy)
Raspberry Pi → Multipart + JPG → detection_frame_jpeg (binary)
Manual Upload → Multipart + JPG → detection_frame_jpeg (binary)
File Upload → Multipart + JPG → frame_url (file system)
```

## Database Schema Support

The database already supports all storage methods with conflict prevention:
- `detection_frame_data` (base64)
- `frame_url` (file path)  
- `detection_frame_jpeg` (binary)
- Automatic conflict resolution via triggers

## Next Steps

1. ✅ Backend updated for Raspberry Pi JPG uploads
2. ✅ Frontend ready for all image formats
3. 🎯 Test with actual Raspberry Pi device
4. 🎯 Update device code if needed
5. 🎯 Monitor performance improvements

**The system now efficiently handles JPG files from Raspberry Pi devices while maintaining full backward compatibility!** 