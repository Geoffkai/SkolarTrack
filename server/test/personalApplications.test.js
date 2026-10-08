const { test, describe, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const { createTestApp } = require("./helpers/testApp");

// A "personal" entry is a scholarship the student typed in themselves:
// a tracker row with no admin listing behind it.

let ctx;
let admin;
let student;
let otherStudent;
let scholarship;

const details = {
  title: "SM Foundation College Scholarship",
  organization: "SM Foundation",
  amount: 15000,
  deadline: "2099-06-30",
};

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

const allRows = () => ctx.query("SELECT * FROM applications ORDER BY id");

describe("POST /applications/personal", () => {
  test("adds the student's own scholarship to their tracker as 'interested'", async () => {
    const res = await ctx.api
      .post("/applications/personal")
      .set(ctx.bearer(student))
      .send({ ...details, notes: "Apply at the mall branch" });

    assert.equal(res.status, 201);
    const { application } = res.body;
    assert.equal(application.status, "interested");
    assert.equal(application.student_id, student.id);
    assert.equal(application.scholarship_id, null);
    assert.equal(application.personal_title, "SM Foundation College Scholarship");
    assert.equal(application.personal_organization, "SM Foundation");
    assert.equal(Number(application.personal_amount), 15000);
    assert.equal(application.personal_deadline, "2099-06-30");
    assert.equal(application.notes, "Apply at the mall branch");
  });

  test("takes the owner from the token, never from the request body", async () => {
    await ctx.api
      .post("/applications/personal")
      .set(ctx.bearer(student))
      .send({ ...details, studentId: otherStudent.id, student_id: otherStudent.id });

    const [row] = await allRows();
    assert.equal(row.student_id, student.id);
  });

  test("needs only a title and an organization", async () => {
    const res = await ctx.api
      .post("/applications/personal")
      .set(ctx.bearer(student))
      .send({ title: "Barangay Scholarship", organization: "Barangay San Roque" });

    assert.equal(res.status, 201);
    assert.equal(res.body.application.personal_amount, null);
    assert.equal(res.body.application.personal_deadline, null);
    assert.equal(res.body.application.notes, null);
  });

  test("trims the text and stores blank optional fields as no value", async () => {
    await ctx.api
      .post("/applications/personal")
      .set(ctx.bearer(student))
      .send({
        title: "  Barangay Scholarship  ",
        organization: " Barangay San Roque ",
        amount: "",
        deadline: "",
        notes: "   ",
      });

    const [row] = await allRows();
    assert.equal(row.personal_title, "Barangay Scholarship");
    assert.equal(row.personal_organization, "Barangay San Roque");
    assert.equal(row.personal_amount, null);
    assert.equal(row.personal_deadline, null);
    assert.equal(row.notes, null);
  });

  const invalidBodies = {
    "a missing title": { organization: "SM Foundation" },
    "a blank title": { ...details, title: "   " },
    "a missing organization": { title: "SM Foundation College Scholarship" },
    "a title over 200 characters": { ...details, title: "x".repeat(201) },
    "a negative amount": { ...details, amount: -1 },
    "an amount that is not a number": { ...details, amount: "lots" },
    "a deadline in the wrong format": { ...details, deadline: "06/30/2099" },
    "a deadline that is not a real day": { ...details, deadline: "2099-02-30" },
    "notes over 2000 characters": { ...details, notes: "x".repeat(2001) },
  };
  for (const [label, body] of Object.entries(invalidBodies)) {
    test(`rejects ${label}`, async () => {
      const res = await ctx.api
        .post("/applications/personal")
        .set(ctx.bearer(student))
        .send(body);

      assert.equal(res.status, 400);
      assert.equal((await allRows()).length, 0);
    });
  }

  test("lets a student add two scholarships with the same title", async () => {
    for (let i = 0; i < 2; i++) {
      const res = await ctx.api
        .post("/applications/personal")
        .set(ctx.bearer(student))
        .send(details);
      assert.equal(res.status, 201);
    }

    assert.equal((await allRows()).length, 2);
  });

  // `count` personal entries, written straight into the table
  const seedPersonalEntries = (owner, count) =>
    ctx.query(
      `INSERT INTO applications (student_id, personal_title, personal_organization)
       SELECT $1, 'Scholarship ' || n, 'Some Foundation' FROM generate_series(1, $2::int) AS n`,
      [owner.id, count],
    );

  test("refuses a 51st scholarship of the student's own", async () => {
    await seedPersonalEntries(student, 50);

    const res = await ctx.api
      .post("/applications/personal")
      .set(ctx.bearer(student))
      .send(details);

    assert.equal(res.status, 409);
    assert.equal((await allRows()).length, 50);
  });

  test("does not count other students' or saved listings toward that limit", async () => {
    await seedPersonalEntries(student, 49);
    await seedPersonalEntries(otherStudent, 50);
    await ctx.createApplication(student.id, scholarship.id);

    const res = await ctx.api
      .post("/applications/personal")
      .set(ctx.bearer(student))
      .send(details);

    assert.equal(res.status, 201);
  });

  test("rejects an admin token with 401", async () => {
    const res = await ctx.api
      .post("/applications/personal")
      .set(ctx.bearer(admin))
      .send(details);

    assert.equal(res.status, 401);
  });
});

describe("GET /applications with personal entries", () => {
  test("lists a personal entry in the same card shape as a saved listing", async () => {
    await ctx.createPersonalApplication(student.id, { status: "applied" });

    const res = await ctx.api.get("/applications").set(ctx.bearer(student));

    assert.equal(res.status, 200);
    const [card] = res.body.applications;
    assert.equal(card.is_personal, true);
    assert.equal(card.scholarship_id, null);
    assert.equal(card.title, "SM Foundation College Scholarship");
    assert.equal(card.organization, "SM Foundation");
    assert.equal(Number(card.amount), 15000);
    assert.equal(card.deadline, "2099-06-30");
    assert.equal(card.application_status, "applied");
  });

  test("marks a saved listing as not personal", async () => {
    await ctx.createApplication(student.id, scholarship.id);

    const res = await ctx.api.get("/applications").set(ctx.bearer(student));

    const [card] = res.body.applications;
    assert.equal(card.is_personal, false);
    assert.equal(card.title, "DOST-SEI Undergraduate Scholarship");
  });

  test("does not show another student's personal entries", async () => {
    await ctx.createPersonalApplication(otherStudent.id);

    const res = await ctx.api.get("/applications").set(ctx.bearer(student));

    assert.deepEqual(res.body.applications, []);
  });
});

describe("PUT /applications/personal/:id", () => {
  test("replaces the scholarship's details", async () => {
    const entry = await ctx.createPersonalApplication(student.id);

    const res = await ctx.api
      .put(`/applications/personal/${entry.id}`)
      .set(ctx.bearer(student))
      .send({
        title: "SM Scholarship 2027",
        organization: "SM Foundation Inc.",
        amount: 20000,
        deadline: "2099-07-15",
      });

    assert.equal(res.status, 200);
    const { updatedApplication } = res.body;
    assert.equal(updatedApplication.personal_title, "SM Scholarship 2027");
    assert.equal(updatedApplication.personal_organization, "SM Foundation Inc.");
    assert.equal(Number(updatedApplication.personal_amount), 20000);
    assert.equal(updatedApplication.personal_deadline, "2099-07-15");
  });

  test("clears the amount and deadline when they are left out", async () => {
    const entry = await ctx.createPersonalApplication(student.id);

    await ctx.api
      .put(`/applications/personal/${entry.id}`)
      .set(ctx.bearer(student))
      .send({ title: "SM Scholarship 2027", organization: "SM Foundation" });

    const [row] = await allRows();
    assert.equal(row.personal_amount, null);
    assert.equal(row.personal_deadline, null);
  });

  test("leaves the stage and the notes alone", async () => {
    const entry = await ctx.createPersonalApplication(student.id, {
      status: "interview",
      notes: "Panel interview on Friday",
    });

    await ctx.api
      .put(`/applications/personal/${entry.id}`)
      .set(ctx.bearer(student))
      .send({ ...details, title: "Renamed", status: "result", notes: "overwritten" });

    const [row] = await allRows();
    assert.equal(row.personal_title, "Renamed");
    assert.equal(row.status, "interview");
    assert.equal(row.notes, "Panel interview on Friday");
  });

  test("refreshes updated_at so the tracker shows when it last changed", async () => {
    const entry = await ctx.createPersonalApplication(student.id);
    await ctx.query(
      "UPDATE applications SET updated_at = NOW() - INTERVAL '10 days' WHERE id = $1",
      [entry.id],
    );

    await ctx.api
      .put(`/applications/personal/${entry.id}`)
      .set(ctx.bearer(student))
      .send(details);

    const [row] = await ctx.query(
      "SELECT updated_at > NOW() - INTERVAL '1 minute' AS is_fresh FROM applications WHERE id = $1",
      [entry.id],
    );
    assert.equal(row.is_fresh, true);
  });

  test("does not let a student edit someone else's entry", async () => {
    const theirs = await ctx.createPersonalApplication(otherStudent.id);

    const res = await ctx.api
      .put(`/applications/personal/${theirs.id}`)
      .set(ctx.bearer(student))
      .send({ ...details, title: "hijacked" });

    assert.equal(res.status, 404);
    const [row] = await allRows();
    assert.equal(row.personal_title, "SM Foundation College Scholarship");
  });

  test("does not let a student rewrite the details of a saved listing", async () => {
    const saved = await ctx.createApplication(student.id, scholarship.id);

    const res = await ctx.api
      .put(`/applications/personal/${saved.id}`)
      .set(ctx.bearer(student))
      .send({ ...details, title: "My own title" });

    assert.equal(res.status, 404);
    const [row] = await allRows();
    assert.equal(row.scholarship_id, scholarship.id);
    assert.equal(row.personal_title, null);
  });

  test("rejects a missing title", async () => {
    const entry = await ctx.createPersonalApplication(student.id);

    const res = await ctx.api
      .put(`/applications/personal/${entry.id}`)
      .set(ctx.bearer(student))
      .send({ organization: "SM Foundation" });

    assert.equal(res.status, 400);
    const [row] = await allRows();
    assert.equal(row.personal_title, "SM Foundation College Scholarship");
  });

  test("returns 400 for an id that is not a number", async () => {
    const res = await ctx.api
      .put("/applications/personal/abc")
      .set(ctx.bearer(student))
      .send(details);

    assert.equal(res.status, 400);
  });

  test("rejects an admin token with 401", async () => {
    const entry = await ctx.createPersonalApplication(student.id);

    const res = await ctx.api
      .put(`/applications/personal/${entry.id}`)
      .set(ctx.bearer(admin))
      .send(details);

    assert.equal(res.status, 401);
  });
});

describe("the existing tracker routes on a personal entry", () => {
  test("PUT /applications/:id moves it to a new stage and keeps its details", async () => {
    const entry = await ctx.createPersonalApplication(student.id);

    const res = await ctx.api
      .put(`/applications/${entry.id}`)
      .set(ctx.bearer(student))
      .send({ status: "applied", notes: "Sent the forms by courier" });

    assert.equal(res.status, 200);
    const [row] = await allRows();
    assert.equal(row.status, "applied");
    assert.equal(row.notes, "Sent the forms by courier");
    assert.equal(row.personal_title, "SM Foundation College Scholarship");
  });

  test("DELETE /applications/:id removes it", async () => {
    const entry = await ctx.createPersonalApplication(student.id);

    const res = await ctx.api
      .delete(`/applications/${entry.id}`)
      .set(ctx.bearer(student));

    assert.equal(res.status, 200);
    assert.equal((await allRows()).length, 0);
  });
});

describe("personal entries stay private", () => {
  test("they never reach the public listings or an admin's applicant count", async () => {
    await ctx.createPersonalApplication(student.id, { title: "Only I should see this" });

    const listings = await ctx.api.get("/scholarships");
    const mine = await ctx.api.get("/scholarships/mine").set(ctx.bearer(admin));

    assert.deepEqual(
      listings.body.scholarships.map((s) => s.title),
      ["DOST-SEI Undergraduate Scholarship"],
    );
    assert.equal(mine.body.scholarships[0].applicant_count, 0);
  });
});

describe("the applications table", () => {
  const CHECK_VIOLATION = "23514";

  test("refuses a row that is both a saved listing and a personal entry", async () => {
    await assert.rejects(
      ctx.query(
        `INSERT INTO applications (student_id, scholarship_id, personal_title, personal_organization)
         VALUES ($1, $2, 'Mixed', 'Mixed')`,
        [student.id, scholarship.id],
      ),
      { code: CHECK_VIOLATION },
    );
  });

  test("refuses a row that is neither", async () => {
    await assert.rejects(
      ctx.query("INSERT INTO applications (student_id) VALUES ($1)", [student.id]),
      { code: CHECK_VIOLATION },
    );
  });
});
