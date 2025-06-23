# ARCIS Database Schema Documentation
## Advanced Real-time Comprehensive Intelligence System (Weapon Detection)

This document explains the database schema for the ARCIS weapon detection system, including tables, indexes, views, and special features.

---

## 🎯 **System Overview**

ARCIS is a **weapon detection system** that processes data from Jetson Nano/Raspberry Pi devices with Google Cloud integration. The database is designed specifically for **weapon detection only**, with support for multiple image storage methods.

---

## 📊 **Core Tables**

### **1. Users Table**
```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(28) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);
```
**Purpose**: User authentication and authorization for the web dashboard.

### **2. Devices Table**
```sql
CREATE TABLE devices (
    device_id SERIAL PRIMARY KEY,
    device_name VARCHAR(255) NOT NULL,
    device_type VARCHAR(255) NOT NULL,
    status VARCHAR(255) DEFAULT 'offline',
    ip_address VARCHAR(255),
    mac_address VARCHAR(17),
    last_seen TIMESTAMP,
    configuration JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Purpose**: Manages Jetson Nano/Raspberry Pi devices that perform weapon detection.

### **3. Detection Sessions Table**
```sql
CREATE TABLE detection_sessions (
    session_id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(device_id),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(255) DEFAULT 'active',
    settings JSONB,
    notes TEXT,
    created_by INTEGER REFERENCES users(user_id)
);
```
**Purpose**: Groups detection activities into logical sessions.

### **4. Frames Table**
```sql
CREATE TABLE frames (
    frame_id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES detection_sessions(session_id),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    file_path VARCHAR(255) NOT NULL,
    width INTEGER,
    height INTEGER,
    processed BOOLEAN DEFAULT FALSE,
    metadata JSONB
);
```
**Purpose**: Stores metadata about video frames that contain detections.

### **5. Detections Table** ⭐ **CORE TABLE**
```sql
CREATE TABLE detections (
    detection_id SERIAL PRIMARY KEY,
    frame_id INTEGER REFERENCES frames(frame_id),
    object_category object_category NOT NULL DEFAULT 'weapon',
    object_type VARCHAR(50) NOT NULL, -- 'Knife', 'Pistol', 'weapon', 'rifle'
    confidence FLOAT NOT NULL,
    bounding_box JSONB NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    threat_level INTEGER,
    metadata JSONB,
    -- IMAGE STORAGE OPTIONS (Multiple formats supported)
    detection_frame_data TEXT,     -- Base64 encoded image (Priority 3)
    frame_url TEXT,               -- File URL path (Priority 2)
    detection_frame_jpeg BYTEA,   -- Binary JPEG data (Priority 1)
    frame_metadata JSONB,         -- Image metadata
    system_metrics JSONB          -- Device metrics at detection time
);
```
**Purpose**: **Main table** storing all weapon detection data and associated images.

**🔧 Image Storage Priority System:**
1. **Binary JPEG** (`detection_frame_jpeg`) - Highest priority
2. **File URL** (`frame_url`) - Medium priority  
3. **Base64 Data** (`detection_frame_data`) - Fallback priority

### **6. Weapon Detections Table**
```sql
CREATE TABLE weapon_detections (
    weapon_detection_id SERIAL PRIMARY KEY,
    detection_id INTEGER REFERENCES detections(detection_id),
    weapon_type VARCHAR(50) NOT NULL,
    visible_ammunition BOOLEAN DEFAULT FALSE,
    estimated_caliber VARCHAR(20),
    orientation_angle FLOAT,
    in_use BOOLEAN DEFAULT FALSE,
    metadata JSONB
);
```
**Purpose**: Extended details specific to weapon detections.

### **7. Alerts Table**
```sql
CREATE TABLE alerts (
    alert_id SERIAL PRIMARY KEY,
    detection_id INTEGER REFERENCES detections(detection_id),
    alert_type VARCHAR(50) NOT NULL,
    alert_category VARCHAR(50) NOT NULL,
    severity INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action_required TEXT,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by INTEGER REFERENCES users(user_id),
    acknowledged_at TIMESTAMP,
    notes TEXT
);
```
**Purpose**: High-priority alerts generated from weapon detections.

---

## 🔍 **Performance Indexes**

### **Core Detection Indexes**
```sql
CREATE INDEX idx_detections_frame ON detections(frame_id);
CREATE INDEX idx_detections_object_type ON detections(object_type);
CREATE INDEX idx_detections_timestamp ON detections(timestamp);
CREATE INDEX idx_detections_threat_level ON detections(threat_level);
```
**Purpose**: Speed up queries filtering by frame, weapon type, time, and threat level.

### **Image Storage Indexes**
```sql
CREATE INDEX idx_detections_frame_url ON detections(frame_url);
CREATE INDEX idx_detections_has_jpeg ON detections(detection_id) WHERE detection_frame_jpeg IS NOT NULL;
```
**Purpose**: Optimize image retrieval and storage method queries.

### **Alert Indexes**
```sql
CREATE INDEX idx_alerts_detection ON alerts(detection_id);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_acknowledged ON alerts(acknowledged);
```
**Purpose**: Fast alert filtering and acknowledgment tracking.

---

## 👁️ **Database Views**

### **1. Active Weapon Threats View**
```sql
CREATE OR REPLACE VIEW active_weapon_threats AS
SELECT 
    d.detection_id,
    d.timestamp,
    d.object_type,
    d.threat_level,
    d.confidence,
    d.bounding_box,
    d.detection_frame_data,
    d.frame_url,
    d.detection_frame_jpeg,
    d.frame_metadata,
    CASE 
        WHEN d.detection_frame_jpeg IS NOT NULL THEN 'binary_jpeg'
        WHEN d.frame_url IS NOT NULL THEN 'file_url'
        WHEN d.detection_frame_data IS NOT NULL THEN 'base64'
        ELSE 'none'
    END AS frame_format,
    w.weapon_type,
    w.in_use,
    w.visible_ammunition,
    f.file_path,
    s.device_id,
    d.metadata,
    d.system_metrics
