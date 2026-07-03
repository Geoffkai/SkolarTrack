require("dotenv").config();

// imports
const express = require("express");
const authRoutes = require("./routes/authRoutes");
const pool = require("./config/db");
const scholarshipRoutes = require("./routes/scholarshipRoutes");

// app + middleware
const app = express();
app.use(express.json());

// routes
app.use("/auth", authRoutes);
app.use("/scholarships", scholarshipRoutes);

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

module.exports = app;
