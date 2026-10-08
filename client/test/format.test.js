import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { formatPeso } from "../src/utils/format.js";

describe("formatPeso", () => {
  test("adds the peso sign and thousands separators", () => {
    assert.equal(formatPeso("40000.00"), "₱40,000");
  });

  test("shows centavos with two digits when there are any", () => {
    assert.equal(formatPeso("35000.50"), "₱35,000.50");
    assert.equal(formatPeso(1234.5), "₱1,234.50");
  });

  test("shows zero as an amount, not as missing", () => {
    assert.equal(formatPeso(0), "₱0");
  });

  for (const missing of [null, undefined, "", "not a number"]) {
    test(`falls back to a dash for ${JSON.stringify(missing)}`, () => {
      assert.equal(formatPeso(missing), "—");
    });
  }

  test("uses the caller's wording for a missing amount when given one", () => {
    assert.equal(formatPeso(null, "Not stated"), "Not stated");
  });
});
