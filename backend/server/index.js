const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");

app.use(cors()); // enable cors
app.use(helmet()); // secure headers
app.use(express.json()); // parse json bodies in the request

const app = express();
app.listen(5000, () => {
    console.log("Server is running on port 5000");
});




