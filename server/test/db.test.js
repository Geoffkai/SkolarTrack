const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { setTestEnv } = require("./helpers/testApp");

// config/db.js changes how the pg driver turns raw column text into JS values.
// These call the driver's parsers directly with the text Postgres would send.
setTestEnv();
require("../src/config/db");
const { types } = require("pg");

const DATE = 1082;
const TIMESTAMP = 1114;

describe("how database values are read", () => {
  test("a DATE stays a plain string, so a deadline can never shift by a day", () => {
    assert.equal(types.getTypeParser(DATE)("2026-12-31"), "2026-12-31");
  });

  test("a TIMESTAMP is read as UTC, whatever timezone this machine is in", () => {
    const parsed = types.getTypeParser(TIMESTAMP)("2026-10-07 19:00:41.902");

    assert.equal(parsed.toISOString(), "2026-10-07T19:00:41.902Z");
  });
});
