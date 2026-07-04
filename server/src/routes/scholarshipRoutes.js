const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { requireAdmin } = require("../middleware/roles");

const {
  getAll,
  getOne,
  create,
  update,
  remove,
  getApplicants,
} = require("../controllers/scholarshipController");

router.get("/", getAll);
router.get("/:id/applications", verifyToken, requireAdmin, getApplicants);
router.get("/:id", getOne);
router.post("/", verifyToken, requireAdmin, create);
router.put("/:id", verifyToken, requireAdmin, update);
router.delete("/:id", verifyToken, requireAdmin, remove);

module.exports = router;
