require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../src/config/db");
const { createUser, findUserByEmail } = require("../src/models/userModel");
const [email, password, name] = process.argv.slice(2);

async function main() {
  const existing = await findUserByEmail(email);
  if (existing) {
    console.error(`A user with ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await createUser(
    email,
    passwordHash,
    "admin",
    name || "Admin",
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
