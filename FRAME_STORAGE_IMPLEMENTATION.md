# ARCIS Frame Storage & System Metrics Implementation

## Overview
This document outlines the implementation of three key features for the ARCIS weapon detection system:

1. **Detection Frame Images Storage** - Store detection frames directly in the database using Base64 encoding
2. **System Metrics Button** - Display comprehensive device metrics for each detection
3. **Expand Threat Button** - Full-screen modal overlay for detailed threat analysis

## 🗄️ Database Changes

### New Columns Added to `detections` Table
```sql
ALTER TABLE arcis.detections 
ADD COLUMN detection_frame_data TEXT,        -- Base64 encoded detection frame image
ADD COLUMN system_metrics JSONB;             -- Device system metrics at time of detection
```

### Frame Storage Strategy
- **Format**: Base64 encoded images (JPEG/PNG)
- **Storage**: Direct database storage for lightweight format suitable for Jetson Nano and Raspberry Pi
- **Rationale**: Eliminates file system dependencies, ensures data consistency, and simplifies deployment

## 🔧 Backend Implementation

### New API Endpoints

#### 1. Get System Metrics
```
GET /api/detections/:id/metrics
```
**Response Format:**
```json
{
  "success": true,
  "metrics": {
    "detection_id": 123,
    "timestamp": "2024-01-15T10:30:00Z",
    "confidence_score": 89,
    "threat_level": 7,
    "device_type": "jetson_nano",
    "device_id": "device-001",
    
    // System Performance
    "cpu_usage": 45.2,
    "gpu_usage": 67.8,
    "ram_usage": 52.1,
    "cpu_temp": 65.5,
    "gpu_temp": 72.3,
    "cpu_voltage": 1.2,
    "gpu_voltage": 1.1,
    
    // Network Metrics
    "network_status": "Connected",
    "network_speed": 100,
    "network_signal_strength": -45,
    
    // Detection Metrics
    "disk_usage": 75.3,
    "detection_latency": 125,
    "distance_to_detection": 5.2,
    "database_status": "Connected",
    "alert_played": true
  }
}
```

#### 2. Get Detection Frame
```
GET /api/detections/:id/frame
```
**Response Format:**
```json
{
  "success": true,
  "detection_id": 123,
  "frame_data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB...", // Base64 encoded image
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Updated Detection Endpoints
All detection creation endpoints now support:
- `frame_data`: Base64 encoded image string
- `system_metrics`: JSON object with device metrics

**Supported Endpoints:**
- `/api/detections/incoming` - General detection input
- `/api/detections/jetson-detection` - Jetson Nano specific
- `/api/detections/raspberry-detection` - Raspberry Pi + Google Cloud Vision
- `/api/detections/manual` - Manual officer entries

## 🎨 Frontend Implementation

### New Components

#### 1. SystemMetricsModal
**Location:** `frontend/src/components/dashboard/SystemMetricsModal.tsx`

**Features:**
- Comprehensive system metrics display
- Performance indicators with color-coded progress bars
- Temperature and voltage monitoring
- Network status and detection metrics
- Real-time refresh capability

**Usage:**
```tsx
<SystemMetricsModal
  isOpen={isMetricsOpen}
  onClose={onMetricsClose}
  detectionId={selectedThreatId}
/>
```

#### 2. ExpandThreatModal
**Location:** `frontend/src/components/dashboard/ExpandThreatModal.tsx`

**Features:**
- Full-screen modal overlay (6xl size, 95% viewport)
- Dual-column layout (threat info + detection frame)
- High-priority threat styling with red accents
- Detection frame image display with fallback handling
- Comprehensive threat details and comments
- Action buttons for threat acknowledgment

**Usage:**
```tsx
<ExpandThreatModal
  isOpen={isExpandOpen}
  onClose={onExpandClose}
  threat={selectedThreat}
