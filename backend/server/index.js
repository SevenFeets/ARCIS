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
app.get("/api/health", (req, res) => {
    res.json({ message: "Server is running!", timestamp: new Date().toISOString() });
});

// Use detection routes
app.use('/api/detections', detectionsRouter);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});




