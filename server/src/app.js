require("dotenv").config();

// imports
const express = require("express");
const authRoutes = require("./routes/authRoutes");
const pool = require("./config/db");
const scholarshipRoutes = require("./routes/scholarshipRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const cors = require("cors"); // Cross-Origin Resourse Sharing, basically its like a controller which allows or refuse request from different "origin"

// app + middleware
const app = express();
app.use(express.json());
// is middleware that intercepts that preflight check and responds with the right header — Access-Control-Allow-Origin
// need to remove later
app.use(cors());

// routes
app.use("/auth", authRoutes);
app.use("/scholarships", scholarshipRoutes);
app.use("/applications", applicationRoutes);

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

module.exports = app;
