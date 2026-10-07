const bcrypt = require("bcryptjs"); // the hashing tool
const jwt = require("jsonwebtoken");
const config = require("../config/env");
const { findUserByEmail, createUser } = require("../models/userModel"); // the two model function
const {
  validateRegistration,
  validateLogin,
} = require("../utils/validation");

// A real hash of a throwaway password. When a login names an email that doesn't exist we
// still run one bcrypt comparison against this, so "unknown email" takes as long as
// "wrong password" — otherwise response time alone reveals which emails have accounts.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-account-password", 10);

async function register(req, res) {
  try {
    // 1. pull the fields out of the request body, role is intentionally NOT read from the client
    // 2. basic guard — also trims and lowercases the email
    const { error, value } = validateRegistration(req.body);
    if (error) {
      return res.status(400).json({ error });
    }
    const { email, password, name, course, school } = value;

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
    // two requests for the same email can both pass step 3 at the same moment;
    // the UNIQUE constraint catches the second one (23505 = unique_violation)
    if (error.code === "23505") {
      return res.status(409).json({ error: "email already in use" });
    }
    console.error("register error:", error);
    return res.status(500).json({ error: "something went wrong" });
  }
}

async function login(req, res) {
  try {
    // 1. read credentials from the body
    const { error, value } = validateLogin(req.body);
    if (error) {
      return res.status(400).json({ error });
    }
    const { email, password } = value;

    // 2. find the user
    const user = await findUserByEmail(email);

    // 3. compare the typed password against the stored hash
    const isMatch = await bcrypt.compare(
      password,
      user ? user.password_hash : DUMMY_HASH,
    );
    if (!user || !isMatch) {
      return res.status(401).json({ error: "invalid email or password" });
    }

    // 4. mint the token - made FROM the data, signed by the secret.
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwtSecret,
      { algorithm: "HS256", expiresIn: config.jwtExpiresIn },
    );

    // 5. success - hand back the token
    return res.status(200).json({ token });
  } catch (error) {
    console.error("login error: ", error);
    return res.status(500).json({ error: "something went wrong" });
  }
}
module.exports = { register, login };
