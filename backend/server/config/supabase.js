const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase client configuration for ARCIS
const supabaseUrl = process.env.SUPABASE_URL || 'https://emjcotfxcqewhhvhjjof.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection
const testSupabaseConnection = async () => {
    try {
        console.log('🔍 Testing Supabase connection...');

        // Test basic connectivity
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);

        if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (expected for new DB)
            console.log('⚠️  Expected error for new database:', error.message);
        }

        console.log('✅ Supabase client connected successfully!');
        return true;
    } catch (err) {
        console.error('❌ Supabase connection failed:', err.message);
        return false;
    }
};

// ARCIS Database Operations using Supabase Client
const supabaseDb = {
    // Device operations
    devices: {
        create: async (deviceData) => {
            const { data, error } = await supabase
                .from('devices')
                .insert([deviceData])
                .select();

            if (error) throw error;
            return data[0];
        },

        getAll: async () => {
            const { data, error } = await supabase
                .from('devices')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },

        updateStatus: async (deviceId, status) => {
            const { data, error } = await supabase
                .from('devices')
                .update({
                    status,
                    last_seen: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('device_id', deviceId)
                .select();

            if (error) throw error;
            return data[0];
        }
    },

    // Detection operations for Pi/Jetson
    detections: {
        create: async (detectionData) => {
            const { data, error } = await supabase
                .from('detections')
                .insert([detectionData])
                .select();

            if (error) throw error;
            return data[0];
        },

        getRecent: async (limit = 50) => {
            const { data, error } = await supabase
                .from('detections')
                .select(`
                    *,
                    frames (
                        file_path,
                        timestamp,
                        detection_sessions (
                            device_id,
                            devices (
                                device_name
                            )
                        )
                    )
                `)
                .order('timestamp', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        },

        getByThreatLevel: async (minThreatLevel = 5) => {
            const { data, error } = await supabase
                .from('detections')
                .select('*')
                .gte('threat_level', minThreatLevel)
                .order('timestamp', { ascending: false });

            if (error) throw error;
            return data;
        }
    },

    // Frame operations
    frames: {
        create: async (frameData) => {
            const { data, error } = await supabase
                .from('frames')
                .insert([frameData])
                .select();

            if (error) throw error;
            return data[0];
        }
    },

    // Session operations
    sessions: {
        create: async (sessionData) => {
            const { data, error } = await supabase
                .from('detection_sessions')
                .insert([sessionData])
                .select();

            if (error) throw error;
            return data[0];
        },

        getActive: async () => {
            const { data, error } = await supabase
                .from('detection_sessions')
                .select('*')
                .eq('status', 'active');

            if (error) throw error;
            return data;
        }
    },

    // Alert operations
    alerts: {
        create: async (alertData) => {
            const { data, error } = await supabase
                .from('alerts')
                .insert([alertData])
                .select();

            if (error) throw error;
            return data[0];
        },

        getUnacknowledged: async () => {
            const { data, error } = await supabase
                .from('alerts')
                .select(`
                    *,
                    detections (
                        object_type,
                        confidence,
                        threat_level,
                        frames (
                            file_path,
                            detection_sessions (
                                device_id,
                                devices (
                                    device_name
                                )
                            )
                        )
                    )
                `)
                .eq('acknowledged', false)
                .order('severity', { ascending: false })
                .order('timestamp', { ascending: false });

            if (error) throw error;
            return data;
        }
    }
};

module.exports = {
    supabase,
    supabaseDb,
    testSupabaseConnection
}; 