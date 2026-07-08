require("dotenv").config();
const { Pool } = require("pg");
const types = require("pg").types;

// DATE columns (OID 1082) should stay as plain strings —
// never auto-converted into JS Date objects, since that silently
// attaches a timezone interpretation to values that were never
// meant to have one (see: the deadline bug).
types.setTypeParser(1082, (value) => value);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool;
