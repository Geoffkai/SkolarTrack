const pool = require("../config/db");

// Get the applicants who applied to specific scholarship
async function getApplicantsByScholarshipId(scholarshipId, adminId) {
  const result = await pool.query(
    // columns are listed one by one on purpose: SELECT users.* would also ship password_hash.
    // applications.notes is left out too — those are the student's private notes to
    // themselves, and the coordinator they're applying to has no business reading them.
    `SELECT applications.id, applications.status, applications.updated_at,
      users.name, users.email, users.school, users.course
    FROM applications
    JOIN users ON applications.student_id = users.id
    JOIN scholarships ON applications.scholarship_id = scholarships.id
    WHERE scholarships.id = $1 AND scholarships.posted_by = $2
    ORDER BY applications.updated_at DESC`,
    [scholarshipId, adminId],
  );
  return result.rows;
}

// Get the scholarships posted by the specific admin, with a count of applicants each.
// LEFT JOIN so scholarships with zero applicants still appear (count = 0).
async function getScholarshipsByAdmin(adminId) {
  const result = await pool.query(
    `SELECT s.*, COUNT(a.id)::int AS applicant_count
    FROM scholarships s
    LEFT JOIN applications a ON a.scholarship_id = s.id
    WHERE s.posted_by = $1
    GROUP BY s.id
    ORDER BY s.created_at DESC`,
    [adminId],
  );
  return result.rows;
}

async function getAllScholarships() {
  // without ORDER BY, Postgres may return rows in a different order on every call
  const result = await pool.query(
    "SELECT * FROM scholarships ORDER BY deadline ASC, id ASC;",
  );
  return result.rows;
}

async function getScholarshipById(id) {
  const result = await pool.query(`SELECT * FROM scholarships WHERE id = $1;`, [
    id,
  ]);
  return result.rows[0];
}

async function createScholarship(
  postedBy,
  title,
  organization,
  description,
  amount,
  slots,
  requirements,
  deadline,
  status = "open",
) {
  const result = await pool.query(
    `
        INSERT INTO scholarships(posted_by, title, organization, description, amount, slots, requirements, deadline, status) 
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
        `,
    [
      postedBy,
      title,
      organization,
      description,
      amount,
      slots,
      requirements,
      deadline,
      status,
    ],
  );

  return result.rows[0];
}

// Ownership lives in the WHERE clause: if adminId didn't post this row, zero rows match,
// nothing is changed and undefined comes back — exactly like an id that doesn't exist.
async function updateScholarship(
  id,
  adminId,
  title,
  organization,
  description,
  amount,
  slots,
  requirements,
  deadline,
  status,
) {
  const result = await pool.query(
    `
        UPDATE scholarships SET title=$1, organization=$2, description=$3, amount=$4, slots=$5, requirements=$6, deadline=$7, status = $8
        WHERE id = $9 AND posted_by = $10
        RETURNING *;
    `,
    [
      title,
      organization,
      description,
      amount,
      slots,
      requirements,
      deadline,
      status,
      id,
      adminId,
    ],
  );
  return result.rows[0];
}

// Soft delete: the row is kept and only its status changes. Same ownership rule as above.
async function closeScholarship(id, adminId) {
  const result = await pool.query(
    `
        UPDATE scholarships SET status = 'closed' WHERE id = $1 AND posted_by = $2
        RETURNING *;
    `,
    [id, adminId],
  );
  return result.rows[0];
}

module.exports = {
  getApplicantsByScholarshipId,
  getAllScholarships,
  getScholarshipById,
  createScholarship,
  updateScholarship,
  closeScholarship,
  getScholarshipsByAdmin,
};
