const { test, describe, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const { createTestApp } = require("./helpers/testApp");

let ctx;
let admin;
let otherAdmin;
let student;

before(async () => {
  ctx = await createTestApp();
});
beforeEach(async () => {
  await ctx.reset();
  admin = await ctx.createUser({ role: "admin" });
  otherAdmin = await ctx.createUser({ role: "admin" });
  student = await ctx.createUser({
    role: "student",
    name: "Maria Santos",
    school: "UP Diliman",
    course: "BS Biology",
  });
});
after(() => ctx.close());

const validBody = {
  title: "SM Foundation College Scholarship",
  organization: "SM Foundation",
  description: "Full tuition",
  amount: 50000,
  slots: 20,
  requirements: "Report card",
  deadline: "2099-06-30",
};

describe("GET /scholarships (public)", () => {
  test("lists scholarships without a token", async () => {
    await ctx.createScholarship(admin.id);

    const res = await ctx.api.get("/scholarships");

    assert.equal(res.status, 200);
    assert.equal(res.body.scholarships.length, 1);
  });

  test("returns the deadline as a plain YYYY-MM-DD string", async () => {
    await ctx.createScholarship(admin.id, { deadline: "2099-12-31" });

    const res = await ctx.api.get("/scholarships");

    assert.equal(res.body.scholarships[0].deadline, "2099-12-31");
  });

  test("returns the soonest deadline first", async () => {
    await ctx.createScholarship(admin.id, { title: "Later", deadline: "2099-12-31" });
    await ctx.createScholarship(admin.id, { title: "Sooner", deadline: "2099-01-15" });

    const res = await ctx.api.get("/scholarships");

    assert.deepEqual(
      res.body.scholarships.map((s) => s.title),
      ["Sooner", "Later"],
    );
  });
});

describe("GET /scholarships/:id (public)", () => {
  test("returns one scholarship", async () => {
    const sch = await ctx.createScholarship(admin.id);

    const res = await ctx.api.get(`/scholarships/${sch.id}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.scholarship.title, sch.title);
  });

  test("returns 404 for an id that does not exist", async () => {
    const res = await ctx.api.get("/scholarships/9999");

    assert.equal(res.status, 404);
  });

  test("returns 400 for an id that is not a number", async () => {
    const res = await ctx.api.get("/scholarships/abc");

    assert.equal(res.status, 400);
  });

  test("returns 400 for an id too large for the database column", async () => {
    const res = await ctx.api.get("/scholarships/99999999999");

    assert.equal(res.status, 400);
  });
});

describe("POST /scholarships", () => {
  test("rejects a request with no token", async () => {
    const res = await ctx.api.post("/scholarships").send(validBody);

    assert.equal(res.status, 401);
  });

  test("rejects a student token with 401", async () => {
    const res = await ctx.api
      .post("/scholarships")
      .set(ctx.bearer(student))
      .send(validBody);

    assert.equal(res.status, 401);
    assert.equal((await ctx.query("SELECT id FROM scholarships")).length, 0);
  });

  test("creates an open listing owned by the admin in the token", async () => {
    const res = await ctx.api
      .post("/scholarships")
      .set(ctx.bearer(admin))
      .send({ ...validBody, posted_by: otherAdmin.id });

    assert.equal(res.status, 201);
    assert.equal(res.body.scholarship.posted_by, admin.id);
    assert.equal(res.body.scholarship.status, "open");
  });

  test("stores blank optional fields as NULL instead of failing", async () => {
    const res = await ctx.api
      .post("/scholarships")
      .set(ctx.bearer(admin))
      .send({ ...validBody, amount: "", slots: "", description: "", requirements: "" });

    assert.equal(res.status, 201);
    assert.equal(res.body.scholarship.amount, null);
    assert.equal(res.body.scholarship.slots, null);
    assert.equal(res.body.scholarship.description, null);
  });

  test("trims the title and organization before saving", async () => {
    const res = await ctx.api
      .post("/scholarships")
      .set(ctx.bearer(admin))
      .send({ ...validBody, title: "  Ayala Scholarship  ", organization: " Ayala Foundation " });

    assert.equal(res.body.scholarship.title, "Ayala Scholarship");
    assert.equal(res.body.scholarship.organization, "Ayala Foundation");
  });

  test("rejects a title that is only whitespace", async () => {
    const res = await ctx.api
      .post("/scholarships")
      .set(ctx.bearer(admin))
      .send({ ...validBody, title: "   " });

    assert.equal(res.status, 400);
  });

  for (const deadline of ["not-a-date", "2099-02-30", "06/30/2099", ""]) {
    test(`rejects the invalid deadline "${deadline}"`, async () => {
      const res = await ctx.api
        .post("/scholarships")
        .set(ctx.bearer(admin))
        .send({ ...validBody, deadline });

      assert.equal(res.status, 400);
    });
  }

  for (const [field, value] of [
    ["amount", -1],
    ["amount", "lots"],
    ["slots", -5],
    ["slots", 2.5],
    ["title", "x".repeat(201)],
    ["description", "x".repeat(5001)],
    ["title", ["an", "array"]],
  ]) {
    test(`rejects ${field} = ${JSON.stringify(value).slice(0, 24)}`, async () => {
      const res = await ctx.api
        .post("/scholarships")
        .set(ctx.bearer(admin))
        .send({ ...validBody, [field]: value });

      assert.equal(res.status, 400);
    });
  }
});

describe("PUT /scholarships/:id", () => {
  test("lets the owning admin update the listing", async () => {
    const sch = await ctx.createScholarship(admin.id);

    const res = await ctx.api
      .put(`/scholarships/${sch.id}`)
      .set(ctx.bearer(admin))
      .send({ ...validBody, title: "Renamed", status: "closed" });

    assert.equal(res.status, 200);
    assert.equal(res.body.result.title, "Renamed");
    assert.equal(res.body.result.status, "closed");
  });

  test("accepts the row exactly as the API returned it (numeric strings, nulls)", async () => {
    const sch = await ctx.createScholarship(admin.id, {
      amount: "12345.50",
      slots: null,
      description: null,
      status: "closed",
    });
    const fetched = await ctx.api.get(`/scholarships/${sch.id}`);

    const res = await ctx.api
      .put(`/scholarships/${sch.id}`)
      .set(ctx.bearer(admin))
      .send({ ...fetched.body.scholarship, status: "open" });

    assert.equal(res.status, 200);
    assert.equal(res.body.result.status, "open");
    assert.equal(res.body.result.amount, "12345.50");
  });

  test("does not let another admin edit a listing they do not own", async () => {
    const sch = await ctx.createScholarship(admin.id, { title: "Original" });

    const res = await ctx.api
      .put(`/scholarships/${sch.id}`)
      .set(ctx.bearer(otherAdmin))
      .send({ ...validBody, title: "Hijacked", status: "open" });

    assert.equal(res.status, 404);
    const [row] = await ctx.query("SELECT title FROM scholarships");
    assert.equal(row.title, "Original");
  });

  test("rejects a status outside open/closed", async () => {
    const sch = await ctx.createScholarship(admin.id);

    const res = await ctx.api
      .put(`/scholarships/${sch.id}`)
      .set(ctx.bearer(admin))
      .send({ ...validBody, status: "archived" });

    assert.equal(res.status, 400);
  });

  test("rejects a student token with 401", async () => {
    const sch = await ctx.createScholarship(admin.id);

    const res = await ctx.api
      .put(`/scholarships/${sch.id}`)
      .set(ctx.bearer(student))
      .send({ ...validBody, status: "open" });

    assert.equal(res.status, 401);
  });
});

describe("DELETE /scholarships/:id", () => {
  test("soft-deletes: the row stays, its status becomes closed", async () => {
    const sch = await ctx.createScholarship(admin.id);

    const res = await ctx.api
      .delete(`/scholarships/${sch.id}`)
      .set(ctx.bearer(admin));

    assert.equal(res.status, 200);
    const rows = await ctx.query("SELECT status FROM scholarships");
    assert.deepEqual(rows, [{ status: "closed" }]);
  });

  test("does not let another admin close a listing they do not own", async () => {
    const sch = await ctx.createScholarship(admin.id);

    const res = await ctx.api
      .delete(`/scholarships/${sch.id}`)
      .set(ctx.bearer(otherAdmin));

    assert.equal(res.status, 404);
    const [row] = await ctx.query("SELECT status FROM scholarships");
    assert.equal(row.status, "open");
  });

  test("rejects a student token with 401", async () => {
    const sch = await ctx.createScholarship(admin.id);

    const res = await ctx.api
      .delete(`/scholarships/${sch.id}`)
      .set(ctx.bearer(student));

    assert.equal(res.status, 401);
  });
});

describe("GET /scholarships/mine", () => {
  test("returns only the caller's listings, each with its applicant count", async () => {
    const mine = await ctx.createScholarship(admin.id, { title: "Mine" });
    await ctx.createScholarship(otherAdmin.id, { title: "Theirs" });
    await ctx.createApplication(student.id, mine.id);

    const res = await ctx.api.get("/scholarships/mine").set(ctx.bearer(admin));

    assert.equal(res.status, 200);
    assert.equal(res.body.scholarships.length, 1);
    assert.equal(res.body.scholarships[0].title, "Mine");
    assert.equal(res.body.scholarships[0].applicant_count, 1);
  });

  test("rejects a student token with 401", async () => {
    const res = await ctx.api.get("/scholarships/mine").set(ctx.bearer(student));

    assert.equal(res.status, 401);
  });
});

describe("GET /scholarships/:id/applications", () => {
  test("shows the owning admin who applied, including school and course", async () => {
    const sch = await ctx.createScholarship(admin.id);
    await ctx.createApplication(student.id, sch.id, { status: "applied" });

    const res = await ctx.api
      .get(`/scholarships/${sch.id}/applications`)
      .set(ctx.bearer(admin));

    assert.equal(res.status, 200);
    assert.equal(res.body.applications.length, 1);
    const [applicant] = res.body.applications;
    assert.equal(applicant.name, "Maria Santos");
    assert.equal(applicant.school, "UP Diliman");
    assert.equal(applicant.course, "BS Biology");
    assert.equal(applicant.status, "applied");
  });

  test("never exposes an applicant's password hash", async () => {
    const sch = await ctx.createScholarship(admin.id);
    await ctx.createApplication(student.id, sch.id);

    const res = await ctx.api
      .get(`/scholarships/${sch.id}/applications`)
      .set(ctx.bearer(admin));

    assert.equal(res.body.applications[0].password_hash, undefined);
  });

  test("keeps a student's private tracker notes private", async () => {
    const sch = await ctx.createScholarship(admin.id);
    await ctx.createApplication(student.id, sch.id, {
      notes: "Backup option in case DOST says no",
    });

    const res = await ctx.api
      .get(`/scholarships/${sch.id}/applications`)
      .set(ctx.bearer(admin));

    assert.equal(res.body.applications.length, 1);
    assert.doesNotMatch(JSON.stringify(res.body), /Backup option/);
  });

  test("shows another admin nothing", async () => {
    const sch = await ctx.createScholarship(admin.id);
    await ctx.createApplication(student.id, sch.id);

    const res = await ctx.api
      .get(`/scholarships/${sch.id}/applications`)
      .set(ctx.bearer(otherAdmin));

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.applications, []);
  });
});
