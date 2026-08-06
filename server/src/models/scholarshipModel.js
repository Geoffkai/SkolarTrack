const pool = require("../config/db");

// Get the applicants who applied to specific scholarship
async function getApplicantsByScholarshipId(scholarshipId, adminId) {
  const result = await pool.query(
    `SELECT applications.id, applications.status, applications.notes, users.name, users.email 
    FROM applications
    JOIN users ON applications.student_id = users.id
    JOIN scholarships ON applications.scholarship_id = scholarships.id
    WHERE scholarships.id = $1 AND scholarships.posted_by = $2`,
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
  const result = await pool.query("SELECT * FROM scholarships;");
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

async function updateScholarship(
  id,
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
        WHERE id = $9
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
    ],
  );
  return result.rows[0];
}

async function closeScholarship(id) {
  const result = await pool.query(
    `
        UPDATE scholarships SET status = 'closed' WHERE id = $1
        RETURNING *;
    `,
    [id],
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
