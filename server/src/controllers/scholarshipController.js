const {
  getAllScholarships,
  getScholarshipById,
  createScholarship,
  updateScholarship,
  closeScholarship,
  getApplicantsByScholarshipId,
  getScholarshipsByAdmin,
} = require("../models/scholarshipModel");

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
    const {
      title,
      organization,
      description,
      amount,
      slots,
      requirements,
      deadline,
    } = req.body;

    if (!title || !organization || !deadline) {
      return res.status(400).json({ error: "missing input" });
    }

    const scholarship = await createScholarship(
      userId,
      title,
      organization,
      description,
      amount,
      slots,
      requirements,
      deadline,
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
    const {
      title,
      organization,
      description,
      amount,
      slots,
      requirements,
      deadline,
      status,
    } = req.body;

    if (!title || !organization || !deadline) {
      return res.status(400).json({ error: "missing input" });
    }

    if (status !== "open" && status !== "closed") {
      return res.status(400).json({ error: "invalid status" });
    }

    const scholarship = await getScholarshipById(scholarshipId);

    if (!scholarship) {
      return res.status(404).json({ error: "no scholarship found" });
    }

    const result = await updateScholarship(
      scholarshipId,
      title,
      organization,
      description,
      amount,
      slots,
      requirements,
      deadline,
      status,
    );

    return res.status(200).json({ result });
  } catch (error) {
    console.error("update scholarship error: ", error);
    return res.status(500).json({ error: "something went wrong" });
  }
}

async function remove(req, res) {
  try {
    const scholarshipId = req.params.id;
    const scholarship = await getScholarshipById(scholarshipId);

    if (!scholarship) {
      return res.status(404).json({ error: "no scholarship found" });
    }

    const result = await closeScholarship(scholarshipId);
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
