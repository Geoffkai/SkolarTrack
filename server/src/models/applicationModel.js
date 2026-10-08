const pool = require("../config/db");

async function getApplicationsByStudent(studentId) {
  const result = await pool.query(
    // LEFT JOIN: a personal entry has no listing to join to, and a plain JOIN would drop it.
    // COALESCE then fills each card field from whichever side has it, so both kinds of
    // entry come back in one shape.
    `
    SELECT a.id, a.scholarship_id, a.status AS application_status, a.notes, a.updated_at,
    (a.scholarship_id IS NULL) AS is_personal,
    COALESCE(s.title, a.personal_title) AS title,
    COALESCE(s.organization, a.personal_organization) AS organization,
    COALESCE(s.amount, a.personal_amount) AS amount,
    COALESCE(s.deadline, a.personal_deadline) AS deadline,
    s.description, s.slots, s.requirements, s.status AS scholarship_status
    FROM applications AS a
    LEFT JOIN scholarships AS s
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

async function countPersonalApplications(studentId) {
  const result = await pool.query(
    // COUNT comes back as a bigint, which the driver hands over as a string — hence ::int
    `SELECT COUNT(*)::int AS count FROM applications
    WHERE student_id = $1 AND scholarship_id IS NULL`,
    [studentId],
  );
  return result.rows[0].count;
}

// A scholarship the student added themselves: scholarship_id stays NULL and the
// details live on the row itself.
async function createPersonalApplication(
  studentId,
  title,
  organization,
  amount,
  deadline,
  notes,
) {
  const result = await pool.query(
    `INSERT INTO applications(student_id, personal_title, personal_organization, personal_amount, personal_deadline, notes)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [studentId, title, organization, amount, deadline, notes],
  );
  return result.rows[0];
}

// scholarship_id IS NULL keeps this away from saved listings: their details belong to the
// admin who posted them, so here they match nothing — same as a row that isn't yours.
async function updatePersonalApplication(
  id,
  studentId,
  title,
  organization,
  amount,
  deadline,
) {
  const result = await pool.query(
    `UPDATE applications
    SET personal_title = $1, personal_organization = $2, personal_amount = $3, personal_deadline = $4, updated_at = NOW()
    WHERE id = $5 AND student_id = $6 AND scholarship_id IS NULL
    RETURNING *`,
    [title, organization, amount, deadline, id, studentId],
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
  countPersonalApplications,
  createPersonalApplication,
  updatePersonalApplication,
  updateApplication,
  deleteApplication,
};
