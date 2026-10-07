const pool = require("../config/db"); // the ONE shared pool

// READ - find a single user by email;
async function findUserByEmail(email) {
  const result = await pool.query(
    // LOWER() on both sides: Juan@up.edu.ph and juan@up.edu.ph are the same mailbox,
    // so they must be the same account (also matches rows saved before emails were lowercased)
    `SELECT * FROM users
    WHERE LOWER(email) = LOWER($1)
    ORDER BY id
    LIMIT 1`, // $1 = safe placeholder (anti sql injection)
    [email],
  );
  return result.rows[0]; // the one user, it will return undefined if not found
}

// CREATE - insert a new user, return the created row
async function createUser(email, passwordHash, role, name, course, school) {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, role, name, course, school) 
    VALUES ($1, $2, $3, $4, $5, $6) 
    RETURNING id, email, role, name, course, school, created_at`,
    [email, passwordHash, role, name, course, school],
  );
  return result.rows[0]; // the newly created user
}

module.exports = { findUserByEmail, createUser };
