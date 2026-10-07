const { test, describe, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { createTestApp } = require("./helpers/testApp");

let ctx;
before(async () => {
  ctx = await createTestApp();
});
beforeEach(() => ctx.reset());
after(() => ctx.close());

const validUser = {
  email: "juan@up.edu.ph",
  password: "correct-horse-battery",
  name: "Juan Dela Cruz",
  course: "BS Computer Science",
  school: "UP Diliman",
};

describe("POST /auth/register", () => {
  test("creates a student account and never returns the password hash", async () => {
    const res = await ctx.api.post("/auth/register").send(validUser);

    assert.equal(res.status, 201);
    assert.equal(res.body.user.email, "juan@up.edu.ph");
    assert.equal(res.body.user.role, "student");
    assert.equal(res.body.user.password_hash, undefined);
  });

  test("stores a bcrypt hash, not the plain password", async () => {
    await ctx.api.post("/auth/register").send(validUser);

    const [row] = await ctx.query("SELECT password_hash FROM users");
    assert.notEqual(row.password_hash, validUser.password);
    assert.match(row.password_hash, /^\$2[aby]\$/);
  });

  test("ignores a role sent by the client, so nobody can self-register as admin", async () => {
    const res = await ctx.api
      .post("/auth/register")
      .send({ ...validUser, role: "admin" });

    assert.equal(res.status, 201);
    const [row] = await ctx.query("SELECT role FROM users");
    assert.equal(row.role, "student");
  });

  test("rejects a malformed email", async () => {
    const res = await ctx.api
      .post("/auth/register")
      .send({ ...validUser, email: "not-an-email" });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /email/i);
  });

  test("rejects a password shorter than 8 characters", async () => {
    const res = await ctx.api
      .post("/auth/register")
      .send({ ...validUser, password: "short" });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /password/i);
  });

  test("rejects a password longer than bcrypt can hash (72 bytes)", async () => {
    const res = await ctx.api
      .post("/auth/register")
      .send({ ...validUser, password: "a".repeat(73) });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /password/i);
  });

  test("stores the email trimmed and lowercased", async () => {
    await ctx.api
      .post("/auth/register")
      .send({ ...validUser, email: "  Juan@UP.edu.ph " });

    const [row] = await ctx.query("SELECT email FROM users");
    assert.equal(row.email, "juan@up.edu.ph");
  });

  test("treats the same email in a different case as already registered", async () => {
    await ctx.api.post("/auth/register").send(validUser);

    const res = await ctx.api
      .post("/auth/register")
      .send({ ...validUser, email: "JUAN@UP.EDU.PH" });

    assert.equal(res.status, 409);
  });

  test("rejects non-text profile fields instead of crashing", async () => {
    const res = await ctx.api
      .post("/auth/register")
      .send({ ...validUser, name: { $ne: null } });

    assert.equal(res.status, 400);
  });
});

describe("POST /auth/login", () => {
  beforeEach(() => ctx.api.post("/auth/register").send(validUser));

  test("returns a token that protected routes accept", async () => {
    const login = await ctx.api
      .post("/auth/login")
      .send({ email: validUser.email, password: validUser.password });

    assert.equal(login.status, 200);
    const res = await ctx.api
      .get("/applications")
      .set("Authorization", `Bearer ${login.body.token}`);
    assert.equal(res.status, 200);
  });

  test("puts the user id and role inside the token", async () => {
    const login = await ctx.api
      .post("/auth/login")
      .send({ email: validUser.email, password: validUser.password });

    const payload = jwt.decode(login.body.token);
    assert.equal(payload.role, "student");
    assert.equal(typeof payload.userId, "number");
  });

  test("falls back to a 7 day token lifetime when JWT_EXPIRES_IN is not set", async () => {
    const login = await ctx.api
      .post("/auth/login")
      .send({ email: validUser.email, password: validUser.password });

    assert.equal(login.status, 200);
    const { iat, exp } = jwt.decode(login.body.token);
    assert.equal(exp - iat, 7 * 24 * 60 * 60);
  });

  test("accepts the email in any letter case", async () => {
    const res = await ctx.api
      .post("/auth/login")
      .send({ email: "Juan@UP.edu.ph", password: validUser.password });

    assert.equal(res.status, 200);
  });

  test("answers a wrong password and an unknown email identically", async () => {
    const wrongPassword = await ctx.api
      .post("/auth/login")
      .send({ email: validUser.email, password: "wrong-password" });
    const unknownEmail = await ctx.api
      .post("/auth/login")
      .send({ email: "nobody@up.edu.ph", password: "wrong-password" });

    assert.equal(wrongPassword.status, 401);
    assert.equal(unknownEmail.status, 401);
    assert.deepEqual(wrongPassword.body, unknownEmail.body);
  });

  test("rejects missing credentials", async () => {
    const res = await ctx.api.post("/auth/login").send({ email: "" });

    assert.equal(res.status, 400);
  });

  test("rejects non-text credentials instead of crashing", async () => {
    const res = await ctx.api
      .post("/auth/login")
      .send({ email: validUser.email, password: 12345678 });

    assert.equal(res.status, 400);
  });
});

describe("token verification", () => {
  test("rejects a request with no token", async () => {
    const res = await ctx.api.get("/applications");

    assert.equal(res.status, 401);
  });

  test("rejects an expired token", async () => {
    const expired = jwt.sign(
      { userId: 1, role: "student" },
      process.env.JWT_SECRET,
      { expiresIn: -10 },
    );

    const res = await ctx.api
      .get("/applications")
      .set("Authorization", `Bearer ${expired}`);

    assert.equal(res.status, 401);
  });

  test("rejects a token signed with a different secret", async () => {
    const forged = jwt.sign({ userId: 1, role: "admin" }, "attacker-secret");

    const res = await ctx.api
      .get("/scholarships/mine")
      .set("Authorization", `Bearer ${forged}`);

    assert.equal(res.status, 401);
  });

  test("rejects a token signed with an algorithm other than HS256", async () => {
    const otherAlgorithm = jwt.sign(
      { userId: 1, role: "admin" },
      process.env.JWT_SECRET,
      { algorithm: "HS512" },
    );

    const res = await ctx.api
      .get("/scholarships/mine")
      .set("Authorization", `Bearer ${otherAlgorithm}`);

    assert.equal(res.status, 401);
  });
});
