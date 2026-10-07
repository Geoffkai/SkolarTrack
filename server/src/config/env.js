// The ONE place environment variables are read and checked.
// Everything else imports this object instead of touching process.env, so a missing
// or mistyped variable stops the server at boot with a clear message — instead of
// surfacing later as a confusing 500 on some user's request.
require("dotenv").config({ quiet: true });

const REQUIRED = ["DATABASE_URL", "JWT_SECRET", "CORS_ORIGINS"];

const missing = REQUIRED.filter((name) => !process.env[name]);
if (missing.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missing.join(", ")}. ` +
      "Copy server/.env.example to server/.env and fill them in.",
  );
}

const isProduction = process.env.NODE_ENV === "production";

// A short secret can be brute-forced offline from a single captured token,
// letting an attacker mint their own admin tokens.
if (isProduction && process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters in production");
}

// "a.com, b.com" and "a.com,b.com" should mean the same thing.
const corsOrigins = process.env.CORS_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

module.exports = {
  isProduction,
  port: positiveInt(process.env.PORT, 3000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigins,
  // How many reverse proxies sit in front of the app (Render: at least 1).
  // Express needs this to read the real client IP, which the rate limiter keys on.
  trustProxy: positiveInt(process.env.TRUST_PROXY, 1),
  authRateLimitMax: positiveInt(process.env.AUTH_RATE_LIMIT_MAX, 30),
};
