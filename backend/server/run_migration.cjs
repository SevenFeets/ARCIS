// Load environment variables first
require('dotenv').config();

const { supabase } = require('./config/supabase');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('🔄 Running Binary JPEG Migration');
    console.log('=================================');

    try {
        console.log('📄 Adding binary JPEG columns to detections table...');

        // Add the new columns directly using Supabase client
        // Since we can't execute raw SQL easily, let's try to add the columns using a simple approach

        // First, let's check if we can query the current schema
        const { data: testData, error: testError } = await supabase
            .from('detections')
            .select('detection_id')
            .limit(1);

        if (testError) {
            console.error('❌ Cannot access detections table:', testError);
            return;
        }

        console.log('✅ Database connection verified');
        console.log('💡 Note: Binary JPEG columns need to be added manually in Supabase dashboard');
        console.log('📋 Please run these SQL commands in your Supabase SQL editor:');
        console.log('');
        console.log('ALTER TABLE detections ADD COLUMN IF NOT EXISTS detection_frame_jpeg BYTEA;');
        console.log('ALTER TABLE detections ADD COLUMN IF NOT EXISTS frame_metadata JSONB;');
        console.log('CREATE INDEX IF NOT EXISTS idx_detections_has_jpeg ON detections(detection_id) WHERE detection_frame_jpeg IS NOT NULL;');
        console.log('');
        console.log('🔧 For now, let\'s test with the current schema and add binary JPEG support to the API...');

    } catch (error) {
        console.error('❌ Migration error:', error.message);
    }
}

runMigration(); 