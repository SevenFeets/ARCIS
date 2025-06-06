const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array(),
            code: 'VALIDATION_ERROR'
        });
    }
    next();
};

// User validation
const validateUser = [
    body('username')
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),

    body('email')
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail(),

    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

    body('role')
        .optional()
        .isIn(['viewer', 'operator', 'analyst', 'commander', 'admin'])
        .withMessage('Role must be one of: viewer, operator, analyst, commander, admin'),

    handleValidationErrors
];

// Login validation
const validateLogin = [
    body('username')
        .notEmpty()
        .withMessage('Username is required'),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),

    handleValidationErrors
];

// Weapon detection validation
const validateDetection = [
    body('device_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Device ID must be a positive integer'),

    body('object_type')
        .isIn(['Knife', 'Pistol', 'weapon', 'rifle'])
        .withMessage('Object type must be one of: Knife, Pistol, weapon, rifle'),

    body('confidence')
        .isFloat({ min: 0, max: 1 })
        .withMessage('Confidence must be a number between 0 and 1'),

    body('bounding_box')
        .optional()
        .isObject()
        .withMessage('Bounding box must be an object'),

    body('bounding_box.x')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Bounding box x must be a non-negative number'),

    body('bounding_box.y')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Bounding box y must be a non-negative number'),

    body('bounding_box.width')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Bounding box width must be a positive number'),

    body('bounding_box.height')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Bounding box height must be a positive number'),

    body('threat_level')
        .optional()
        .isInt({ min: 0, max: 10 })
        .withMessage('Threat level must be an integer between 0 and 10'),

    body('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be an object'),

    handleValidationErrors
];

// Weapon alert validation
const validateAlert = [
    body('detection_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Detection ID must be a positive integer'),

    body('alert_type')
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage('Alert type must be between 1 and 50 characters'),

    body('severity')
        .isInt({ min: 1, max: 5 })
        .withMessage('Severity must be an integer between 1 and 5'),

    body('title')
        .isLength({ min: 1, max: 100 })
        .withMessage('Title must be between 1 and 100 characters'),

    body('description')
        .isLength({ min: 1, max: 500 })
        .withMessage('Description must be between 1 and 500 characters'),

    body('weapon_type')
        .optional()
        .isIn(['Knife', 'Pistol', 'weapon', 'rifle'])
        .withMessage('Weapon type must be one of: Knife, Pistol, weapon, rifle'),

    handleValidationErrors
];

// Device validation
const validateDevice = [
    body('device_name')
        .isLength({ min: 1, max: 100 })
        .withMessage('Device name must be between 1 and 100 characters'),

    body('device_type')
        .isIn(['jetson_nano', 'raspberry_pi', 'camera', 'sensor'])
        .withMessage('Device type must be one of: jetson_nano, raspberry_pi, camera, sensor'),

    body('ip_address')
        .optional()
        .isIP()
        .withMessage('Must be a valid IP address'),

    body('mac_address')
        .optional()
        .matches(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)
        .withMessage('Must be a valid MAC address'),

    body('configuration')
        .optional()
        .isObject()
        .withMessage('Configuration must be an object'),

    handleValidationErrors
];

// ID parameter validation
const validateId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID must be a positive integer'),

    handleValidationErrors
];

// Pagination validation
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

    query('weapon_type')
        .optional()
        .isIn(['Knife', 'Pistol', 'weapon', 'rifle'])
        .withMessage('Weapon type must be one of: Knife, Pistol, weapon, rifle'),

    query('threat_level')
        .optional()
        .isInt({ min: 0, max: 10 })
        .withMessage('Threat level must be between 0 and 10'),

    handleValidationErrors
];

// Session validation
const validateSession = [
    body('device_id')
        .isInt({ min: 1 })
        .withMessage('Device ID must be a positive integer'),

    body('settings')
        .optional()
        .isObject()
        .withMessage('Settings must be an object'),

    body('notes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Notes must be less than 500 characters'),

    handleValidationErrors
];

module.exports = {
    validateUser,
    validateLogin,
    validateDetection,
    validateAlert,
    validateDevice,
    validateId,
    validatePagination,
    validateSession,
    handleValidationErrors
};
