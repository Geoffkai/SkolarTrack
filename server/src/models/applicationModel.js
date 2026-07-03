const pool = require("../config/db");

async function getApplicationsByStudent(studentId) {
  const result = await pool.query(
    `
    SELECT * FROM applications WHERE student_id = $1`,
    [studentId],
  );
  return result.rows;
}

async function createApplication(
  studentId,
  scholarshipId,
  status = "interested",
  notes,
) {
  const result = await pool.query(
    `INSERT INTO applications(student_id, scholarship_id, status, notes)
    VALUES ($1, $2, $3, $4)
    RETURNING *`,
    [studentId, scholarshipId, status, notes],
  );
  return result.rows[0];
}

// TODO: Fix this part
async function updateApplication(studentId, scholarshipId, status, notes) {
  const result = await pool.query(
    `UPDATE applications SET status = $1, notes = $2 
    WHERE student_id = $3 AND scholarship_id = $4
    RETURNING *`,
    [status, notes, studentId, scholarshipId],
  );
  return result.rows[0];
}
