const { rateLimit } = require("express-rate-limit");
const config = require("../config/env");

const WINDOW_MS = 15 * 60 * 1000;

const shared = {
  windowMs: WINDOW_MS,
  limit: config.authRateLimitMax,
  standardHeaders: "draft-8", // tells well-behaved clients how long to back off
  legacyHeaders: false,
  message: { error: "too many attempts, please try again in a few minutes" },
};

// Slows down password guessing. Only FAILED attempts count, so a whole class signing in
// from one campus Wi-Fi address (one shared IP) is never locked out by its own success.
const loginLimiter = rateLimit({ ...shared, skipSuccessfulRequests: true });

// Registration is the one write anyone can make without an account, so every
// attempt counts here — this caps how fast a script can mass-create accounts.
const registerLimiter = rateLimit(shared);

module.exports = { loginLimiter, registerLimiter };
