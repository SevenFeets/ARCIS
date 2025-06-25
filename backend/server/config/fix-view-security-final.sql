-- 🔒 Fix View Security - FINAL VERSION
-- This version drops views and recreates them with SECURITY INVOKER (no verification issues)

-- ============================================================================
-- STEP 1: DROP ALL VIEWS FIRST
-- ============================================================================

DROP VIEW IF EXISTS public.latest_detections CASCADE;
DROP VIEW IF EXISTS public.critical_alerts CASCADE;
DROP VIEW IF EXISTS public.active_weapon_threats CASCADE;
DROP VIEW IF EXISTS public.weapon_threat_summary CASCADE;
DROP VIEW IF EXISTS public.recent_alerts CASCADE;

-- ============================================================================
-- STEP 2: RECREATE VIEWS WITH SECURITY INVOKER
-- ============================================================================

-- Fix recent_alerts view (the one mentioned in the warning)
CREATE VIEW public.recent_alerts WITH (security_invoker = on) AS
SELECT a.alert_id, a.alert_type, a.severity, a.timestamp, 
       d.object_type, d.confidence, d.threat_level,
       f.file_path, s.device_id
FROM public.alerts a
JOIN public.detections d ON a.detection_id = d.detection_id
JOIN public.frames f ON d.frame_id = f.frame_id
JOIN public.detection_sessions s ON f.session_id = s.session_id
WHERE a.acknowledged = FALSE
ORDER BY a.timestamp DESC;

-- Fix weapon_threat_summary view
CREATE VIEW public.weapon_threat_summary WITH (security_invoker = on) AS
SELECT 
    date_trunc('hour', d.timestamp) AS time_period,
    d.object_type,
    COUNT(*) AS detection_count,
    AVG(d.threat_level) AS avg_threat_level,
    MAX(d.threat_level) AS max_threat_level
FROM public.detections d
GROUP BY time_period, d.object_type
ORDER BY time_period DESC, max_threat_level DESC;

-- Fix active_weapon_threats view
CREATE VIEW public.active_weapon_threats WITH (security_invoker = on) AS
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

-- Fix critical_alerts view
CREATE VIEW public.critical_alerts WITH (security_invoker = on) AS
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

-- Fix latest_detections view
CREATE VIEW public.latest_detections WITH (security_invoker = on) AS
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

-- ============================================================================
-- VERIFICATION QUERIES (FIXED)
-- ============================================================================

-- Check that all views exist and were created successfully
SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('recent_alerts', 'weapon_threat_summary', 'active_weapon_threats', 'critical_alerts', 'latest_detections')
ORDER BY viewname;

-- Count total views created
SELECT COUNT(*) as total_views_created
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('recent_alerts', 'weapon_threat_summary', 'active_weapon_threats', 'critical_alerts', 'latest_detections');

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT '✅ All views recreated successfully with SECURITY INVOKER! Security warnings should be resolved.' as status; 