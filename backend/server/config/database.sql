-- Simplified ARCIS Database Schema - Weapon Detection Only
-- Create schema
CREATE SCHEMA IF NOT EXISTS arcis;
SET search_path TO arcis, public;

-- Simplified ENUM type for weapon detection only
CREATE TYPE object_category AS ENUM (
    'weapon'
);

-- Core tables
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(28) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS devices (
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

CREATE TABLE IF NOT EXISTS detection_sessions (
    session_id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(device_id),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(255) DEFAULT 'active',
    settings JSONB,
    notes TEXT,
    created_by INTEGER REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS frames (
    frame_id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES detection_sessions(session_id),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    file_path VARCHAR(255) NOT NULL,
    width INTEGER,
    height INTEGER,
    processed BOOLEAN DEFAULT FALSE,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS detections (
    detection_id SERIAL PRIMARY KEY,
    frame_id INTEGER REFERENCES frames(frame_id),
    object_category object_category NOT NULL DEFAULT 'weapon',
    object_type VARCHAR(50) NOT NULL, -- 'Knife', 'Pistol', 'weapon', 'rifle'
    confidence FLOAT NOT NULL,
    bounding_box JSONB NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    threat_level INTEGER,
    metadata JSONB,
    detection_frame_data TEXT, -- Base64 encoded detection frame image (legacy)
    frame_url TEXT, -- URL path to frame image file (file storage)
    detection_frame_jpeg BYTEA, -- Binary JPEG image data (preferred)
    frame_metadata JSONB, -- Image metadata: width, height, size, format, etc.
    system_metrics JSONB -- Device system metrics at time of detection
);

-- Weapon detection details table
CREATE TABLE IF NOT EXISTS weapon_detections (
    weapon_detection_id SERIAL PRIMARY KEY,
    detection_id INTEGER REFERENCES detections(detection_id),
    weapon_type VARCHAR(50) NOT NULL, -- 'Knife', 'Pistol', 'weapon', 'rifle'
    visible_ammunition BOOLEAN DEFAULT FALSE,
    estimated_caliber VARCHAR(20),
    orientation_angle FLOAT,
    in_use BOOLEAN DEFAULT FALSE,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS alerts (
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

-- Detection annotations for tracking changes
CREATE TABLE IF NOT EXISTS detection_annotations (
    annotation_id SERIAL PRIMARY KEY,
    detection_id INTEGER REFERENCES detections(detection_id),
    user_id INTEGER REFERENCES users(user_id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    previous_threat_level INTEGER,
    new_threat_level INTEGER,
    notes TEXT,
    action_taken VARCHAR(100)
);

-- Indexes for performance optimization
CREATE INDEX idx_frames_session ON frames(session_id);
CREATE INDEX idx_detections_frame ON detections(frame_id);
CREATE INDEX idx_detections_object_type ON detections(object_type);
CREATE INDEX idx_detections_timestamp ON detections(timestamp);
CREATE INDEX idx_detections_threat_level ON detections(threat_level);
CREATE INDEX IF NOT EXISTS idx_detections_frame_url ON detections(frame_url);
CREATE INDEX IF NOT EXISTS idx_detections_has_jpeg ON detections(detection_id) WHERE detection_frame_jpeg IS NOT NULL;
CREATE INDEX idx_alerts_detection ON alerts(detection_id);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX idx_weapon_detections_type ON weapon_detections(weapon_type);
CREATE INDEX idx_detection_annotations_detection ON detection_annotations(detection_id);

-- Constraints for data validation
ALTER TABLE detections ADD CONSTRAINT check_threat_level CHECK (threat_level >= 0 AND threat_level <= 10);
ALTER TABLE alerts ADD CONSTRAINT check_alert_severity CHECK (severity >= 1 AND severity <= 5);
ALTER TABLE detections ADD CONSTRAINT check_weapon_types CHECK (object_type IN ('Knife', 'Pistol', 'weapon', 'rifle'));

-- Views for common queries
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

CREATE OR REPLACE VIEW active_weapon_threats AS
SELECT 
    d.detection_id,
    d.timestamp,
    d.object_type,
    d.threat_level,
    d.confidence,
    d.bounding_box,
    d.detection_frame_data, -- Legacy base64 field
    d.frame_url, -- File storage URL
    d.detection_frame_jpeg, -- New binary JPEG field
    d.frame_metadata,
    CASE 
        WHEN d.detection_frame_jpeg IS NOT NULL THEN 'binary_jpeg'
        WHEN d.frame_url IS NOT NULL AND d.frame_url != 'legacy_base64_data' THEN 'file_url'
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

CREATE OR REPLACE VIEW critical_alerts AS
SELECT 
    a.alert_id,
    a.alert_type,
    a.alert_category,
    a.severity,
    a.timestamp,
    a.action_required,
    d.object_type,
    d.threat_level,
    f.file_path,
    s.device_id,
    s.session_id
FROM alerts a
JOIN detections d ON a.detection_id = d.detection_id
JOIN frames f ON d.frame_id = f.frame_id
JOIN detection_sessions s ON f.session_id = s.session_id
WHERE a.acknowledged = FALSE AND a.severity >= 4
ORDER BY a.severity DESC, a.timestamp DESC;

-- Latest detections view for real-time monitoring
CREATE OR REPLACE VIEW latest_detections AS
SELECT 
    d.detection_id,
    d.timestamp,
    d.object_type,
    d.confidence,
    d.threat_level,
    f.file_path,
    s.device_id
FROM detections d
JOIN frames f ON d.frame_id = f.frame_id
JOIN detection_sessions s ON f.session_id = s.session_id
WHERE d.timestamp > NOW() - INTERVAL '5 minutes'
ORDER BY d.timestamp DESC;
