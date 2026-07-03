const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");

const {
  getAll,
  create,
  update,
  remove,
} = require("../controllers/applicationController");

router.get("/", verifyToken, getAll);
router.post("/", verifyToken, create);
router.put("/:id", verifyToken, update);
router.delete("/:id", verifyToken, remove);

module.exports = router;
