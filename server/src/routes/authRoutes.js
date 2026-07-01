const express = require("express"); // express route
const router = express.Router(); // the mini-app (the clipboard)
const { register } = require("../controllers/authController");

router.post("/register", register);

module.exports = router;
