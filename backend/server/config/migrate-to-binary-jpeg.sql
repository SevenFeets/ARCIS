-- Migration: Add binary JPEG storage to detections table
-- This allows storing actual JPEG binary data directly in the database

-- Add new column for binary JPEG data
ALTER TABLE detections ADD COLUMN IF NOT EXISTS detection_frame_jpeg BYTEA;

-- Add metadata column for image info
ALTER TABLE detections ADD COLUMN IF NOT EXISTS frame_metadata JSONB;

-- Create index for better performance when querying images
CREATE INDEX IF NOT EXISTS idx_detections_has_jpeg ON detections(detection_id) WHERE detection_frame_jpeg IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN detections.detection_frame_jpeg IS 'Binary JPEG image data from Jetson/Pi devices';
COMMENT ON COLUMN detections.frame_metadata IS 'Image metadata: width, height, size, format, etc.';

-- Update the view to include the new fields
CREATE OR REPLACE VIEW active_weapon_threats AS
SELECT 
    d.detection_id,
    d.timestamp,
    d.object_type,
    d.threat_level,
    d.confidence,
    d.bounding_box,
    d.detection_frame_data, -- Legacy base64 field
    d.detection_frame_jpeg, -- New binary JPEG field
    d.frame_metadata,
    CASE 
        WHEN d.detection_frame_jpeg IS NOT NULL THEN 'binary_jpeg'
        WHEN d.detection_frame_data IS NOT NULL THEN 'base64'
        ELSE 'none'
    END AS frame_format,
    d.metadata,
    d.system_metrics
FROM detections d
WHERE d.threat_level >= 6
ORDER BY d.threat_level DESC, d.timestamp DESC; 