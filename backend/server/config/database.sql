-- Create database (run separately if needed)
-- CREATE DATABASE arcis;

-- Create schema
CREATE SCHEMA IF NOT EXISTS arcis;
SET search_path TO arcis, public;

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS weapon_detections CASCADE;
DROP TABLE IF EXISTS vehicle_detections CASCADE;
DROP TABLE IF EXISTS person_detections CASCADE;
DROP TABLE IF EXISTS environmental_hazards CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS detections CASCADE;
DROP TABLE IF EXISTS frames CASCADE;
DROP TABLE IF EXISTS detection_sessions CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing views if they exist
DROP VIEW IF EXISTS tactical_situation CASCADE;
DROP VIEW IF EXISTS military_threats CASCADE;
DROP VIEW IF EXISTS environmental_overview CASCADE;

-- Drop existing types if they exist
DROP TYPE IF EXISTS object_category CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS device_status CASCADE;
DROP TYPE IF EXISTS alert_severity CASCADE;

-- Create ENUM types
CREATE TYPE object_category AS ENUM (
    'person', 'vehicle', 'weapon', 'equipment', 'structure', 'environmental'
);

CREATE TYPE user_role AS ENUM ('admin', 'operator', 'analyst', 'viewer');
CREATE TYPE device_status AS ENUM ('online', 'offline', 'maintenance', 'error');
CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- Users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Devices table (cameras, sensors, etc.)
CREATE TABLE devices (
    device_id SERIAL PRIMARY KEY,
    device_name VARCHAR(100) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    ip_address INET,
    mac_address MACADDR,
    location_description TEXT,
    configuration JSONB,
    status device_status DEFAULT 'offline',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP
);

-- Detection sessions
CREATE TABLE detection_sessions (
    session_id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(device_id) ON DELETE CASCADE,
    created_by INTEGER REFERENCES users(user_id),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    session_settings JSONB,
    is_active BOOLEAN DEFAULT true
);

