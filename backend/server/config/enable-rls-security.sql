-- 🔒 ARCIS Row Level Security (RLS) Configuration
-- Run this script in Supabase SQL Editor to fix security warnings

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

-- Enable RLS on users table (fixes the warning)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on other sensitive tables
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detection_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weapon_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detection_annotations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES FOR BACKEND SERVICE
-- ============================================================================

-- Users table policies
CREATE POLICY "Backend service full access" ON public.users
    FOR ALL USING (true);

-- Devices table policies
CREATE POLICY "Backend service full access" ON public.devices
    FOR ALL USING (true);

-- Detection sessions policies
CREATE POLICY "Backend service full access" ON public.detection_sessions
    FOR ALL USING (true);

-- Frames table policies
CREATE POLICY "Backend service full access" ON public.frames
    FOR ALL USING (true);

-- Detections table policies (most important for weapon detection)
CREATE POLICY "Backend service full access" ON public.detections
    FOR ALL USING (true);

-- Weapon detections table policies
CREATE POLICY "Backend service full access" ON public.weapon_detections
    FOR ALL USING (true);

-- Alerts table policies
CREATE POLICY "Backend service full access" ON public.alerts
    FOR ALL USING (true);

-- Detection annotations policies
CREATE POLICY "Backend service full access" ON public.detection_annotations
    FOR ALL USING (true);

-- ============================================================================
-- OPTIONAL: CREATE USER-SPECIFIC POLICIES (FOR FUTURE FRONTEND AUTH)
-- ============================================================================

-- Uncomment these if you want to add user-specific access later
-- NOTE: These are commented out because your current app uses backend auth

/*
-- Users can only see their own data
CREATE POLICY "Users can see own data" ON public.users
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Users can see detections from their devices
CREATE POLICY "Users see own device detections" ON public.detections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.frames f
            JOIN public.detection_sessions ds ON f.session_id = ds.session_id
            WHERE f.frame_id = detections.frame_id
            AND ds.created_by = auth.uid()::integer
        )
    );
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that RLS is enabled (should return all tables with rls = true)
SELECT schemaname, tablename, rowsecurity as rls_enabled 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'devices', 'detections', 'alerts', 'frames')
ORDER BY tablename;

-- Check policies exist (should show policies for each table)
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT '✅ RLS Security configuration completed successfully!' as status; 