-- Migration: Switch from base64 frame data to file storage URLs
-- Date: 2024-12-19
-- Purpose: Improve performance by storing image files instead of base64 data

-- Add new frame_url column
ALTER TABLE detections 
ADD COLUMN frame_url TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_detections_frame_url ON detections(frame_url);

-- Update existing records with base64 data to indicate they need migration
UPDATE detections 
SET frame_url = 'legacy_base64_data' 
WHERE detection_frame_data IS NOT NULL 
  AND detection_frame_data != '' 
  AND frame_url IS NULL;

-- Optional: Comment out the line below if you want to keep base64 data temporarily
-- ALTER TABLE detections DROP COLUMN detection_frame_data;

-- Add comments for documentation
COMMENT ON COLUMN detections.frame_url IS 'URL path to the detection frame image file (replaces base64 detection_frame_data)';

-- Show migration status
SELECT 
    COUNT(*) as total_detections,
    COUNT(detection_frame_data) as with_base64_data,
    COUNT(frame_url) as with_frame_url,
    COUNT(CASE WHEN frame_url = 'legacy_base64_data' THEN 1 END) as needs_migration
FROM detections; 