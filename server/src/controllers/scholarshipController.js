const {
  getAllScholarships,
  getScholarshipById,
  createScholarship,
  updateScholarship,
  closeScholarship,
  getApplicantsByScholarshipId,
  getScholarshipsByAdmin,
} = require("../models/scholarshipModel");
const { validateScholarship } = require("../utils/validation");

async function getAll(req, res) {
  try {
    const scholarships = await getAllScholarships();
    return res.status(200).json({ scholarships });
  } catch (error) {
    console.error("getAll error: ", error);
    return res.status(500).json({ error: "something went wrong" });
  }
}

async function getOne(req, res) {
  try {
    const id = req.params.id;

    const scholarship = await getScholarshipById(id);

    return !scholarship
      ? res.status(404).json({ error: "scholarship does not exist" })
      : res.status(200).json({ scholarship });
  } catch (error) {
    console.error("searching error: ", error);
    return res.status(500).json({ error: "something went wrong" });
  }
}

async function create(req, res) {
  try {
    const { userId } = req.user;

    // cleaned copy of the body: text trimmed, blank optional fields turned into null
    const { error, value } = validateScholarship(req.body);
    if (error) {
      return res.status(400).json({ error });
    }

    const scholarship = await createScholarship(
      userId,
      value.title,
      value.organization,
      value.description,
      value.amount,
      value.slots,
      value.requirements,
      value.deadline,
    );

    return res.status(201).json({ scholarship });
  } catch (error) {
    console.error("creating error: ", error);
    return res.status(500).json({ error: "something went wrong" });
  }
}

async function update(req, res) {
  try {
    const scholarshipId = req.params.id;
    const adminId = req.user.userId; // ownership id comes from the verified token, never trusted from req.body

    const { error, value } = validateScholarship(req.body, {
      requireStatus: true,
    });
    if (error) {
      return res.status(400).json({ error });
    }

    // the model only touches the row if this admin posted it
    const result = await updateScholarship(
      scholarshipId,
      adminId,
      value.title,
      value.organization,
      value.description,
      value.amount,
      value.slots,
      value.requirements,
      value.deadline,
      value.status,
    );

    // it doesn't exist, or it exists but belongs to another admin — one vague 404 either way
    if (!result) {
      return res.status(404).json({ error: "no scholarship found" });
    }

    return res.status(200).json({ result });
  } catch (error) {
    console.error("update scholarship error: ", error);
    return res.status(500).json({ error: "something went wrong" });
  }
}

async function remove(req, res) {
  try {
    const scholarshipId = req.params.id;
    const adminId = req.user.userId;

    const result = await closeScholarship(scholarshipId, adminId);

    // same vague 404 as update: missing and "not yours" look identical from outside
    if (!result) {
      return res.status(404).json({ error: "no scholarship found" });
    }

    return res.status(200).json({ result });
  } catch (error) {
    console.error("error in removing: ", error);
    return res.status(500).json({ error: "something went wrong" });
  }
}

// function to get Applicants of specific scholarship
async function getApplicants(req, res) {
  try {
    const scholarshipId = req.params.id;
    const adminId = req.user.userId;

    const applications = await getApplicantsByScholarshipId(
      scholarshipId,
      adminId,
    );

    return res.status(200).json({ applications });
  } catch (error) {
    console.error("error getting applications by scholarship id: ", error);
    return res.status(500).json({ error: "something went wrong" });
  }
}

async function getMyScholarships(req, res) {
  try {
    const adminId = req.user.userId;

    const scholarships = await getScholarshipsByAdmin(adminId);

    return res.status(200).json({ scholarships });
  } catch (error) {
    console.error("error getting scholarships by admin: ", error);
    return res.status(500).json({ error: "something went wrong" });
  }
}

module.exports = {
  getAll,
  getOne,
  create,
  update,
  remove,
  getApplicants,
  getMyScholarships,
};
