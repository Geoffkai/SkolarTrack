const pool = require("../config/db");

async function getApplicationsByStudent(studentId) {
  const result = await pool.query(
    `
    SELECT a.id, a.scholarship_id, a.status AS application_status, a.notes, a.updated_at,
    s.title, s.organization, s.description, s.amount, s.slots, s.requirements, s.deadline, s.status AS scholarship_status
    FROM applications AS a
    JOIN scholarships AS s
    ON a.scholarship_id = s.id
    WHERE a.student_id = $1
    ORDER BY a.updated_at DESC`,
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

async function updateApplication(id, studentId, status, notes) {
  const result = await pool.query(
    // DEFAULT NOW() only fires on INSERT — on UPDATE the timestamp has to be set by hand
    `UPDATE applications SET status = $1, notes = $2, updated_at = NOW()
    WHERE id = $3 AND student_id = $4
    RETURNING *`,
    [status, notes, id, studentId],
  );
  return result.rows[0];
}

async function deleteApplication(id, studentId) {
  const result = await pool.query(
    `DELETE FROM applications WHERE id = $1 AND student_id = $2`,
    [id, studentId],
  );
  return result.rowCount;
}

module.exports = {
  getApplicationsByStudent,
  createApplication,
  updateApplication,
  deleteApplication,
};
