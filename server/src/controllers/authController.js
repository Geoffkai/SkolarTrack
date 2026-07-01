const bcrypt = require("bcryptjs"); // the hashing tool
const { findUserByEmail, createUser } = require("../models/userModel"); // the two model function

async function register(req, res) {
  try {
    // 1. pull the fields out of the request body
    const { email, password, role, name, course, school } = req.body;

    // 2. basic guard
    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ error: "email, password, role are required" });
    }

    // 3. is the email already registered?
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "email already in use" });
    }

    // 4. hash the password
    const passwordHash = await bcrypt.hash(password, 10); // 10 standard cost factor

    // 5. save the user, get the created row back
    const user = await createUser(
      email,
      passwordHash,
      role,
      name,
      course,
      school,
    );

    // 6. success
    return res.status(201).json({ user });
  } catch (error) {
    console.error("register error:", error);
    return res.status(500).json({ error: "something went wrong" });
  }
}

module.exports = { register };
