require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());

const pool = require("./config/db");

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

module.exports = app;
