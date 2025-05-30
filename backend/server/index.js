const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors()); // enable cors
app.use(helmet()); // secure headers
app.use(express.json()); // parse json bodies in the request

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'ARCIS Server is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});




