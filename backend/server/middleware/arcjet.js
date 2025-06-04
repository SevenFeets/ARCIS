// Simple fallback security middleware (no external service needed)
const rateLimit = require('express-rate-limit');

// Check if we have Arcjet configured
const ARCJET_ENABLED = process.env.ARCJET_KEY && process.env.ARCJET_KEY !== 'test-key';

let arcjetMiddleware;

if (ARCJET_ENABLED) {
    // Use real Arcjet if configured
    const arcjet = require("@arcjet/node");
    const { shield, tokenBucket, detectBot } = require("@arcjet/node");

    arcjetMiddleware = arcjet({
        key: process.env.ARCJET_KEY,
        characteristics: ["ip.src"],
        rules: [
            tokenBucket({
                mode: "LIVE",
                refillRate: 10,
                interval: 60,
                capacity: 100,
            }),
            detectBot({
                mode: "LIVE",
                allow: [],
            }),
            shield({
                mode: "LIVE",
            }),
        ],
    });
} else {
    // Fallback: Simple rate limiting with express-rate-limit
    console.log('⚠️  Using fallback rate limiting (Arcjet not configured)');

    arcjetMiddleware = rateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 100, // limit each IP to 100 requests per windowMs
        message: {
            error: 'Too many requests from this IP',
            code: 'RATE_LIMIT_EXCEEDED'
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
}

module.exports = arcjetMiddleware;