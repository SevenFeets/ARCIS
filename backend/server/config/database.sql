-- Simple test database schema for ARCIS
-- Create schema
CREATE SCHEMA IF NOT EXISTS arcis;
SET search_path TO arcis, public;

-- Create ENUM type
CREATE TYPE object_category AS ENUM (
    'person',
    'weapon',
    'military_vehicle',
    'aircraft',
    'environmental_hazard',
    'behavior'
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
    object_category object_category NOT NULL,
    object_type VARCHAR(50) NOT NULL,
    confidence FLOAT NOT NULL,
    bounding_box JSONB NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pose_data JSONB,
    threat_level INTEGER,
    metadata JSONB
);

-- Specialized detection tables
CREATE TABLE IF NOT EXISTS weapon_detections (
    weapon_detection_id SERIAL PRIMARY KEY,
    detection_id INTEGER REFERENCES detections(detection_id),
    weapon_type VARCHAR(50) NOT NULL,
    visible_ammunition BOOLEAN DEFAULT FALSE,
    estimated_caliber VARCHAR(20),
    orientation_angle FLOAT,
    in_use BOOLEAN DEFAULT FALSE,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS military_vehicle_detections (
    vehicle_detection_id SERIAL PRIMARY KEY,
    detection_id INTEGER REFERENCES detections(detection_id),
    vehicle_type VARCHAR(50) NOT NULL,
    vehicle_class VARCHAR(50),
    nationality VARCHAR(50),
    armament_visible BOOLEAN DEFAULT FALSE,
    movement_status VARCHAR(20),
    orientation_angle FLOAT,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS aircraft_detections (
    aircraft_detection_id SERIAL PRIMARY KEY,
    detection_id INTEGER REFERENCES detections(detection_id),
    aircraft_type VARCHAR(50) NOT NULL,
    aircraft_class VARCHAR(50),
    nationality VARCHAR(50),
    altitude_estimate VARCHAR(50),
    speed_estimate VARCHAR(20),
    heading_angle FLOAT,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS environmental_hazard_detections (
    hazard_detection_id SERIAL PRIMARY KEY,
    detection_id INTEGER REFERENCES detections(detection_id),
    hazard_type VARCHAR(50) NOT NULL,
    intensity INTEGER,
    spread_rate INTEGER,
    color VARCHAR(30),
    coverage_area JSONB,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS behavior_detections (
    behavior_detection_id SERIAL PRIMARY KEY,
    detection_id INTEGER REFERENCES detections(detection_id),
    behavior_type VARCHAR(50) NOT NULL,
    intensity INTEGER,
    people_involved INTEGER,
    behavior_category VARCHAR(50),
    direction_of_movement JSONB,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS threat_analysis (
    threat_id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES detection_sessions(session_id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    threat_level INTEGER NOT NULL,
    threat_type VARCHAR(100) NOT NULL,
    geographic_area JSONB,
    detection_ids INTEGER[],
    response_recommendation TEXT,
    confidence FLOAT,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS alerts (
    alert_id SERIAL PRIMARY KEY,
    detection_id INTEGER REFERENCES detections(detection_id),
    threat_analysis_id INTEGER REFERENCES threat_analysis(threat_id),
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

CREATE TABLE IF NOT EXISTS environments (
    environment_id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES detection_sessions(session_id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mapping_data JSONB,
    segments JSONB,
    depth_map JSONB,
    cover_positions JSONB
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
CREATE INDEX idx_detections_object_category ON detections(object_category);
CREATE INDEX idx_detections_object_type ON detections(object_type);
CREATE INDEX idx_detections_timestamp ON detections(timestamp);
CREATE INDEX idx_detections_threat_level ON detections(threat_level);
CREATE INDEX idx_alerts_detection ON alerts(detection_id);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX idx_weapon_detections_type ON weapon_detections(weapon_type);
CREATE INDEX idx_military_vehicle_detections_type ON military_vehicle_detections(vehicle_type);
CREATE INDEX idx_aircraft_detections_type ON aircraft_detections(aircraft_type);
CREATE INDEX idx_environmental_hazard_type ON environmental_hazard_detections(hazard_type);
CREATE INDEX idx_behavior_detections_type ON behavior_detections(behavior_type);
CREATE INDEX idx_behavior_detections_category ON behavior_detections(behavior_category);
CREATE INDEX idx_threat_analysis_level ON threat_analysis(threat_level);
CREATE INDEX idx_threat_analysis_type ON threat_analysis(threat_type);
CREATE INDEX idx_alerts_category ON alerts(alert_category);
CREATE INDEX idx_detection_annotations_detection ON detection_annotations(detection_id);

-- Constraints for data validation
ALTER TABLE detections ADD CONSTRAINT check_threat_level CHECK (threat_level >= 0 AND threat_level <= 10);
ALTER TABLE environmental_hazard_detections ADD CONSTRAINT check_hazard_intensity CHECK (intensity >= 0 AND intensity <= 10);
ALTER TABLE environmental_hazard_detections ADD CONSTRAINT check_spread_rate CHECK (spread_rate >= 0 AND spread_rate <= 10);
ALTER TABLE behavior_detections ADD CONSTRAINT check_behavior_intensity CHECK (intensity >= 0 AND intensity <= 10);
ALTER TABLE alerts ADD CONSTRAINT check_alert_severity CHECK (severity >= 1 AND severity <= 5);

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

CREATE OR REPLACE VIEW threat_summary AS
SELECT 
    date_trunc('hour', d.timestamp) AS time_period,
    d.object_type,
    COUNT(*) AS detection_count,
    AVG(d.threat_level) AS avg_threat_level,
    MAX(d.threat_level) AS max_threat_level
FROM detections d
GROUP BY time_period, d.object_type
ORDER BY time_period DESC, max_threat_level DESC;

CREATE OR REPLACE VIEW military_threats AS
SELECT 
    d.detection_id,
    d.timestamp,
    d.object_category,
    d.object_type,
    d.threat_level,
    CASE 
        WHEN d.object_category = 'military_vehicle' THEN 
            (SELECT json_build_object('type', mv.vehicle_type, 'class', mv.vehicle_class, 'nationality', mv.nationality)
             FROM military_vehicle_detections mv WHERE mv.detection_id = d.detection_id)
        WHEN d.object_category = 'aircraft' THEN
            (SELECT json_build_object('type', ac.aircraft_type, 'class', ac.aircraft_class, 'nationality', ac.nationality)
             FROM aircraft_detections ac WHERE ac.detection_id = d.detection_id)
        WHEN d.object_category = 'weapon' THEN
            (SELECT json_build_object('type', w.weapon_type, 'in_use', w.in_use)
             FROM weapon_detections w WHERE w.detection_id = d.detection_id)
        ELSE NULL
    END AS details,
    f.file_path,
    s.device_id
FROM detections d
JOIN frames f ON d.frame_id = f.frame_id
JOIN detection_sessions s ON f.session_id = s.session_id
WHERE d.object_category IN ('military_vehicle', 'aircraft', 'weapon')
  AND d.threat_level >= 5
ORDER BY d.threat_level DESC, d.timestamp DESC;

CREATE OR REPLACE VIEW environmental_hazards AS
SELECT 
    d.detection_id,
    d.timestamp,
    d.object_type,
    e.hazard_type,
    e.intensity,
    e.spread_rate,
    e.color,
    f.file_path,
    s.device_id
FROM detections d
JOIN environmental_hazard_detections e ON d.detection_id = e.detection_id
JOIN frames f ON d.frame_id = f.frame_id
JOIN detection_sessions s ON f.session_id = s.session_id
ORDER BY e.intensity DESC, d.timestamp DESC;

CREATE OR REPLACE VIEW violent_behaviors AS
SELECT 
    d.detection_id,
    d.timestamp,
    d.object_type,
    b.behavior_type,
    b.intensity,
    b.people_involved,
    b.behavior_category,
    f.file_path,
    s.device_id
FROM detections d
JOIN behavior_detections b ON d.detection_id = b.detection_id
JOIN frames f ON d.frame_id = f.frame_id
JOIN detection_sessions s ON f.session_id = s.session_id
WHERE b.behavior_category = 'violent'
ORDER BY b.intensity DESC, d.timestamp DESC;

CREATE OR REPLACE VIEW tactical_situation_summary AS
SELECT 
    date_trunc('minute', d.timestamp) AS time_period,
    d.object_category,
    COUNT(*) AS detection_count,
    AVG(d.threat_level) AS avg_threat_level,
    MAX(d.threat_level) AS max_threat_level,
    ARRAY_AGG(DISTINCT d.object_type) AS detected_types
FROM detections d
WHERE d.timestamp > NOW() - INTERVAL '1 hour'
GROUP BY time_period, d.object_category
ORDER BY time_period DESC, max_threat_level DESC;

CREATE OR REPLACE VIEW critical_alerts AS
SELECT 
    a.alert_id,
    a.alert_type,
    a.alert_category,
    a.severity,
    a.timestamp,
    a.action_required,
    d.object_category,
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
    d.object_category,
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
