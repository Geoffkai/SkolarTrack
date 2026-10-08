const express = require("express"); // express route
const router = express.Router(); // the mini-app (the clipboard)
const { register, login } = require("../controllers/authController");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimit");

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
module.exports = router;
