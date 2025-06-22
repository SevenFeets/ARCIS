# 📸 Image Format Optimization for ARCIS IoT Devices

## Current Issue
- PNG base64 images are **28,000+ characters** (~21KB)
- Inefficient for IoT devices with limited bandwidth
- Slow transmission and processing

## Recommended Solutions

### 🎯 **Option 1: JPEG with Quality Compression**
```python
# On Jetson Nano/Raspberry Pi
import cv2
import base64

def compress_frame_for_transmission(frame, quality=60):
    """Compress frame to JPEG with quality control"""
    # Encode as JPEG with specified quality (30-80 recommended)
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
    _, buffer = cv2.imencode('.jpg', frame, encode_param)
    
    # Convert to base64
    jpg_as_text = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/jpeg;base64,{jpg_as_text}"

# Usage
compressed_frame = compress_frame_for_transmission(frame, quality=60)
# Result: ~3-8KB instead of 21KB (60-80% size reduction)
```

### 🎯 **Option 2: Resize + JPEG**
```python
def optimize_detection_frame(frame, max_width=640, quality=70):
    """Resize and compress frame"""
    height, width = frame.shape[:2]
    
    # Resize if too large
    if width > max_width:
        ratio = max_width / width
        new_height = int(height * ratio)
        frame = cv2.resize(frame, (max_width, new_height))
    
    # Compress to JPEG
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
    _, buffer = cv2.imencode('.jpg', frame, encode_param)
    
    return base64.b64encode(buffer).decode('utf-8')
```

### 🎯 **Option 3: WebP Format (Modern)**
```python
def compress_to_webp(frame, quality=60):
    """Use WebP for better compression"""
    encode_param = [int(cv2.IMWRITE_WEBP_QUALITY), quality]
    _, buffer = cv2.imencode('.webp', frame, encode_param)
    
    webp_as_text = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/webp;base64,{webp_as_text}"
```

## Implementation Strategy

### **Backend Changes**
1. Accept multiple image formats
2. Auto-detect format from data URL
3. Store efficiently in database

### **Frontend Changes**
```typescript
// Support multiple formats
const detectImageFormat = (base64Data: string) => {
    if (base64Data.startsWith('data:image/jpeg')) return 'JPEG';
    if (base64Data.startsWith('data:image/webp')) return 'WebP';
    if (base64Data.startsWith('data:image/png')) return 'PNG';
    return 'Unknown';
};
```

### **Device Configuration**
```json
{
    "image_settings": {
        "format": "jpeg",
        "quality": 60,
        "max_width": 640,
        "max_height": 480
    }
}
```

## Size Comparison
| Format | Size | Quality | Use Case |
|--------|------|---------|----------|
| PNG (current) | ~21KB | Perfect | Archive/Evidence |
| JPEG 80% | ~8KB | Excellent | Real-time alerts |
| JPEG 60% | ~5KB | Good | Live monitoring |
| JPEG 40% | ~3KB | Fair | Bandwidth limited |
| WebP 60% | ~4KB | Excellent | Modern browsers |

## Recommended Implementation
1. **Live Detection**: JPEG 60% quality, 640px width
2. **Evidence Storage**: PNG or JPEG 90% quality
3. **Bandwidth Critical**: JPEG 40% quality, 320px width

This reduces transmission size by **70-85%** while maintaining detection quality! 