CREATE DATABASE IF NOT EXISTS arcis;

SET search_path TO arcis, public;

CREATE TYPE object_category AS ENUM (
    'person',
    'weapon',
    'military_vehicle',
    'aircraft',
    'environmental_hazard',
    'behavior'
);

CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(28) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
);

CREATE TABLE IF NOT EXISTS devices (
    device_id SERIAL PRIMARY KEY,
    device_name VARCHAR(255) NOT NULL,
    device_type VARCHAR(255) NOT NULL, -- jetson nano, raspberry pi, etc.
    status VARCHAR(255) DEFAULT 'offline', -- online, offline, etc.
    ip_address VARCHAR(255), -- ip address of the device
    mac_address VARCHAR(17), -- mac address of the device
    last_seen TIMESTAMP, -- last seen of the device
    configuration JSONB, -- configuration of the device
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
);

CREATE TABLE IF NOT EXISTS detection_sessions (
    session_id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(device_id),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(255) DEFAULT 'active', -- active, inactive, etc.
    settings JSONB, -- settings of the detection session
    notes TEXT, -- notes of the detection session
    created_by INTEGER REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS frames (
    frame_id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES detection_sessions(session_id),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    file_path VARCHAR(255) NOT NULL,
    width INTEGER , -- (NOT NULL optionally)
    height INTEGER, -- (NOT NULL optionally)
    processed BOOLEAN DEFAULT FALSE,
    metadata JSONB, -- metadata of the frame
    -- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
);

CREATE TABLE IF NOT EXISTS detections (
    detection_id SERIAL PRIMARY KEY,
    frame_id INTEGER REFERENCES frames(frame_id),
    object_category object_category NOT NULL,
    object_type VARCHAR(50) NOT NULL, -- person, weapon, etc.
    confidence FLOAT NOT NULL,
    bounding_box JSONB NOT NULL, -- bounding box of the object
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pose_data JSONB, -- for person pose estimation
    threat_level INTEGER, -- low, medium, high
    metadata JSONB -- additional metadata
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

CREATE TABLE alerts (
    alert_id SERIAL PRIMARY KEY,
    detection_id INTEGER REFERENCES detections(detection_id),
    threat_analysis_id INTEGER REFERENCES threat_analysis(threat_id),
    alert_type VARCHAR(50) NOT NULL, -- weapon, military_vehicle, aircraft, fire, violent_behavior
    alert_category VARCHAR(50) NOT NULL, -- combat, environmental, behavioral
    severity INTEGER NOT NULL, -- 1-5 scale
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
    mapping_data JSONB, -- 3D map of the environment
    segments JSONB, -- segments of the environment scene
    depth_map JSONB, -- depth map of the environment
    cover_positions JSONB -- cover positions of the environment
);

CREATE TABLE IF NOT EXISTS behaviors (
    behavior_id SERIAL PRIMARY KEY,
    detection_id INTEGER REFERENCES detections(detection_id),
    behavior_type VARCHAR(50) NOT NULL, -- running, suspicious, aggressive
    confidence FLOAT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    trajectory JSONB, -- movement path
    action_data JSONB, -- recognized action
    threat_assessment JSONB, -- behavior analysis result

);

-- CLASSIFICATION TABLES
CREATE TABLE IF NOT EXISTS weapon_detections (
  weapon_detection_id SERIAL PRIMARY KEY,
  detection_id INTEGER REFERENCES detections(detection_id),
  weapon_type VARCHAR(50) NOT NULL, -- pistol, rifle, machine_gun, RPG, etc.
  visible_ammunition BOOLEAN DEFAULT FALSE,
  estimated_caliber VARCHAR(20),
  orientation_angle FLOAT, -- weapon orientation
  in_use BOOLEAN DEFAULT FALSE, -- whether weapon appears to be in active use
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS military_vehicle_detections (
  vehicle_detection_id SERIAL PRIMARY KEY,
  detection_id INTEGER REFERENCES detections(detection_id),
  vehicle_type VARCHAR(50) NOT NULL, -- tank, apc, btr, humvee, etc.
  vehicle_class VARCHAR(50), -- light, medium, heavy
  nationality VARCHAR(50), -- country of origin if identifiable
  armament_visible BOOLEAN DEFAULT FALSE,
  movement_status VARCHAR(20), -- stationary, moving, disabled
  orientation_angle FLOAT, -- vehicle orientation 
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS aircraft_detections (
  aircraft_detection_id SERIAL PRIMARY KEY,
  detection_id INTEGER REFERENCES detections(detection_id),
  aircraft_type VARCHAR(50) NOT NULL, -- fighter, bomber, helicopter, drone, etc.
  aircraft_class VARCHAR(50), -- fixed_wing, rotary, unmanned
  nationality VARCHAR(50), -- country of origin if identifiable
  altitude_estimate VARCHAR(50), -- very_low, low, medium, high
  speed_estimate VARCHAR(20), -- stationary, slow, fast, very_fast
  heading_angle FLOAT, -- aircraft heading
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS environmental_hazard_detections (
  hazard_detection_id SERIAL PRIMARY KEY,
  detection_id INTEGER REFERENCES detections(detection_id),
  hazard_type VARCHAR(50) NOT NULL, -- smoke, fire, explosion, gas, etc.
  intensity INTEGER, -- 1-10 scale
  spread_rate INTEGER, -- 1-10 scale
  color VARCHAR(30), -- black_smoke, white_smoke, red_fire, etc.
  coverage_area JSONB, -- area covered by hazard
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS behavior_detections (
  behavior_detection_id SERIAL PRIMARY KEY,
  detection_id INTEGER REFERENCES detections(detection_id),
  behavior_type VARCHAR(50) NOT NULL, -- running, fighting, surrender, etc.
  intensity INTEGER, -- 1-10 scale
  people_involved INTEGER, -- estimated number of people
  behavior_category VARCHAR(50), -- violent, suspicious, neutral, civilian
  direction_of_movement JSONB, -- movement vector
  metadata JSONB
);

-- Create indexes for performance
CREATE INDEX idx_frames_session ON frames(session_id);
CREATE INDEX idx_detections_frame ON detections(frame_id);
CREATE INDEX idx_detections_object_category ON detections(object_category);
CREATE INDEX idx_detections_object_type ON detections(object_type);
CREATE INDEX idx_detections_timestamp ON detections(timestamp);
CREATE INDEX idx_detections_threat_level ON detections(threat_level);
CREATE INDEX idx_alerts_detection ON alerts(detection_id);
CREATE INDEX idx_alerts_type ON alerts(alert_type);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_behaviors_detection ON behaviors(detection_id);
CREATE INDEX idx_behaviors_type ON behaviors(behavior_type);

-- indexes for specialized tables
CREATE INDEX idx_weapon_detections_type ON weapon_detections(weapon_type);
CREATE INDEX idx_military_vehicle_detections_type ON military_vehicle_detections(vehicle_type);
CREATE INDEX idx_aircraft_detections_type ON aircraft_detections(aircraft_type);
CREATE INDEX idx_environmental_hazard_type ON environmental_hazard_detections(hazard_type);
CREATE INDEX idx_behavior_detections_type ON behavior_detections(behavior_type);
CREATE INDEX idx_behavior_detections_category ON behavior_detections(behavior_category);
CREATE INDEX idx_threat_analysis_level ON threat_analysis(threat_level);
CREATE INDEX idx_threat_analysis_type ON threat_analysis(threat_type);
CREATE INDEX idx_alerts_category ON alerts(alert_category);

-- Create views for common queries
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

-- Environmental hazards view
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

-- Violent behavior view
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

-- Tactical situation summary view
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
