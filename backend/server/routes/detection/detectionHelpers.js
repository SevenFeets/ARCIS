const fs = require('fs');

/**
 * Calculate threat level based on weapon type and confidence
 * @param {string} weaponType - Type of weapon detected
 * @param {number} confidence - Detection confidence (0-1)
 * @returns {number} Threat level (1-10)
 */
function calculateThreatLevel(weaponType, confidence) {
    const baseThreatLevels = {
        'Knife': 6,        // Medium-high threat
        'Pistol': 8,       // High threat
        'weapon': 7,       // High threat (generic weapon)
        'rifle': 10        // Maximum threat
    };

    const baseLevel = baseThreatLevels[weaponType] || 5;
    return Math.min(10, Math.round(baseLevel * confidence));
}

/**
 * Check if detected object is a weapon
 * @param {string} objectType - Type of detected object
 * @returns {boolean} True if object is a weapon
 */
function isWeaponDetection(objectType) {
    return objectType !== null && ['Knife', 'Pistol', 'weapon', 'rifle'].includes(objectType);
}

/**
 * Determine device type from metadata
 * @param {Object} metadata - Device metadata
 * @returns {string} Human-readable device type
 */
function getDeviceType(metadata) {
    if (metadata.device_type === 'jetson_nano') return 'Jetson Nano';
    if (metadata.device_type === 'raspberry_pi') return 'Raspberry Pi';
    if (metadata.device_id && metadata.device_id.includes('jetson')) return 'Jetson Nano';
    if (metadata.device_id && metadata.device_id.includes('raspberry')) return 'Raspberry Pi';
    return 'Unknown Device';
}

/**
 * Format detection data for frontend consumption
 * @param {Object} detection - Raw detection data from database
 * @returns {Object} Formatted detection object
 */
function formatDetectionForFrontend(detection) {
    return {
        id: detection.detection_id,
        detection_id: detection.detection_id,
        weapon_type: detection.object_type || 'Unknown',
        confidence: detection.confidence || 0,
        threat_level: detection.threat_level || 1,
        location: 'Unknown',
        timestamp: detection.timestamp || new Date().toISOString(),
        device: detection.metadata?.device_name || 'ARCIS Device',
        device_id: detection.metadata?.device_id || '1',
        bounding_box: detection.bounding_box || { x: 0, y: 0, width: 100, height: 100 },
        comments: [],
        metadata: detection.metadata || {},
        detection_frame_data: detection.detection_frame_data,
        frame_url: detection.frame_url,
        has_binary_jpeg: !!detection.detection_frame_jpeg,
        frame_metadata: detection.frame_metadata,
        jpeg_endpoint: detection.detection_frame_jpeg ? `/detections/${detection.detection_id}/jpeg` : null
    };
}

/**
 * Validate required detection fields
 * @param {Object} body - Request body
 * @param {Array} requiredFields - List of required field names
 * @returns {Object} Validation result with success flag and missing fields
 */
function validateRequiredFields(body, requiredFields) {
    const missing = requiredFields.filter(field => !body[field]);
    return {
        isValid: missing.length === 0,
        missingFields: missing,
        receivedFields: Object.keys(body)
    };
}

/**
 * Validate confidence value
 * @param {*} confidence - Confidence value to validate
 * @returns {Object} Validation result
 */
function validateConfidence(confidence) {
    const confValue = parseFloat(confidence);
    const isValid = !isNaN(confValue) && confValue >= 0 && confValue <= 1;

    return {
        isValid,
        value: isValid ? confValue : null,
        error: isValid ? null : 'Confidence must be a number between 0.0 and 1.0'
    };
}

/**
 * Validate weapon type
 * @param {string} weaponType - Weapon type to validate
 * @returns {Object} Validation result
 */
function validateWeaponType(weaponType) {
    const validWeaponTypes = ['Knife', 'Pistol', 'weapon', 'rifle'];
    const isValid = validWeaponTypes.includes(weaponType);

    return {
        isValid,
        error: isValid ? null : `Invalid weapon type: ${weaponType}. Must be one of: ${validWeaponTypes.join(', ')}`,
        validTypes: validWeaponTypes
    };
}

/**
 * Parse JSON string safely
 * @param {*} data - Data to parse (string or object)
 * @param {*} fallback - Fallback value if parsing fails
 * @returns {*} Parsed data or fallback
 */
function safeJsonParse(data, fallback = {}) {
    if (typeof data === 'string') {
        try {
            return JSON.parse(data);
        } catch (error) {
            console.warn('Failed to parse JSON:', error.message);
            return fallback;
        }
    }
    return data || fallback;
}

/**
 * Create standardized API response
 * @param {boolean} success - Success status
 * @param {*} data - Response data
 * @param {string} message - Response message
 * @param {Object} additional - Additional response fields
 * @returns {Object} Standardized response object
 */
function createApiResponse(success, data = null, message = '', additional = {}) {
    const response = {
        success,
        ...additional
    };

    if (data !== null) {
        response.data = data;
    }

    if (message) {
        response.message = message;
    }

    return response;
}

/**
 * Create error response
 * @param {string} error - Error message
 * @param {string} code - Error code
 * @param {Object} details - Additional error details
 * @returns {Object} Error response object
 */
function createErrorResponse(error, code = null, details = null) {
    const response = {
        success: false,
        error
    };

    if (code) {
        response.code = code;
    }

    if (details) {
        response.details = details;
    }

    return response;
}

/**
 * Clean up uploaded file
 * @param {string} filePath - Path to file to delete
 */
function cleanupFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Cleaned up file: ${filePath}`);
        }
    } catch (error) {
        console.warn('File cleanup warning:', error.message);
    }
}

module.exports = {
    calculateThreatLevel,
    isWeaponDetection,
    getDeviceType,
    formatDetectionForFrontend,
    validateRequiredFields,
    validateConfidence,
    validateWeaponType,
    safeJsonParse,
    createApiResponse,
    createErrorResponse,
    cleanupFile
};
