const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { requireStudent } = require("../middleware/roles");
const validateIdParam = require("../middleware/validateId");

const {
  getAll,
  create,
  createPersonal,
  updatePersonal,
  update,
  remove,
} = require("../controllers/applicationController");

// runs for every route below that has :id in its path
router.param("id", validateIdParam);

router.get("/", verifyToken, requireStudent, getAll);
router.post("/", verifyToken, requireStudent, create);
router.post("/personal", verifyToken, requireStudent, createPersonal);
router.put("/personal/:id", verifyToken, requireStudent, updatePersonal);
router.put("/:id", verifyToken, requireStudent, update);
router.delete("/:id", verifyToken, requireStudent, remove);

module.exports = router;