/>
```

### Updated Dashboard
**Location:** `frontend/src/pages/DashboardPage.tsx`

**New Features:**
- Two action buttons per threat:
  - 📊 **System Metrics** - Opens SystemMetricsModal
  - 🔍 **Expand Threat** - Opens ExpandThreatModal
- Modal state management with React hooks
- Proper cleanup and error handling

## 📊 System Metrics Tracked

### Performance Metrics
- **CPU Usage** (%) - Processor utilization
- **GPU Usage** (%) - Graphics processor utilization  
- **RAM Usage** (%) - Memory utilization
- **Disk Usage** (%) - Storage utilization

### Hardware Monitoring
- **CPU Temperature** (°C) - Processor temperature
- **GPU Temperature** (°C) - Graphics processor temperature
- **CPU Voltage** (V) - Processor voltage
- **GPU Voltage** (V) - Graphics processor voltage

### Network Metrics
- **Network Status** - Connection status (Connected/Disconnected)
- **Network Speed** (Mbps) - Connection speed
- **Network Signal Strength** (dBm) - Signal quality

### Detection Metrics
- **Detection Latency** (ms) - Time from capture to detection
- **Distance to Detection** (m) - Physical distance to detected object
- **Database Status** - Database connection status
- **Alert Played** (boolean) - Whether audio alert was triggered

## 🔄 Data Flow

### Detection with Frame Storage
```
1. Device (Jetson/Pi) captures frame
2. Device processes detection
3. Device encodes frame to Base64
4. Device sends detection + frame_data + system_metrics to API
5. Backend stores all data in single database record
6. Frontend can retrieve frame and metrics via separate endpoints
```

### Frontend Display Flow
```
1. Dashboard loads threats from /api/detections/threats
2. User clicks "System Metrics" button
3. Frontend calls /api/detections/:id/metrics
4. SystemMetricsModal displays formatted metrics
5. User clicks "Expand Threat" button  
6. Frontend calls /api/detections/:id/frame
7. ExpandThreatModal displays threat details + frame image
```

## 🧪 Testing

### Backend Tests
**File:** `backend/server/test/testFrameEndpoints.js`

**Test Coverage:**
- Detection creation with frame data and system metrics
- System metrics endpoint retrieval
- Detection frame endpoint retrieval
- Error handling for missing frame data
- Base64 image encoding/decoding validation

**Run Tests:**
```bash
cd backend/server
node test/testFrameEndpoints.js
```

### Database Migration
**File:** `backend/server/test/addFrameColumns.js`

**Purpose:**
- Add new columns to existing database
- Test column functionality with sample data
- Verify data retrieval and storage

**Run Migration:**
```bash
cd backend/server
node test/addFrameColumns.js
```

## 🚀 Deployment Considerations

### Database Storage
- **Pros**: Simplified deployment, data consistency, no file system dependencies
- **Cons**: Larger database size, potential performance impact for large images
- **Mitigation**: Use lightweight image formats, implement compression if needed

### Performance Optimization
- Consider image compression before Base64 encoding
- Implement lazy loading for frame data
- Add database indexing for frequently queried metrics
- Consider caching for system metrics

### Security
- Validate Base64 image data on input
- Implement rate limiting for frame retrieval endpoints
- Sanitize system metrics input to prevent injection

## 📱 Mobile Responsiveness

### SystemMetricsModal
- Responsive grid layout (2 columns on desktop, 1 on mobile)
- Scrollable content for smaller screens
- Touch-friendly buttons and interactions

### ExpandThreatModal
- Adaptive layout (side-by-side on large screens, stacked on mobile)
- Responsive image sizing
- Mobile-optimized modal sizing (95% viewport)

## 🔮 Future Enhancements

### Potential Improvements
1. **Image Compression**: Implement client-side image compression
2. **Thumbnail Generation**: Create smaller thumbnails for list views
3. **Metrics Visualization**: Add charts and graphs for system metrics
4. **Real-time Updates**: WebSocket integration for live metrics
5. **Export Functionality**: PDF/CSV export for threat reports
6. **Metrics History**: Track metrics over time for trend analysis

### Integration Points
- **Alert System**: Trigger alerts based on system metrics thresholds
- **Reporting**: Generate automated reports with frame images
- **Analytics**: Aggregate metrics for system health monitoring
- **Mobile App**: Extend functionality to mobile applications

## ✅ Implementation Status

- ✅ Database schema updated
- ✅ Backend API endpoints implemented
- ✅ Frontend components created
- ✅ Dashboard integration completed
- ✅ Error handling implemented
- ✅ TypeScript types defined
- ✅ Build verification passed
- ⏳ Database migration (requires running database)
- ⏳ End-to-end testing (requires backend server)

## 📋 Usage Instructions

### For Developers
1. Run database migration: `node backend/server/test/addFrameColumns.js`
2. Start backend server: `cd backend && npm start`
3. Start frontend: `cd frontend && npm run dev`
4. Navigate to dashboard and test threat buttons

### For Jetson Nano/Raspberry Pi Integration
Include in detection payload:
```json
{
  "detectedObjects": [...],
  "frame": "base64-encoded-image-string",
  "systemMetrics": {
    "cpu_usage": 45.2,
    "gpu_usage": 67.8,
    "ram_usage": 52.1,
    // ... other metrics
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "deviceId": "device-001"
}
```

This implementation provides a robust foundation for frame storage and system monitoring in the ARCIS weapon detection system, with room for future enhancements and optimizations. 