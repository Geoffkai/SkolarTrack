const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { createTestApp } = require("./helpers/testApp");

// Own file on purpose: node --test runs each file in its own process, so this
// file's tiny limit and its exhausted counters cannot leak into the other suites.
let ctx;
before(async () => {
  ctx = await createTestApp({ AUTH_RATE_LIMIT_MAX: "3" });
});
after(() => ctx.close());

const badLogin = () =>
  ctx.api
    .post("/auth/login")
    .send({ email: "nobody@up.edu.ph", password: "wrong-password" });

describe("auth rate limiting", () => {
  test("blocks further login attempts once the failed-attempt limit is hit", async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      assert.equal((await badLogin()).status, 401);
    }

    const blocked = await badLogin();

    assert.equal(blocked.status, 429);
    assert.equal(typeof blocked.body.error, "string");
  });

  test("does not rate limit the public scholarship list", async () => {
    for (let i = 0; i < 6; i++) {
      assert.equal((await ctx.api.get("/scholarships")).status, 200);
    }
  });
});
