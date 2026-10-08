// Boots the REAL Express app against an in-memory Postgres (PGlite), so the suite
// runs the project's actual SQL, constraints and middleware without ever touching Neon.
const fs = require("fs");
const path = require("path");

// Must be set BEFORE the app is required: config is read once, at load time.
// dotenv never overrides a variable that already exists, so these win over server/.env —
// which is what guarantees a test run can never reach the real database.
function setTestEnv(overrides = {}) {
  Object.assign(
    process.env,
    {
      NODE_ENV: "test",
      DATABASE_URL: "postgres://test:test@127.0.0.1:1/never-used",
      JWT_SECRET: "test-only-secret-that-is-long-enough-to-pass-the-length-check",
      JWT_EXPIRES_IN: "",
      CORS_ORIGINS: "http://localhost:5173, https://skolar-track.vercel.app",
      AUTH_RATE_LIMIT_MAX: "1000",
    },
    overrides,
  );
}

async function createTestApp(envOverrides) {
  setTestEnv(envOverrides);

  const { PGlite } = require("@electric-sql/pglite");
  const jwt = require("jsonwebtoken");
  const request = require("supertest");
  const pool = require("../../src/config/db");
  const app = require("../../src/app");

  const db = new PGlite();
  await db.exec(
    fs.readFileSync(path.join(__dirname, "../../db/schema.sql"), "utf8"),
  );

  // Same parser override config/db.js applies to the real driver: DATE stays a string.
  const parsers = { 1082: (value) => value };

  // The models only ever call pool.query(text, params), so swapping that one method
  // redirects every query in the app to the in-memory database.
  pool.query = async (text, params) => {
    const result = await db.query(text, params, { parsers });
    return {
      rows: result.rows,
      rowCount: result.affectedRows || result.rows.length,
    };
  };

  async function reset() {
    await db.exec(
      "TRUNCATE applications, scholarships, users RESTART IDENTITY CASCADE",
    );
  }

  // Seeds a user straight into the table (skipping bcrypt keeps the suite fast)
  // and hands back a token shaped exactly like the one /auth/login issues.
  async function createUser(overrides = {}) {
    const user = {
      email: `user${Math.random().toString(36).slice(2)}@example.com`,
      role: "student",
      name: "Test User",
      course: null,
      school: null,
      ...overrides,
    };
    const { rows } = await db.query(
      `INSERT INTO users (email, password_hash, role, name, course, school)
       VALUES ($1, 'not-a-real-hash', $2, $3, $4, $5) RETURNING *`,
      [user.email, user.role, user.name, user.course, user.school],
    );
    const token = jwt.sign(
      { userId: rows[0].id, role: rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );
    return { ...rows[0], token };
  }

  async function createScholarship(adminId, overrides = {}) {
    const scholarship = {
      title: "DOST-SEI Undergraduate Scholarship",
      organization: "DOST",
      description: "For STEM students",
      amount: 40000,
      slots: 100,
      requirements: "Grades, ITR",
      deadline: "2099-12-31",
      status: "open",
      ...overrides,
    };
    const { rows } = await db.query(
      `INSERT INTO scholarships
         (posted_by, title, organization, description, amount, slots, requirements, deadline, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        adminId,
        scholarship.title,
        scholarship.organization,
        scholarship.description,
        scholarship.amount,
        scholarship.slots,
        scholarship.requirements,
        scholarship.deadline,
        scholarship.status,
      ],
      { parsers },
    );
    return rows[0];
  }

  async function createApplication(studentId, scholarshipId, overrides = {}) {
    const application = { status: "interested", notes: null, ...overrides };
    const { rows } = await db.query(
      `INSERT INTO applications (student_id, scholarship_id, status, notes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [studentId, scholarshipId, application.status, application.notes],
    );
    return rows[0];
  }

  // A scholarship the student typed in themselves: a tracker row with no listing behind it.
  async function createPersonalApplication(studentId, overrides = {}) {
    const entry = {
      title: "SM Foundation College Scholarship",
      organization: "SM Foundation",
      amount: 15000,
      deadline: "2099-06-30",
      status: "interested",
      notes: null,
      ...overrides,
    };
    const { rows } = await db.query(
      `INSERT INTO applications
         (student_id, personal_title, personal_organization, personal_amount, personal_deadline, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        studentId,
        entry.title,
        entry.organization,
        entry.amount,
        entry.deadline,
        entry.status,
        entry.notes,
      ],
      { parsers },
    );
    return rows[0];
  }

  // Runs raw SQL so a test can assert on what actually landed in the table.
  async function query(text, params) {
    return (await db.query(text, params, { parsers })).rows;
  }

  const bearer = (user) => ({ Authorization: `Bearer ${user.token}` });

  return {
    api: request(app),
    reset,
    close: () => db.close(),
    createUser,
    createScholarship,
    createApplication,
    createPersonalApplication,
    query,
    bearer,
  };
}

module.exports = { createTestApp, setTestEnv };
