const { test, describe, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const { createTestApp } = require("./helpers/testApp");

let ctx;
let admin;
let student;
let otherStudent;
let scholarship;

before(async () => {
  ctx = await createTestApp();
});
beforeEach(async () => {
  await ctx.reset();
  admin = await ctx.createUser({ role: "admin" });
  student = await ctx.createUser({ role: "student" });
  otherStudent = await ctx.createUser({ role: "student" });
  scholarship = await ctx.createScholarship(admin.id);
});
after(() => ctx.close());

describe("POST /applications", () => {
  test("saves a scholarship to the student's tracker as 'interested'", async () => {
    const res = await ctx.api
      .post("/applications")
      .set(ctx.bearer(student))
      .send({ scholarshipId: scholarship.id });

    assert.equal(res.status, 201);
    assert.equal(res.body.application.status, "interested");
    assert.equal(res.body.application.student_id, student.id);
  });

  test("takes the owner from the token, never from the request body", async () => {
    await ctx.api
      .post("/applications")
      .set(ctx.bearer(student))
      .send({ scholarshipId: scholarship.id, studentId: otherStudent.id, student_id: otherStudent.id });

    const [row] = await ctx.query("SELECT student_id FROM applications");
    assert.equal(row.student_id, student.id);
  });

  test("rejects saving the same scholarship twice", async () => {
    await ctx.createApplication(student.id, scholarship.id);

    const res = await ctx.api
      .post("/applications")
      .set(ctx.bearer(student))
      .send({ scholarshipId: scholarship.id });

    assert.equal(res.status, 409);
  });

  test("returns 404 for a scholarship that does not exist", async () => {
    const res = await ctx.api
      .post("/applications")
      .set(ctx.bearer(student))
      .send({ scholarshipId: 9999 });

    assert.equal(res.status, 404);
  });

  test("refuses to save a closed scholarship", async () => {
    const closed = await ctx.createScholarship(admin.id, { status: "closed" });

    const res = await ctx.api
      .post("/applications")
      .set(ctx.bearer(student))
      .send({ scholarshipId: closed.id });

    assert.equal(res.status, 409);
    assert.equal((await ctx.query("SELECT id FROM applications")).length, 0);
  });

  for (const scholarshipId of ["abc", -1, 1.5, null, { id: 1 }]) {
    test(`rejects scholarshipId = ${JSON.stringify(scholarshipId)}`, async () => {
      const res = await ctx.api
        .post("/applications")
        .set(ctx.bearer(student))
        .send({ scholarshipId });

      assert.equal(res.status, 400);
    });
  }

  test("rejects an admin token with 401", async () => {
    const res = await ctx.api
      .post("/applications")
      .set(ctx.bearer(admin))
      .send({ scholarshipId: scholarship.id });

    assert.equal(res.status, 401);
  });
});

describe("GET /applications", () => {
  test("returns only the caller's applications", async () => {
    await ctx.createApplication(student.id, scholarship.id);
    await ctx.createApplication(otherStudent.id, scholarship.id);

    const res = await ctx.api.get("/applications").set(ctx.bearer(student));

    assert.equal(res.status, 200);
    assert.equal(res.body.applications.length, 1);
  });

  test("includes the scholarship id and details needed to render a tracker card", async () => {
    await ctx.createApplication(student.id, scholarship.id, { status: "applied" });

    const res = await ctx.api.get("/applications").set(ctx.bearer(student));

    const [card] = res.body.applications;
    assert.equal(card.scholarship_id, scholarship.id);
    assert.equal(card.title, scholarship.title);
    assert.equal(card.application_status, "applied");
    assert.equal(card.scholarship_status, "open");
    assert.equal(card.deadline, "2099-12-31");
  });

  test("rejects an admin token with 401", async () => {
    const res = await ctx.api.get("/applications").set(ctx.bearer(admin));

    assert.equal(res.status, 401);
  });
});

describe("PUT /applications/:id", () => {
  test("moves the application to a new stage and saves the notes", async () => {
    const app = await ctx.createApplication(student.id, scholarship.id);

    const res = await ctx.api
      .put(`/applications/${app.id}`)
      .set(ctx.bearer(student))
      .send({ status: "interview", notes: "Panel interview on Friday" });

    assert.equal(res.status, 200);
    assert.equal(res.body.updatedApplication.status, "interview");
    assert.equal(res.body.updatedApplication.notes, "Panel interview on Friday");
  });

  test("refreshes updated_at so the tracker shows when it last changed", async () => {
    const app = await ctx.createApplication(student.id, scholarship.id);
    await ctx.query(
      "UPDATE applications SET updated_at = NOW() - INTERVAL '10 days' WHERE id = $1",
      [app.id],
    );

    await ctx.api
      .put(`/applications/${app.id}`)
      .set(ctx.bearer(student))
      .send({ status: "applied", notes: null });

    const [row] = await ctx.query(
      "SELECT updated_at > NOW() - INTERVAL '1 minute' AS is_fresh FROM applications WHERE id = $1",
      [app.id],
    );
    assert.equal(row.is_fresh, true);
  });

  test("rejects a status that is not a pipeline stage", async () => {
    const app = await ctx.createApplication(student.id, scholarship.id);

    const res = await ctx.api
      .put(`/applications/${app.id}`)
      .set(ctx.bearer(student))
      .send({ status: "won" });

    assert.equal(res.status, 400);
  });

  for (const notes of [12345, { text: "hi" }, "x".repeat(2001)]) {
    test(`rejects notes = ${JSON.stringify(notes).slice(0, 24)}`, async () => {
      const app = await ctx.createApplication(student.id, scholarship.id);

      const res = await ctx.api
        .put(`/applications/${app.id}`)
        .set(ctx.bearer(student))
        .send({ status: "applied", notes });

      assert.equal(res.status, 400);
    });
  }

  test("does not let a student change someone else's application", async () => {
    const theirs = await ctx.createApplication(otherStudent.id, scholarship.id);

    const res = await ctx.api
      .put(`/applications/${theirs.id}`)
      .set(ctx.bearer(student))
      .send({ status: "result", notes: "hijacked" });

    assert.equal(res.status, 404);
    const [row] = await ctx.query("SELECT status, notes FROM applications");
    assert.deepEqual(row, { status: "interested", notes: null });
  });

  test("returns 400 for an id that is not a number", async () => {
    const res = await ctx.api
      .put("/applications/abc")
      .set(ctx.bearer(student))
      .send({ status: "applied" });

    assert.equal(res.status, 400);
  });
});

describe("DELETE /applications/:id", () => {
  test("removes the application from the tracker", async () => {
    const app = await ctx.createApplication(student.id, scholarship.id);

    const res = await ctx.api
      .delete(`/applications/${app.id}`)
      .set(ctx.bearer(student));

    assert.equal(res.status, 200);
    assert.equal((await ctx.query("SELECT id FROM applications")).length, 0);
  });

  test("does not let a student remove someone else's application", async () => {
    const theirs = await ctx.createApplication(otherStudent.id, scholarship.id);

    const res = await ctx.api
      .delete(`/applications/${theirs.id}`)
      .set(ctx.bearer(student));

    assert.equal(res.status, 404);
    assert.equal((await ctx.query("SELECT id FROM applications")).length, 1);
  });

  test("returns 400 for an id that is not a number", async () => {
    const res = await ctx.api.delete("/applications/abc").set(ctx.bearer(student));

    assert.equal(res.status, 400);
  });
});
