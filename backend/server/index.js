const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: ['https://arcis-prod.vercel.app', 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true
})); // enable cors
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
})); // secure headers with cross-origin policy
app.use(express.json()); // parse json bodies in the request

// Import routes
const detectionsRouter = require('./routes/detections');

// Routes
app.get("/", (req, res) => {
    res.json({
        message: "🛡️ ARCIS Weapon Detection System API",
        version: "1.0.0",
        status: "✅ ACTIVE",
        description: "Advanced Real-time Comprehensive Intelligence System",
        endpoints: {
            health: "/api/health",
            detections: "/api/detections/all",
            threats: "/api/detections/threats",
            jetson: "/api/detections/jetson-detection",
            raspberry: "/api/detections/raspberry-detection"
        },
        deployment: {
            platform: "Railway",
            region: "EU West",
            environment: "Production"
        },
        timestamp: new Date().toISOString()
    });
});

// API root endpoint
app.get("/api", (req, res) => {
    res.json({
        message: "ARCIS API v1.0",
        status: "active",
        available_endpoints: [
            "GET /api/health",
            "GET /api/detections/all",
            "GET /api/detections/threats",
            "POST /api/detections/jetson-detection",
            "POST /api/detections/raspberry-detection"
        ]
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        message: "Server is running!",
        version: "2.1.0",
        features: ["binary_jpeg_support", "raspberry_pi_jpg_upload", "multi_storage_methods"],
        timestamp: new Date().toISOString()
    });
});

// Use detection routes
app.use('/api/detections', detectionsRouter);

// Start server
const PORT = process.env.PORT || 5000;
console.log('🚀 ARCIS Backend v2.1 - Binary JPEG Support Enabled');
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`🚀 ARCIS Server is running on ${HOST}:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://${HOST}:${PORT}/api/health`);
    console.log(`🛡️ ARCIS Weapon Detection System - Ready for global deployment!`);
});




