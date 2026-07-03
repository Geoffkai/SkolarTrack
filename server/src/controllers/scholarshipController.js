const {
  getAllScholarships,
  getScholarshipById,
  createScholarship,
  updateScholarship,
  closeScholarship,
} = require("../models/scholarshipModel");

async function getAll(req, res) {
  try {
    const scholarships = await getAllScholarships();
    return res.status(200).json(scholarships);
  } catch (error) {
    console.error("getAll error: ", error);
    return res.status(500).json({ error: "something went wrong" });
  }
}

async function getOne(req, res) {
  try {
    const id = req.params.id;

    const scholarship = await getScholarshipById(id);

    if (!scholarship) {
      return res.status(404).json({ error: "scholarship does not exist" });
    }
    return res.status(200).json(scholarship);
  } catch (error) {
    console.error("searching error: ", error);
    return res.status(500).json({ error: "something went wrong" });
  }
}

async function create(req, res) {}
