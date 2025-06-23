-- Prevent frame_url conflicts with base64 data
-- This trigger ensures only ONE image storage method is used per detection

CREATE OR REPLACE FUNCTION prevent_frame_url_conflicts()
RETURNS TRIGGER AS $$
BEGIN
    -- If detection_frame_data (base64) is being set, clear frame_url
    IF NEW.detection_frame_data IS NOT NULL AND NEW.detection_frame_data != '' THEN
        NEW.frame_url := NULL;
        RAISE NOTICE 'Cleared frame_url because detection_frame_data is present for detection_id %', NEW.detection_id;
    END IF;
    
    -- If detection_frame_jpeg (binary) is being set, clear frame_url
    IF NEW.detection_frame_jpeg IS NOT NULL THEN
        NEW.frame_url := NULL;
        RAISE NOTICE 'Cleared frame_url because detection_frame_jpeg is present for detection_id %', NEW.detection_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT and UPDATE
DROP TRIGGER IF EXISTS trigger_prevent_frame_url_conflicts ON detections;
CREATE TRIGGER trigger_prevent_frame_url_conflicts
    BEFORE INSERT OR UPDATE ON detections
    FOR EACH ROW
    EXECUTE FUNCTION prevent_frame_url_conflicts();

-- Clean up existing conflicts (run once)
UPDATE detections 
SET frame_url = NULL 
WHERE frame_url IS NOT NULL 
  AND (detection_frame_data IS NOT NULL OR detection_frame_jpeg IS NOT NULL);

-- Verify the cleanup
SELECT 
    COUNT(*) as total_detections,
    COUNT(CASE WHEN frame_url IS NOT NULL THEN 1 END) as has_frame_url,
    COUNT(CASE WHEN detection_frame_data IS NOT NULL THEN 1 END) as has_base64,
    COUNT(CASE WHEN detection_frame_jpeg IS NOT NULL THEN 1 END) as has_binary_jpeg,
    COUNT(CASE WHEN frame_url IS NOT NULL AND (detection_frame_data IS NOT NULL OR detection_frame_jpeg IS NOT NULL) THEN 1 END) as conflicts
FROM detections; 