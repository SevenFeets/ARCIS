const jwt = require('jsonwebtoken');
const { dbUtils } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'arcis-military-secret-key';

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user.user_id,
            username: user.username,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: '8h' } // 8-hour shifts
    );
};

// Verify JWT token
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Access denied. No valid token provided.',
                code: 'NO_TOKEN'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer '
        const decoded = jwt.verify(token, JWT_SECRET);

        // Get fresh user data
        const user = await dbUtils.users.findById(decoded.userId);

        if (!user || !user.is_active) {
            return res.status(401).json({
                error: 'Access denied. User account inactive.',
                code: 'INACTIVE_USER'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            error: 'Access denied. Invalid token.',
            code: 'INVALID_TOKEN'
        });
    }
};

// Role-based access control
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'NO_AUTH'
            });
        }

        const userRole = req.user.role;
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${userRole}`,
                code: 'INSUFFICIENT_ROLE'
            });
        }

        next();
    };
};

// Military clearance levels
const CLEARANCE_LEVELS = {
    'viewer': 1,
    'operator': 2,
    'analyst': 3,
    'commander': 4,
    'admin': 5
};

const requireClearance = (minLevel) => {
    return (req, res, next) => {
        const userLevel = CLEARANCE_LEVELS[req.user.role] || 0;

        if (userLevel < minLevel) {
            return res.status(403).json({
                error: `Insufficient clearance level. Required: ${minLevel}, Your level: ${userLevel}`,
                code: 'INSUFFICIENT_CLEARANCE'
            });
        }

        next();
    };
};

module.exports = {
    generateToken,
    verifyToken,
    requireRole,
    requireClearance,
    CLEARANCE_LEVELS
};
