const pool = require("../config/db");

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
) {
  const result = await pool.query(
    `
        UPDATE scholarships SET title=$1, organization=$2, description=$3, amount=$4, slots=$5, requirements=$6, deadline=$7 
        WHERE id = $8
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
  getAllScholarships,
  getScholarshipById,
  createScholarship,
  updateScholarship,
  closeScholarship,
};
