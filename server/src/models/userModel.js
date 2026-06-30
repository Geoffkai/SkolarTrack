const pool = require("../config/db"); // the ONE shared pool

// READ - find a single user by email;
async function findUserByEmail(email) {
  const result = await pool.query(
    `SELECT * FROM users 
    WHERE email = $1`,
    [email],
  );
  return result.rows[0];
}

// CREATE - insert a new user, return the created row
async function createUser(email, passwordHash, role, name, course, school) {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, role, name, course, school) 
    VALUES ($1, $2, $3, $4, $5, $6) 
    RETURNING id, email, role, name, course, school, created_at`,
    [email, passwordHash, role, name, course, school],
  );
  return result.rows[0];
}

module.exports = { findUserByEmail, createUser };
