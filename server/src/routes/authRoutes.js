const express = require("express"); // express route
const router = express.Router(); // the mini-app (the clipboard)
const { register, login } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
module.exports = router;
