-- Clean Start: Drop all existing objects then recreate
DROP VIEW IF EXISTS public.latest_detections CASCADE;
DROP VIEW IF EXISTS public.critical_alerts CASCADE;
DROP VIEW IF EXISTS public.active_weapon_threats CASCADE;
DROP VIEW IF EXISTS public.weapon_threat_summary CASCADE;
DROP VIEW IF EXISTS public.recent_alerts CASCADE;
DROP TABLE IF EXISTS public.detection_annotations CASCADE;
DROP TABLE IF EXISTS public.weapon_detections CASCADE;
DROP TABLE IF EXISTS public.alerts CASCADE;
DROP TABLE IF EXISTS public.detections CASCADE;
DROP TABLE IF EXISTS public.frames CASCADE;
DROP TABLE IF EXISTS public.detection_sessions CASCADE;
DROP TABLE IF EXISTS public.devices CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TYPE IF EXISTS public.object_category CASCADE;
DROP FUNCTION IF EXISTS public.prevent_frame_url_conflicts() CASCADE;

-- Create everything fresh
CREATE TYPE public.object_category AS ENUM ('weapon');

CREATE TABLE public.users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(28) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE TABLE public.devices (
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

CREATE TABLE public.detection_sessions (
    session_id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES public.devices(device_id),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(255) DEFAULT 'active',
    settings JSONB,
    notes TEXT,
    created_by INTEGER REFERENCES public.users(user_id)
);

CREATE TABLE public.frames (
    frame_id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES public.detection_sessions(session_id),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    file_path VARCHAR(255) NOT NULL,
    width INTEGER,
    height INTEGER,
    processed BOOLEAN DEFAULT FALSE,
    metadata JSONB
);

CREATE TABLE public.detections (
    detection_id SERIAL PRIMARY KEY,
    frame_id INTEGER REFERENCES public.frames(frame_id),
    object_category public.object_category NOT NULL DEFAULT 'weapon',
    object_type VARCHAR(50) NOT NULL,
    confidence FLOAT NOT NULL,
    bounding_box JSONB NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    threat_level INTEGER,
    metadata JSONB,
    detection_frame_data TEXT,
    frame_url TEXT,
    detection_frame_jpeg BYTEA,
    frame_metadata JSONB,
    system_metrics JSONB
);

CREATE TABLE public.weapon_detections (
    weapon_detection_id SERIAL PRIMARY KEY,
    detection_id INTEGER REFERENCES public.detections(detection_id),
    weapon_type VARCHAR(50) NOT NULL,
    visible_ammunition BOOLEAN DEFAULT FALSE,
    estimated_caliber VARCHAR(20),
    orientation_angle FLOAT,
    in_use BOOLEAN DEFAULT FALSE,
    metadata JSONB
);

CREATE TABLE public.alerts (
    alert_id SERIAL PRIMARY KEY,
    detection_id INTEGER REFERENCES public.detections(detection_id),
    alert_type VARCHAR(50) NOT NULL,
    alert_category VARCHAR(50) NOT NULL,
    severity INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action_required TEXT,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by INTEGER REFERENCES public.users(user_id),
    acknowledged_at TIMESTAMP,
    notes TEXT
);

CREATE TABLE public.detection_annotations (
    annotation_id SERIAL PRIMARY KEY,
    detection_id INTEGER REFERENCES public.detections(detection_id),
    user_id INTEGER REFERENCES public.users(user_id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    previous_threat_level INTEGER,
    new_threat_level INTEGER,
    notes TEXT,
    action_taken VARCHAR(100)
);

-- Indexes
CREATE INDEX idx_frames_session ON public.frames(session_id);
CREATE INDEX idx_detections_frame ON public.detections(frame_id);
CREATE INDEX idx_detections_object_type ON public.detections(object_type);
CREATE INDEX idx_detections_timestamp ON public.detections(timestamp);
CREATE INDEX idx_detections_threat_level ON public.detections(threat_level);
CREATE INDEX idx_detections_frame_url ON public.detections(frame_url);
CREATE INDEX idx_detections_has_jpeg ON public.detections(detection_id) WHERE detection_frame_jpeg IS NOT NULL;
CREATE INDEX idx_alerts_detection ON public.alerts(detection_id);
CREATE INDEX idx_alerts_severity ON public.alerts(severity);
CREATE INDEX idx_alerts_acknowledged ON public.alerts(acknowledged);
CREATE INDEX idx_weapon_detections_type ON public.weapon_detections(weapon_type);
CREATE INDEX idx_detection_annotations_detection ON public.detection_annotations(detection_id);

-- Constraints
ALTER TABLE public.detections ADD CONSTRAINT check_threat_level CHECK (threat_level >= 0 AND threat_level <= 10);
ALTER TABLE public.alerts ADD CONSTRAINT check_alert_severity CHECK (severity >= 1 AND severity <= 5);
ALTER TABLE public.detections ADD CONSTRAINT check_weapon_types CHECK (object_type IN ('Knife', 'Pistol', 'weapon', 'rifle'));

-- Views
CREATE VIEW public.recent_alerts AS
SELECT a.alert_id, a.alert_type, a.severity, a.timestamp, 
       d.object_type, d.confidence, d.threat_level,
       f.file_path, s.device_id
FROM public.alerts a
JOIN public.detections d ON a.detection_id = d.detection_id
JOIN public.frames f ON d.frame_id = f.frame_id
JOIN public.detection_sessions s ON f.session_id = s.session_id
WHERE a.acknowledged = FALSE
ORDER BY a.timestamp DESC;

CREATE VIEW public.weapon_threat_summary AS
SELECT 
    date_trunc('hour', d.timestamp) AS time_period,
    d.object_type,
    COUNT(*) AS detection_count,
    AVG(d.threat_level) AS avg_threat_level,
    MAX(d.threat_level) AS max_threat_level
FROM public.detections d
GROUP BY time_period, d.object_type
ORDER BY time_period DESC, max_threat_level DESC;

CREATE VIEW public.active_weapon_threats AS
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
FROM public.detections d
LEFT JOIN public.weapon_detections w ON d.detection_id = w.detection_id
LEFT JOIN public.frames f ON d.frame_id = f.frame_id
LEFT JOIN public.detection_sessions s ON f.session_id = s.session_id
WHERE d.threat_level >= 5
ORDER BY d.threat_level DESC, d.timestamp DESC;

CREATE VIEW public.critical_alerts AS
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
FROM public.alerts a
JOIN public.detections d ON a.detection_id = d.detection_id
JOIN public.frames f ON d.frame_id = f.frame_id
JOIN public.detection_sessions s ON f.session_id = s.session_id
WHERE a.acknowledged = FALSE AND a.severity >= 4
ORDER BY a.severity DESC, a.timestamp DESC;

CREATE VIEW public.latest_detections AS
SELECT 
    d.detection_id,
    d.timestamp,
    d.object_type,
    d.confidence,
    d.threat_level,
    f.file_path,
    s.device_id
FROM public.detections d
JOIN public.frames f ON d.frame_id = f.frame_id
JOIN public.detection_sessions s ON f.session_id = s.session_id
WHERE d.timestamp > NOW() - INTERVAL '5 minutes'
ORDER BY d.timestamp DESC;

-- Conflict prevention function
CREATE OR REPLACE FUNCTION public.prevent_frame_url_conflicts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.detection_frame_data IS NOT NULL AND NEW.detection_frame_data != '' THEN
        NEW.frame_url := NULL;
    END IF;
    
    IF NEW.detection_frame_jpeg IS NOT NULL THEN
        NEW.frame_url := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_frame_url_conflicts
    BEFORE INSERT OR UPDATE ON public.detections
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_frame_url_conflicts();

SELECT '✅ Clean database setup completed!' as status; 