FROM detections d
LEFT JOIN weapon_detections w ON d.detection_id = w.detection_id
LEFT JOIN frames f ON d.frame_id = f.frame_id
LEFT JOIN detection_sessions s ON f.session_id = s.session_id
WHERE d.threat_level >= 5
ORDER BY d.threat_level DESC, d.timestamp DESC;
```
**Purpose**: **Primary view** used by the frontend dashboard to display weapon threats with image format detection.

### **2. Weapon Threat Summary View**
```sql
CREATE OR REPLACE VIEW weapon_threat_summary AS
SELECT 
    date_trunc('hour', d.timestamp) AS time_period,
    d.object_type,
    COUNT(*) AS detection_count,
    AVG(d.threat_level) AS avg_threat_level,
    MAX(d.threat_level) AS max_threat_level
FROM detections d
GROUP BY time_period, d.object_type
ORDER BY time_period DESC, max_threat_level DESC;
```
**Purpose**: Hourly aggregated statistics for dashboard analytics.

### **3. Recent Alerts View**
```sql
CREATE OR REPLACE VIEW recent_alerts AS
SELECT a.alert_id, a.alert_type, a.severity, a.timestamp, 
       d.object_type, d.confidence, d.threat_level,
       f.file_path, s.device_id
FROM alerts a
JOIN detections d ON a.detection_id = d.detection_id
JOIN frames f ON d.frame_id = f.frame_id
JOIN detection_sessions s ON f.session_id = s.session_id
WHERE a.acknowledged = FALSE
ORDER BY a.timestamp DESC;
```
**Purpose**: Unacknowledged alerts for real-time notifications.

---

## 🛡️ **Image Storage Conflict Prevention**

### **Automatic Trigger Protection**
```sql
CREATE OR REPLACE FUNCTION prevent_frame_url_conflicts()
RETURNS TRIGGER AS $$
BEGIN
    -- If base64 data is present, clear file URL
    IF NEW.detection_frame_data IS NOT NULL AND NEW.detection_frame_data != '' THEN
        NEW.frame_url := NULL;
    END IF;
    
    -- If binary JPEG is present, clear file URL
    IF NEW.detection_frame_jpeg IS NOT NULL THEN
        NEW.frame_url := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_frame_url_conflicts
    BEFORE INSERT OR UPDATE ON detections
    FOR EACH ROW
    EXECUTE FUNCTION prevent_frame_url_conflicts();
```
**Purpose**: **Prevents image display issues** by ensuring only one image storage method is used per detection.

**What This Solves:**
- ✅ Prevents double `/api/api/` URL issues
- ✅ Ensures consistent image loading in frontend
- ✅ Automatically resolves storage method conflicts
- ✅ Applies to all future INSERT/UPDATE operations

---

## 🔧 **Data Validation Constraints**

```sql
-- Threat level validation
ALTER TABLE detections ADD CONSTRAINT check_threat_level 
CHECK (threat_level >= 0 AND threat_level <= 10);

-- Alert severity validation  
ALTER TABLE alerts ADD CONSTRAINT check_alert_severity 
CHECK (severity >= 1 AND severity <= 5);

-- Weapon type validation
ALTER TABLE detections ADD CONSTRAINT check_weapon_types 
CHECK (object_type IN ('Knife', 'Pistol', 'weapon', 'rifle'));
```

---

## 🎯 **API Endpoints & Data Flow**

### **Detection Creation Endpoints**
1. **`/jetson-detection`** - Jetson Nano devices → Uses base64 storage
2. **`/raspberry-detection`** - Raspberry Pi devices → Uses base64 storage
3. **`/upload`** - File upload → Uses file URL storage
4. **`/upload-jpeg`** - Binary upload → Uses binary JPEG storage
5. **`/manual`** - Manual entry → No image data

### **Frontend Image Loading Priority**
The `ExpandThreatModal.tsx` component loads images in this order:
1. **Binary JPEG endpoint** (if `has_binary_jpeg` is true)
2. **File URL** (if `frame_url` is not null)
3. **Base64 data** (if `detection_frame_data` is not null)  
4. **API fallback** (last resort)

---

## 📈 **Performance Characteristics**

- **Base64 Storage**: Fast loading, larger database size
- **File Storage**: Smaller database, requires file system management
- **Binary JPEG**: Best performance, direct database storage
- **Indexes**: Sub-second query performance for typical workloads
- **Views**: Pre-optimized complex queries for dashboard

---

## 🔄 **Maintenance & Best Practices**

### **Regular Cleanup**
```sql
-- Find and clean up orphaned data
DELETE FROM alerts WHERE detection_id NOT IN (SELECT detection_id FROM detections);
DELETE FROM weapon_detections WHERE detection_id NOT IN (SELECT detection_id FROM detections);
```

### **Performance Monitoring**
```sql
-- Check index usage
SELECT schemaname, tablename, attribs, n_distinct, correlation 
FROM pg_stats WHERE tablename = 'detections';

-- Monitor trigger performance
SELECT * FROM pg_stat_user_triggers WHERE schemaname = 'arcis';
```

---

## 🚀 **System Benefits**

1. **Reliability**: Automatic conflict prevention ensures consistent image display
2. **Performance**: Optimized indexes for weapon detection queries
3. **Scalability**: JSONB fields allow flexible metadata storage
4. **Maintainability**: Clear separation of concerns between tables
5. **Flexibility**: Multiple image storage options for different use cases

**This schema is specifically designed for weapon detection systems with robust image handling capabilities.**