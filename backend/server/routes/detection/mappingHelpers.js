/**
 * Map Jetson AI model classes to our standard weapon types
 * @param {string|number} objectClass - Object class from Jetson model
 * @param {string} label - Object label from Jetson model
 * @returns {string|null} Standardized weapon type or null
 */
function mapJetsonClassToWeaponType(objectClass, label) {
    const mappings = {
        'weapon': 'weapon',
        'pistol': 'Pistol',
        'gun': 'Pistol',
        'firearm': 'Pistol',
        'rifle': 'rifle',
        'knife': 'Knife',
        'blade': 'Knife',
        'sword': 'Knife'
    };

    // Handle numeric class IDs (common in YOLO models)
    const classIdMappings = {
        0: 'weapon',
        1: 'Pistol',
        2: 'rifle',
        3: 'Knife'
    };

    // Check numeric class ID first
    if (typeof objectClass === 'number' && classIdMappings[objectClass]) {
        return classIdMappings[objectClass];
    }

    // Check both class and label as strings
    const lowerClass = objectClass ? objectClass.toString().toLowerCase() : '';
    const lowerLabel = label ? label.toString().toLowerCase() : '';

    return mappings[lowerClass] || mappings[lowerLabel] || null;
}

/**
 * Map Google Cloud Vision descriptions to our standard weapon types
 * @param {string} description - Description from Google Cloud Vision
 * @returns {string|null} Standardized weapon type or null
 */
function mapCloudVisionToWeaponType(description) {
    const desc = description.toLowerCase();

    if (desc.includes('pistol') || desc.includes('handgun') || desc.includes('gun')) {
        return 'Pistol';
    }
    if (desc.includes('rifle') || desc.includes('assault')) {
        return 'rifle';
    }
    if (desc.includes('knife') || desc.includes('blade') || desc.includes('sword')) {
        return 'Knife';
    }
    if (desc.includes('weapon') || desc.includes('firearm')) {
        return 'weapon';
    }

    return null; // Not a weapon
}

/**
 * Convert Jetson detection format to standardized format
 * @param {Object} jetsonDetection - Detection from Jetson device
 * @param {string} deviceId - Device identifier
 * @param {string} frame - Base64 encoded frame data
 * @param {Object} systemMetrics - System performance metrics
 * @param {string} timestamp - Detection timestamp
 * @returns {Object} Standardized detection object
 */
function convertJetsonToStandardFormat(jetsonDetection, deviceId, frame, systemMetrics, timestamp) {
    return {
        device_id: deviceId,
        object_type: mapJetsonClassToWeaponType(jetsonDetection.class, jetsonDetection.label),
        confidence: jetsonDetection.confidence,
        bounding_box: {
            x: jetsonDetection.bbox[0],
            y: jetsonDetection.bbox[1],
            width: jetsonDetection.bbox[2],
            height: jetsonDetection.bbox[3]
        },
        image_path: `/jetson/frames/${deviceId}_${Date.now()}.jpg`,
        metadata: {
            device_type: 'jetson_nano',
            original_class: jetsonDetection.class,
            original_label: jetsonDetection.label,
            system_metrics: systemMetrics,
            original_timestamp: timestamp,
            frame_data: frame
        }
    };
}

/**
 * Convert Google Cloud Vision result to standardized format
 * @param {Object} cloudVisionResult - Result from Google Cloud Vision
 * @param {string} deviceId - Device identifier
 * @param {Object} systemMetrics - System performance metrics
 * @param {string} timestamp - Detection timestamp
 * @returns {Object} Standardized detection object
 */
function convertCloudVisionToStandardFormat(cloudVisionResult, deviceId, systemMetrics, timestamp) {
    return {
        device_id: deviceId,
        object_type: mapCloudVisionToWeaponType(cloudVisionResult.description),
        confidence: cloudVisionResult.score,
        bounding_box: {
            x: Math.min(...cloudVisionResult.boundingPoly.vertices.map(v => v.x)),
            y: Math.min(...cloudVisionResult.boundingPoly.vertices.map(v => v.y)),
            width: Math.max(...cloudVisionResult.boundingPoly.vertices.map(v => v.x)) - Math.min(...cloudVisionResult.boundingPoly.vertices.map(v => v.x)),
            height: Math.max(...cloudVisionResult.boundingPoly.vertices.map(v => v.y)) - Math.min(...cloudVisionResult.boundingPoly.vertices.map(v => v.y))
        },
        image_path: `/raspberry/frames/${deviceId}_${Date.now()}.jpg`,
        metadata: {
            device_type: 'raspberry_pi',
            cloud_vision_description: cloudVisionResult.description,
            bounding_poly: cloudVisionResult.boundingPoly,
            system_metrics: systemMetrics,
            original_timestamp: timestamp,
            storage_method: 'binary_jpeg_database'
        }
    };
}

/**
 * Format frame data as proper data URL for frontend display
 * @param {string} frame - Base64 frame data
 * @returns {string|null} Formatted data URL or null
 */
function formatFrameDataUrl(frame) {
    if (!frame) return null;

    // Check if frame already has data URL prefix
    if (frame.startsWith('data:image/')) {
        return frame;
    }

    // Add proper data URL prefix for JPEG
    return `data:image/jpeg;base64,${frame}`;
}

/**
 * Extract device information from various sources
 * @param {Object} requestBody - Request body containing device info
 * @param {Object} parsedMetadata - Parsed metadata object
 * @param {Object} systemMetrics - System metrics data
 * @param {string} fallbackDeviceId - Fallback device ID
 * @returns {Object} Extracted device information
 */
function extractDeviceInfo(requestBody, parsedMetadata = {}, systemMetrics = {}, fallbackDeviceId = '1') {
    return {
        deviceId: requestBody.device_id || parsedMetadata.device_id || systemMetrics.device_id || fallbackDeviceId,
        deviceName: requestBody.device_name || parsedMetadata.device_name || systemMetrics.device_name || 'Unknown Device',
        deviceType: requestBody.device_type || parsedMetadata.device_type || systemMetrics.device_type || 'unknown'
    };
}

module.exports = {
    mapJetsonClassToWeaponType,
    mapCloudVisionToWeaponType,
    convertJetsonToStandardFormat,
    convertCloudVisionToStandardFormat,
    formatFrameDataUrl,
    extractDeviceInfo
};
