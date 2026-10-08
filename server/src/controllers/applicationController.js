const {
  getApplicationsByStudent,
  createApplication,
  countPersonalApplications,
  createPersonalApplication,
  updatePersonalApplication,
  updateApplication,
  deleteApplication,
} = require("../models/applicationModel");
const { getScholarshipById } = require("../models/scholarshipModel");
const {
  validateNewApplication,
  validateApplicationUpdate,
  validatePersonalEntry,
} = require("../utils/validation");

// A student can save each listing only once, so listings bound that side of the tracker.
// Nothing bounds the scholarships they type in themselves, so this does.
const MAX_PERSONAL_ENTRIES = 50;

async function getAll(req, res) {
  try {
    const studentId = req.user.userId; // no destructuring - its already the value, not an object to unpack
    const applications = await getApplicationsByStudent(studentId);

    // does not need further guard because [] is truthy and student can still have 0 application
    return res.status(200).json({ applications });
  } catch (error) {
    console.error("error in applications: ", error);
    return res.status(500).json({ error: "something went wrong" });
  }
}

async function create(req, res) {
  try {
    const studentId = req.user.userId;

    const { error, value } = validateNewApplication(req.body);
    if (error) {
      return res.status(400).json({ error });
    }
    const { scholarshipId, notes } = value;

    // check the target first so the student gets a real answer (404 / 409)
    // instead of a foreign-key error surfacing as a 500
    const scholarship = await getScholarshipById(scholarshipId);
    if (!scholarship) {
      return res.status(404).json({ error: "scholarship does not exist" });
    }
    if (scholarship.status !== "open") {
      return res
        .status(409)
        .json({ error: "this scholarship is closed and can no longer be saved" });
    }

    const application = await createApplication(
      studentId,
      scholarshipId,
      "interested",
      notes,
    );
    return res.status(201).json({ application });
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ error: "already bookmarked this scholarship" });
    }
    console.error("create application error: ", error);
    return res.status(500).json({ error: "something went wrong" });
  }
}

// "personal" = a scholarship the student adds themselves, with no listing behind it
async function createPersonal(req, res) {
  try {
    const studentId = req.user.userId;

    const { error, value } = validatePersonalEntry(req.body, {
      withNotes: true,
    });
    if (error) {
      return res.status(400).json({ error });
    }

    if ((await countPersonalApplications(studentId)) >= MAX_PERSONAL_ENTRIES) {
      return res.status(409).json({
        error: `you can add up to ${MAX_PERSONAL_ENTRIES} scholarships of your own; remove one to add another`,
      });
    }

    const application = await createPersonalApplication(
      studentId,
      value.title,
      value.organization,
      value.amount,
      value.deadline,
      value.notes,
    );
    return res.status(201).json({ application });
  } catch (error) {
    console.error("create personal application error: ", error);
    return res.status(500).json({ error: "something went wrong" });
  }
}

async function updatePersonal(req, res) {
  try {
    const userId = req.user.userId;
    const applicationId = req.params.id;

    // full replacement of the scholarship's details; the stage and the notes are not
    // part of this request and stay as they are (PUT /applications/:id changes those)
    const { error, value } = validatePersonalEntry(req.body);
    if (error) {
      return res.status(400).json({ error });
    }

    const updatedApplication = await updatePersonalApplication(
      applicationId,
      userId,
      value.title,
      value.organization,
      value.amount,
      value.deadline,
    );

    // missing, someone else's, or a saved listing rather than a personal entry —
    // the same vague 404 for all three
    return !updatedApplication
      ? res.status(404).json({ error: "application not found" })
      : res.status(200).json({ updatedApplication });
  } catch (error) {
    console.error("update personal application error: ", error);
    return res.status(500).json({ error: "something went wrong" });
  }
}

async function update(req, res) {
  try {
    const userId = req.user.userId; // ownership id comes from the verified token, never trusted from req.body
    const applicationId = req.params.id; // the applications primary key, from the URL (:id)

    // full replacement, same convention as PUT /scholarships: status is required,
    // and notes left out of the body are cleared rather than kept
    const { error, value } = validateApplicationUpdate(req.body);
    if (error) {
      return res.status(400).json({ error });
    }

    const updatedApplication = await updateApplication(
      applicationId,
      userId,
      value.status,
      value.notes,
    );

    //need to check if the application is existing and it is for the student
    //same vague 404 for both on purpose
    return !updatedApplication
      ? res.status(404).json({ error: "application not found" })
      : res.status(200).json({ updatedApplication });
  } catch (error) {
    console.error("update application error: ", error);
    return res.status(500).json({ error: "something went wrong" });
  }
}

async function remove(req, res) {
  try {
    const userId = req.user.userId;
    const applicationId = req.params.id;

    //deleteApplication has no RETURNING * - nothing to send back on a delete
    // rowCount (0 or 1)
    const rowCount = await deleteApplication(applicationId, userId);

    // or it exists but isn't this student's — one vague 404 either way
    return rowCount === 0
      ? res.status(404).json({ error: "application not found" })
      : res.status(200).json({ message: "application removed" });
  } catch (error) {
    console.error("delete application error: ", error);
    return res.status(500).json({ error: "something went wrong" });
  }
}

module.exports = {
  getAll,
  create,
  createPersonal,
  updatePersonal,
  update,
  remove,
};
