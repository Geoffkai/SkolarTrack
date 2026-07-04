const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { requireStudent } = require("../middleware/roles");

const {
  getAll,
  create,
  update,
  remove,
} = require("../controllers/applicationController");

router.get("/", verifyToken, requireStudent, getAll);
router.post("/", verifyToken, requireStudent, create);
router.put("/:id", verifyToken, requireStudent, update);
router.delete("/:id", verifyToken, requireStudent, remove);

module.exports = router;
