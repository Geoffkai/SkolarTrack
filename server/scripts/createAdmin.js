// Admin accounts are never created through the public API (register always makes a student).
// This script is the only way in, and it needs the database credentials to run:
//   npm run create-admin -- <email> <password> [name]
const bcrypt = require("bcryptjs");
const pool = require("../src/config/db");
const { createUser, findUserByEmail } = require("../src/models/userModel");
const { validateRegistration } = require("../src/utils/validation");
const [email, password, name] = process.argv.slice(2);

async function main() {
  if (!email || !password) {
    console.error("Usage: npm run create-admin -- <email> <password> [name]");
    process.exitCode = 1;
    return;
  }

  // same rules as public sign-up: valid email, password of at least 8 characters
  const { error, value } = validateRegistration({
    email,
    password,
    name: name || "Admin",
  });
  if (error) {
    console.error(`Cannot create admin: ${error}`);
    process.exitCode = 1;
    return;
  }

  const existing = await findUserByEmail(value.email);
  if (existing) {
    console.error(`A user with the email ${value.email} already exists`);
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(value.password, 10);
  const admin = await createUser(
    value.email,
    passwordHash,
    "admin",
    value.name,
    null,
    null,
  );

  console.log("Admin created:", admin.email, "(" + admin.role + ")");
}

main()
  .catch((err) => {
    console.error("Failed to create admin:", err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
