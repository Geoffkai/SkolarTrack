const { Pool } = require("pg");
const types = require("pg").types;
const config = require("./env");

// DATE columns (OID 1082) should stay as plain strings —
// never auto-converted into JS Date objects, since that silently
// attaches a timezone interpretation to values that were never
// meant to have one (see: the deadline bug).
types.setTypeParser(1082, (value) => value);

// TIMESTAMP columns (OID 1114) are the mirror-image problem. They store no timezone, and
// the database fills them with NOW() in UTC — but the driver reads them back as if they were
// in THIS machine's timezone. On a laptop in Manila that makes every created_at/updated_at
// 8 hours early. Appending "Z" says what the value actually is: UTC.
types.setTypeParser(
  1114,
  (value) => new Date(`${value.replace(" ", "T")}Z`),
);

const pool = new Pool({
  connectionString: config.databaseUrl,
});

// An idle connection can be dropped by the database (Neon suspends when unused).
// Without a listener that 'error' event is unhandled and takes the whole process down;
// the pool already discards the dead client, so logging is all that's needed.
pool.on("error", (error) => {
  console.error("unexpected error on idle database client: ", error.message);
});

module.exports = pool;
