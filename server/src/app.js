// imports
const config = require("./config/env"); // first: validates the environment before anything else loads
const express = require("express");
const helmet = require("helmet"); // sets a batch of security response headers
const cors = require("cors"); // Cross-Origin Resourse Sharing, basically its like a controller which allows or refuse request from different "origin"
const authRoutes = require("./routes/authRoutes");
const pool = require("./config/db");
const scholarshipRoutes = require("./routes/scholarshipRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

// app + middleware
const app = express();

// The host (Render) puts a proxy in front of the app, so the socket's address is the
// proxy's, not the visitor's. This tells Express to read the real one from X-Forwarded-For.
app.set("trust proxy", config.trustProxy);

app.use(helmet());
// is middleware that intercepts that preflight check and responds with the right header — Access-Control-Allow-Origin
// Comes before the body parser and routes so that even error responses carry the CORS header —
// otherwise the browser reports "blocked by CORS" and hides the real error message.
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json({ limit: "50kb" }));

// routes
app.use("/auth", authRoutes);
app.use("/scholarships", scholarshipRoutes);
app.use("/applications", applicationRoutes);

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (error) {
    // the client only needs "disconnected"; the reason goes to the log, where it's the
    // first thing we'd need when the host says the service is unhealthy
    console.error("health check failed: ", error.message);
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

// must stay last: these only run when nothing above handled the request
app.use(notFound);
app.use(errorHandler);

module.exports = app;
