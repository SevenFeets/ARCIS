# 🖼️ ARCIS Image Storage Solution: Replace Base64 with File URLs

## Current Problem
- Base64 images: 28KB+ in database
- Memory intensive, slow loading
- Browser compatibility issues

## Recommended Solution: File Storage + URLs

### 🏗️ **Architecture**
```
IoT Device → Upload JPG → Server Storage → Database stores URL → Frontend loads image
```

### 📁 **Backend Implementation**

#### 1. File Storage Setup
```javascript
// backend/server/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory
const uploadsDir = path.join(__dirname, '../uploads/detection-frames');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const detectionId = req.body.detection_id || 'unknown';
        cb(null, `detection_${detectionId}_${timestamp}.jpg`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files allowed'));
        }
    }
});

module.exports = upload;
```

#### 2. Updated Detection Endpoint
```javascript
// backend/server/routes/detections.js
const upload = require('../middleware/upload');

// POST /api/detections - Accept image file instead of base64
router.post('/', upload.single('detection_frame'), async (req, res) => {
    try {
        const {
            object_type,
            confidence,
            bounding_box,
            threat_level,
            system_metrics,
            timestamp
        } = req.body;

        // File URL instead of base64
        const frame_url = req.file ? `/api/images/${req.file.filename}` : null;

        const detectionData = {
            object_category: 'weapon',
            object_type: object_type,
            confidence: parseFloat(confidence),
            bounding_box: JSON.parse(bounding_box),
            threat_level: threat_level || calculateThreatLevel(object_type, confidence),
            frame_url: frame_url, // Store URL instead of base64
            system_metrics: JSON.parse(system_metrics || '{}'),
            timestamp: timestamp || new Date().toISOString()
        };

        const detection = await supabaseDb.detections.create(detectionData);

        res.status(201).json({
            success: true,
            data: detection,
            frame_url: frame_url,
            message: 'Detection recorded successfully'
        });

    } catch (error) {
        console.error('Detection creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create detection'
        });
    }
});

// GET /api/images/:filename - Serve detection images
router.get('/images/:filename', (req, res) => {
    const filename = req.params.filename;
    const imagePath = path.join(__dirname, '../uploads/detection-frames', filename);
    
    if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
    } else {
        res.status(404).json({ error: 'Image not found' });
    }
});
```

#### 3. Database Schema Update
```sql
-- Update detections table
ALTER TABLE arcis.detections 
DROP COLUMN detection_frame_data,
ADD COLUMN frame_url TEXT;

-- Add index for faster lookups
CREATE INDEX idx_detections_frame_url ON arcis.detections(frame_url);
```

### 📱 **IoT Device Changes**

#### Jetson Nano/Raspberry Pi Code
```python
import requests
import cv2
import json

def send_detection_with_frame(detection_data, frame):
    """Send detection with JPG file instead of base64"""
    
    # Compress frame to JPG
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 70]
    _, img_encoded = cv2.imencode('.jpg', frame, encode_param)
    
    # Prepare multipart form data
    files = {
        'detection_frame': ('detection.jpg', img_encoded.tobytes(), 'image/jpeg')
    }
    
    data = {
        'object_type': detection_data['object_type'],
        'confidence': detection_data['confidence'],
        'bounding_box': json.dumps(detection_data['bounding_box']),
        'threat_level': detection_data['threat_level'],
        'system_metrics': json.dumps(detection_data['system_metrics'])
    }
    
    response = requests.post(
        'http://your-server.com/api/detections',
        files=files,
        data=data,
        headers={'X-API-Key': 'your-api-key'}
    )
    
    return response.json()

# Usage
detection_result = send_detection_with_frame(detection_data, captured_frame)
print(f"Detection saved with image URL: {detection_result.get('frame_url')}")
```

### 🖥️ **Frontend Changes**

#### Updated React Component
```typescript
// frontend/src/components/dashboard/ExpandThreatModal.tsx
const ExpandThreatModal: React.FC<ExpandThreatModalProps> = ({ isOpen, onClose, threat }) => {
    const [imageError, setImageError] = useState(false);
    
    const getImageUrl = (threat: Detection) => {
        if (threat.frame_url) {
            // Direct image URL - much simpler!
            return `http://localhost:5000${threat.frame_url}`;
        }
        return null;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            {/* ... other modal content ... */}
            
            {/* Detection Frame - Much Simpler! */}
            <Box p={4} border="1px solid" borderColor="gray.200" borderRadius="lg">
                <Text fontSize="lg" fontWeight="bold" mb={3}>📸 Detection Frame</Text>
                
                {getImageUrl(threat) && !imageError ? (
                    <Image
                        src={getImageUrl(threat)}
                        alt="Detection Frame"
                        maxW="100%"
                        maxH="400px"
                        objectFit="contain"
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="md"
                        onError={() => setImageError(true)}
                        onLoad={() => console.log('✅ Image loaded successfully!')}
                    />
                ) : (
                    <Box
                        w="100%"
                        h="200px"
                        bg="gray.100"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        border="1px dashed"
                        borderColor="gray.300"
                        borderRadius="md"
                    >
                        <VStack>
                            <Text fontSize="3xl">📷</Text>
                            <Text color="gray.500">
                                {imageError ? 'Failed to load image' : 'No frame available'}
                            </Text>
                        </VStack>
                    </Box>
                )}
            </Box>
        </Modal>
    );
};
```

## 🚀 **Benefits of File Storage**

| Aspect | Base64 | File Storage |
|--------|--------|--------------|
| **Size** | 28KB | 8KB (JPG) |
| **Loading** | Slow parsing | Native browser |
| **Memory** | High RAM usage | Efficient |
| **Caching** | No browser cache | Full HTTP caching |
| **CDN Ready** | No | Yes |
| **Database** | Huge records | Small URLs |

## 📋 **Migration Plan**

1. **Phase 1**: Add file upload endpoint
2. **Phase 2**: Update IoT devices to send files
3. **Phase 3**: Update frontend to use image URLs
4. **Phase 4**: Remove base64 columns from database

Would you like me to implement this file storage solution? It's much more efficient and scalable than base64! 