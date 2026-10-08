const config = require("./src/config/env");
const app = require("./src/app");
const pool = require("./src/config/db");

const server = app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

// The host sends SIGTERM on every deploy and restart. Stop taking new requests,
// let the in-flight ones finish, then hand the database connections back.
function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
  // If something refuses to finish, don't hang the deploy forever.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
