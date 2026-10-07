import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getSession } from "../src/services/auth.js";

// Builds a token with a real-looking shape. The signature is junk on purpose:
// the browser never verifies signatures — only the server can.
function makeToken(payload) {
  const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`;
}

const NOW = 1_800_000_000_000; // a fixed "current time" in milliseconds
const inOneHour = NOW / 1000 + 3600;
const oneHourAgo = NOW / 1000 - 3600;

describe("getSession", () => {
  test("reads the user id and role out of a live token", () => {
    const token = makeToken({ userId: 7, role: "admin", exp: inOneHour });

    assert.deepEqual(getSession(token, NOW), { userId: 7, role: "admin" });
  });

  test("returns null once the token has expired", () => {
    const token = makeToken({ userId: 7, role: "student", exp: oneHourAgo });

    assert.equal(getSession(token, NOW), null);
  });

  test("decodes payloads that use the URL-safe base64 characters - and _", () => {
    const token = makeToken({
      userId: 1,
      role: "student",
      note: "??>>~~??>>~~",
      exp: inOneHour,
    });
    assert.match(token.split(".")[1], /[-_]/);

    assert.deepEqual(getSession(token, NOW), { userId: 1, role: "student" });
  });

  for (const junk of [null, undefined, "", "not-a-token", "a.b.c", "a.%%%.c", 12345]) {
    test(`returns null instead of throwing for ${JSON.stringify(junk)}`, () => {
      assert.equal(getSession(junk, NOW), null);
    });
  }

  test("returns null when the payload has no role", () => {
    const token = makeToken({ userId: 7, exp: inOneHour });

    assert.equal(getSession(token, NOW), null);
  });
});
