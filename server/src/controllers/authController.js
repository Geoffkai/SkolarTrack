const bcrypt = require("bcryptjs"); // the hashing tool
const jwt = require("jsonwebtoken");
const { findUserByEmail, createUser } = require("../models/userModel"); // the two model function

async function register(req, res) {
  try {
    // 1. pull the fields out of the request body, role is intentionally NOT read from the client
    const { email, password, name, course, school } = req.body;

    // 2. basic guard
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "email, password, role are required" });
    }

    // 3. is the email already registered?
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "email already in use" });
    }

    const role = "student";

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

async function login(req, res) {
  try {
    // 1. read credentials from the body
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    // 2. find the user
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "invalid email or password" });
    }

    // 3. compare the typed password against the stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "invalid email or password" });
    }

    // 4. mint the token - made FROM the data, signed by the secret.
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    // 5. success - hand back the token
    return res.status(200).json({ token });
  } catch (error) {
    console.error("login error: ", error);
    return res.status(500).json({ error: "something went wrong" });
  }
}
module.exports = { register, login };