-- Frames (individual camera frames/images)
CREATE TABLE frames (
    frame_id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES detection_sessions(session_id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    width INTEGER,
    height INTEGER,
    file_size BIGINT,
    metadata JSONB
);

-- Main detections table
CREATE TABLE detections (
    detection_id SERIAL PRIMARY KEY,
    frame_id INTEGER REFERENCES frames(frame_id) ON DELETE CASCADE,
    object_category object_category NOT NULL,
    object_type VARCHAR(100) NOT NULL,
    confidence DECIMAL(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    bounding_box JSONB NOT NULL, -- {x, y, width, height}
    threat_level INTEGER CHECK (threat_level >= 1 AND threat_level <= 10),
    pose_data JSONB, -- For person pose estimation
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Weapon-specific detections
CREATE TABLE weapon_detections (
    weapon_detection_id SERIAL PRIMARY KEY,
    detection_id INTEGER REFERENCES detections(detection_id) ON DELETE CASCADE,
    weapon_type VARCHAR(100) NOT NULL, -- rifle, pistol, knife, etc.
    visible_ammunition BOOLEAN DEFAULT false,
    estimated_caliber VARCHAR(20),
    orientation_angle DECIMAL(5,2), -- 0-360 degrees
    in_use BOOLEAN DEFAULT false,
    metadata JSONB
);

-- Vehicle-specific detections
CREATE TABLE vehicle_detections (
    vehicle_detection_id SERIAL PRIMARY KEY,
    detection_id INTEGER REFERENCES detections(detection_id) ON DELETE CASCADE,
    vehicle_type VARCHAR(100) NOT NULL, -- tank, truck, car, etc.
    military_classification VARCHAR(100),
    estimated_occupants INTEGER,
    movement_direction DECIMAL(5,2), -- 0-360 degrees
    estimated_speed DECIMAL(8,2), -- km/h
    armor_type VARCHAR(50),
    visible_weapons JSONB,
    metadata JSONB
);

-- Person-specific detections
CREATE TABLE person_detections (
    person_detection_id SERIAL PRIMARY KEY,
    detection_id INTEGER REFERENCES detections(detection_id) ON DELETE CASCADE,
    uniform_type VARCHAR(100),
    estimated_age_range VARCHAR(20),
    gender VARCHAR(20),
    carrying_equipment JSONB,
    pose_classification VARCHAR(100), -- standing, crouching, prone, etc.
    activity_classification VARCHAR(100), -- walking, running, aiming, etc.
    metadata JSONB
);

-- Environmental hazards
CREATE TABLE environmental_hazards (
    hazard_id SERIAL PRIMARY KEY,
    detection_id INTEGER REFERENCES detections(detection_id) ON DELETE CASCADE,
    hazard_type VARCHAR(100) NOT NULL, -- fire, smoke, explosion, etc.
    severity_level INTEGER CHECK (severity_level >= 1 AND severity_level <= 10),
    estimated_radius DECIMAL(10,2), -- meters
    wind_direction DECIMAL(5,2), -- 0-360 degrees
    metadata JSONB
);

-- Alerts system
CREATE TABLE alerts (
    alert_id SERIAL PRIMARY KEY,
    detection_id INTEGER REFERENCES detections(detection_id),
    alert_type VARCHAR(100) NOT NULL,
    severity alert_severity NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    acknowledged_by INTEGER REFERENCES users(user_id),
    resolved_at TIMESTAMP,
    resolved_by INTEGER REFERENCES users(user_id),
    metadata JSONB
);

-- Create indexes for performance
CREATE INDEX idx_detections_frame_id ON detections(frame_id);
CREATE INDEX idx_detections_category ON detections(object_category);
CREATE INDEX idx_detections_threat_level ON detections(threat_level);
CREATE INDEX idx_detections_detected_at ON detections(detected_at);
CREATE INDEX idx_frames_session_id ON frames(session_id);
CREATE INDEX idx_frames_captured_at ON frames(captured_at);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);
CREATE INDEX idx_devices_status ON devices(status);

-- Create views for tactical analysis
CREATE VIEW tactical_situation AS
SELECT 
    d.detection_id,
    d.object_category,
    d.object_type,
    d.threat_level,
    d.confidence,
    d.detected_at,
    f.captured_at,
    dev.device_name,
    dev.location_description,
    CASE 
        WHEN d.object_category = 'weapon' THEN wd.weapon_type
        WHEN d.object_category = 'vehicle' THEN vd.vehicle_type
        WHEN d.object_category = 'person' THEN pd.uniform_type
        ELSE d.object_type
    END as specific_type,
    CASE 
        WHEN d.threat_level >= 8 THEN 'CRITICAL'
        WHEN d.threat_level >= 6 THEN 'HIGH'
        WHEN d.threat_level >= 4 THEN 'MEDIUM'
        ELSE 'LOW'
    END as threat_classification
FROM detections d
JOIN frames f ON d.frame_id = f.frame_id
JOIN detection_sessions ds ON f.session_id = ds.session_id
JOIN devices dev ON ds.device_id = dev.device_id
LEFT JOIN weapon_detections wd ON d.detection_id = wd.detection_id
LEFT JOIN vehicle_detections vd ON d.detection_id = vd.detection_id
LEFT JOIN person_detections pd ON d.detection_id = pd.detection_id
WHERE d.detected_at >= NOW() - INTERVAL '24 hours'
ORDER BY d.threat_level DESC, d.detected_at DESC;

CREATE VIEW military_threats AS
SELECT 
    d.detection_id,
    d.object_category,
    d.object_type,
    d.threat_level,
    d.confidence,
    d.detected_at,
    dev.device_name,
    dev.location_description,
    COALESCE(wd.weapon_type, vd.vehicle_type, 'Unknown') as threat_type,
    CASE 
        WHEN wd.in_use = true THEN 'ACTIVE WEAPON'
        WHEN vd.military_classification IS NOT NULL THEN 'MILITARY VEHICLE'
        WHEN d.threat_level >= 7 THEN 'HIGH THREAT'
        ELSE 'POTENTIAL THREAT'
    END as threat_status
FROM detections d
JOIN frames f ON d.frame_id = f.frame_id
JOIN detection_sessions ds ON f.session_id = ds.session_id
JOIN devices dev ON ds.device_id = dev.device_id
LEFT JOIN weapon_detections wd ON d.detection_id = wd.detection_id
LEFT JOIN vehicle_detections vd ON d.detection_id = vd.detection_id
WHERE d.object_category IN ('weapon', 'vehicle') 
    AND d.threat_level >= 5
    AND d.detected_at >= NOW() - INTERVAL '12 hours'
ORDER BY d.threat_level DESC, d.detected_at DESC;

CREATE VIEW environmental_overview AS
SELECT 
    eh.hazard_id,
    d.detection_id,
    eh.hazard_type,
    eh.severity_level,
    eh.estimated_radius,
    d.detected_at,
    dev.device_name,
    dev.location_description,
    CASE 
        WHEN eh.severity_level >= 8 THEN 'CRITICAL'
        WHEN eh.severity_level >= 6 THEN 'HIGH'
        WHEN eh.severity_level >= 4 THEN 'MEDIUM'
        ELSE 'LOW'
    END as severity_classification
FROM environmental_hazards eh
JOIN detections d ON eh.detection_id = d.detection_id
JOIN frames f ON d.frame_id = f.frame_id
JOIN detection_sessions ds ON f.session_id = ds.session_id
JOIN devices dev ON ds.device_id = dev.device_id
WHERE d.detected_at >= NOW() - INTERVAL '24 hours'
ORDER BY eh.severity_level DESC, d.detected_at DESC;

-- Insert sample data
INSERT INTO users (username, email, password_hash, role) VALUES 
('admin', 'admin@arcis.mil', '$2b$10$hashedpassword1', 'admin'),
('operator1', 'operator1@arcis.mil', '$2b$10$hashedpassword2', 'operator'),
('analyst1', 'analyst1@arcis.mil', '$2b$10$hashedpassword3', 'analyst');

INSERT INTO devices (device_name, device_type, ip_address, mac_address, location_description, configuration, status) VALUES 
('Camera-Alpha-01', 'IP Camera', '192.168.1.101', '00:11:22:33:44:55', 'North Perimeter Tower', '{"resolution": "4K", "fps": 30, "night_vision": true}', 'online'),
('Camera-Bravo-02', 'IP Camera', '192.168.1.102', '00:11:22:33:44:56', 'East Gate Checkpoint', '{"resolution": "1080p", "fps": 60, "thermal": true}', 'online'),
('Sensor-Charlie-03', 'Motion Sensor', '192.168.1.103', '00:11:22:33:44:57', 'South Fence Line', '{"sensitivity": "high", "range": "100m"}', 'online');

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON SCHEMA arcis TO postgres;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA arcis TO postgres;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA arcis TO postgres;

COMMIT;
