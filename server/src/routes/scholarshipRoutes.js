const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { requireAdmin } = require("../middleware/roles");
const validateIdParam = require("../middleware/validateId");

const {
  getAll,
  getOne,
  create,
  update,
  remove,
  getApplicants,
  getMyScholarships,
} = require("../controllers/scholarshipController");

// runs for every route below that has :id in its path
router.param("id", validateIdParam);

router.get("/", getAll);
router.get("/mine", verifyToken, requireAdmin, getMyScholarships);
router.get("/:id/applications", verifyToken, requireAdmin, getApplicants);
router.get("/:id", getOne);
router.post("/", verifyToken, requireAdmin, create);
router.put("/:id", verifyToken, requireAdmin, update);
router.delete("/:id", verifyToken, requireAdmin, remove);

module.exports = router;
