const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors()); // enable cors
app.use(helmet()); // secure headers
app.use(express.json()); // parse json bodies in the request

// Import routes
const detectionsRouter = require('./routes/detections');

// Routes
app.get("/", (req, res) => {
    res.json({
        message: "ARCIS Weapon Detection System API",
        version: "1.0.0",
        status: "active",
        endpoints: {
            health: "/api/health",
            detections: "/api/detections/all",
            threats: "/api/detections/threats",
            jetson: "/api/detections/jetson-detection",
            raspberry: "/api/detections/raspberry-detection"
        },
        timestamp: new Date().toISOString()
    });
});

app.get("/api/health", (req, res) => {
    res.json({ message: "Server is running!", timestamp: new Date().toISOString() });
});

// Use detection routes
app.use('/api/detections', detectionsRouter);

// Start server
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`Server is running on ${HOST}:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://${HOST}:${PORT}/api/health`);
});




