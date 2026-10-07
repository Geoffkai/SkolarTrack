const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { createTestApp } = require("./helpers/testApp");

let ctx;
before(async () => {
  ctx = await createTestApp();
});
after(() => ctx.close());

describe("health check", () => {
  test("reports the database connection", async () => {
    const res = await ctx.api.get("/health");

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { status: "ok", db: "connected" });
  });

  test("reports an unreachable database as a 500 and logs the reason", async (t) => {
    const pool = require("../src/config/db");
    t.mock.method(pool, "query", async () => {
      throw new Error("connect ETIMEDOUT");
    });
    const serverLog = t.mock.method(console, "error", () => {});

    const res = await ctx.api.get("/health");

    assert.equal(res.status, 500);
    assert.deepEqual(res.body, { status: "error", db: "disconnected" });
    // without this line in the log there is no way to tell WHY it was unreachable
    assert.equal(serverLog.mock.callCount(), 1);
    assert.match(serverLog.mock.calls[0].arguments.join(" "), /ETIMEDOUT/);
  });
});

describe("security headers", () => {
  test("tells browsers not to sniff content types", async () => {
    const res = await ctx.api.get("/health");

    assert.equal(res.headers["x-content-type-options"], "nosniff");
  });

  test("does not advertise that the server runs Express", async () => {
    const res = await ctx.api.get("/health");

    assert.equal(res.headers["x-powered-by"], undefined);
  });
});

describe("CORS", () => {
  test("allows an origin on the allowlist, even when the env value has spaces", async () => {
    const res = await ctx.api
      .get("/scholarships")
      .set("Origin", "https://skolar-track.vercel.app");

    assert.equal(
      res.headers["access-control-allow-origin"],
      "https://skolar-track.vercel.app",
    );
  });

  test("gives an unknown origin no permission to read the response", async () => {
    const res = await ctx.api
      .get("/scholarships")
      .set("Origin", "https://evil.example.com");

    assert.equal(res.headers["access-control-allow-origin"], undefined);
  });
});

describe("error responses are always JSON", () => {
  test("an unknown route returns a JSON 404", async () => {
    const res = await ctx.api.get("/no-such-route");

    assert.equal(res.status, 404);
    assert.match(res.headers["content-type"], /json/);
    assert.equal(typeof res.body.error, "string");
  });

  test("a malformed JSON body returns a JSON 400", async () => {
    const res = await ctx.api
      .post("/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email": ');

    assert.equal(res.status, 400);
    assert.match(res.headers["content-type"], /json/);
    assert.equal(typeof res.body.error, "string");
  });

  test("an oversized body returns a JSON 413", async () => {
    const res = await ctx.api
      .post("/auth/login")
      .send({ email: "a@b.co", password: "x".repeat(200_000) });

    assert.equal(res.status, 413);
    assert.match(res.headers["content-type"], /json/);
  });

  test("a server error never leaks internals to the client", async (t) => {
    const pool = require("../src/config/db");
    // t.mock restores both of these automatically when the test ends
    t.mock.method(pool, "query", async () => {
      throw new Error("connection to neon failed: password=hunter2");
    });
    const serverLog = t.mock.method(console, "error", () => {});

    const res = await ctx.api.get("/scholarships");

    assert.equal(res.status, 500);
    assert.doesNotMatch(JSON.stringify(res.body), /hunter2|neon|stack/i);
    // the detail is not lost — it goes to the server log, where only we can read it
    assert.equal(serverLog.mock.callCount(), 1);
  });
});
