# 📮 ARCIS Postman Testing Guide (Binary JPEG)

## 🚀 **Quick Start**

### **Import Collection**
1. Open Postman
2. Click **Import**
3. Select `ARCIS_Device_Testing_Collection_Updated.postman_collection.json`
4. Collection will appear as **"ARCIS Device Testing Collection (Binary JPEG)"**

---

## 🤖 **Jetson Nano Testing**

### **Request: "Jetson Nano Detection (Binary JPEG)"**

#### **Step 1: Attach Image File**
1. Go to **Body** tab
2. Find `detection_frame` field (type: file)
3. Click **Select Files**
4. Choose your `weapon_detection.jpg` file

#### **Step 2: Configure Parameters (Pre-filled)**
```
✅ object_type: rifle (or change to "weapon")
✅ confidence: 0.92
✅ threat_level: 8
✅ device_id: jt_bo1
✅ device_name: jetson
✅ device_type: jetson_nano
✅ timestamp: {{$isoTimestamp}} (auto-generated)
```

#### **Step 3: Send Request**
- **URL:** `{{BASE_URL}}/api/detections/upload-jpeg`
- **Method:** POST
- **Headers:** `X-API-Key: test-device-key-2024`

#### **Expected Response:**
```json
{
    "success": true,
    "detection_id": 99,
    "weapon_type": "rifle",
    "threat_level": 8,
    "confidence": 0.92,
    "device_id": "jt_bo1",
    "device_name": "jetson",
    "has_binary_jpeg": true,
    "jpeg_endpoint": "/detections/99/jpeg"
}
```

---

## 🍓 **Raspberry Pi 4 Testing**

### **Request: "Raspberry Pi 4 Detection (Binary JPEG)"**

#### **Step 1: Attach Image File**
1. Same as Jetson - attach your `weapon_detection.jpg`

#### **Step 2: Configure Parameters (Pre-filled)**
```
✅ object_type: Pistol (or change to "Knife")
✅ confidence: 0.89
✅ threat_level: 6
✅ device_id: pi4_c
✅ device_name: pi4
✅ device_type: raspberry_pi
✅ timestamp: {{$isoTimestamp}} (auto-generated)
```

#### **Step 3: Send Request**
- Same endpoint as Jetson: `/api/detections/upload-jpeg`

#### **Expected Response:**
```json
{
    "success": true,
    "detection_id": 100,
    "weapon_type": "Pistol",
    "threat_level": 6,
    "confidence": 0.89,
    "device_id": "pi4_c",
    "device_name": "pi4",
    "has_binary_jpeg": true,
    "jpeg_endpoint": "/detections/100/jpeg"
}
```

---

## 🔍 **Additional Testing**

### **3. Get Active Threats**
- **Request:** "Get Active Threats"
- **Method:** GET
- **URL:** `{{BASE_URL}}/api/detections/threats`
- **Purpose:** See all uploaded detections with proper device identification

### **4. Test Image Access**
- **Request:** "Test Image Access (Detection ID)"
- **Method:** GET
- **URL:** `{{BASE_URL}}/api/detections/{{DETECTION_ID}}/jpeg`
- **Setup:** Update `DETECTION_ID` variable with actual detection ID from upload response
- **Purpose:** Verify binary JPEG image access

---

## ⚙️ **Collection Variables**

### **BASE_URL**
- **Production:** `https://arcis-production.up.railway.app` (default)
- **Local:** `http://localhost:5000` (if testing locally)

### **DETECTION_ID**
- **Default:** `93`
- **Update:** Use actual detection ID from upload responses

---

## 🧪 **Testing Workflow**

### **1. Upload Jetson Detection**
```bash
POST /api/detections/upload-jpeg
✅ Attach weapon_detection.jpg
✅ Use jt_bo1 device ID
✅ Get detection ID in response
```

### **2. Upload Pi4 Detection**
```bash
POST /api/detections/upload-jpeg
✅ Attach weapon_detection.jpg  
✅ Use pi4_c device ID
✅ Get detection ID in response
```

### **3. Verify in Threats API**
```bash
GET /api/detections/threats
✅ Should show device: "jetson (jt_bo1)"
✅ Should show device: "pi4 (pi4_c)"
```

### **4. Test Image Access**
```bash
GET /api/detections/{ID}/jpeg
✅ Should return full JPEG image
✅ Should work for both device uploads
```

---

## 🔧 **Key Differences from Old Collection**

| Feature | Old Collection | New Collection |
|---------|---------------|----------------|
| **Method** | JSON + Base64 | Multipart + Binary JPEG |
| **Endpoint** | `/jetson-detection`, `/raspberry-detection` | `/upload-jpeg` (unified) |
| **Image** | Base64 in JSON | File upload |
| **Device ID** | Hardcoded | Proper identification |
| **Success Rate** | Failed (413 errors) | 100% success |

---

## ✅ **Success Indicators**

### **Upload Success:**
- ✅ Response status: 200 OK
- ✅ `success: true` in response
- ✅ `detection_id` returned
- ✅ `has_binary_jpeg: true`
- ✅ `jpeg_endpoint` provided

### **Dashboard Verification:**
- ✅ Device shows as "jetson (jt_bo1)" or "pi4 (pi4_c)"
- ✅ Detection ID visible under confidence score
- ✅ "View Frame" button works
- ✅ Full-resolution image displays

---

## 🚨 **Troubleshooting**

### **File Upload Issues:**
- Ensure file is selected in `detection_frame` field
- Use JPEG format files only
- File size should be reasonable (< 5MB)

### **API Key Issues:**
- Verify `X-API-Key: test-device-key-2024`
- Check header is properly set

### **Response Issues:**
- Check `BASE_URL` variable points to correct server
- Verify network connectivity to Railway

**This collection is production-ready and uses the proven binary JPEG method!** 🎯 