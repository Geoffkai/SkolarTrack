import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  findProblems,
  toFormValues,
  toPayload,
} from "../src/utils/personalEntry.js";

const filledIn = {
  title: "SM Foundation College Scholarship",
  organization: "SM Foundation",
  amount: "15000",
  deadline: "2026-12-31",
  notes: "Apply at the mall branch",
};

describe("toFormValues", () => {
  test("turns a tracker entry's nulls and numbers into strings for the inputs", () => {
    const entry = {
      id: 7,
      title: "Barangay Scholarship",
      organization: "Barangay San Roque",
      amount: 5000,
      deadline: null,
      notes: null,
    };

    assert.deepEqual(toFormValues(entry), {
      title: "Barangay Scholarship",
      organization: "Barangay San Roque",
      amount: "5000",
      deadline: "",
      notes: "",
    });
  });

  test("starts every field blank when there is no entry yet", () => {
    assert.deepEqual(toFormValues(undefined), {
      title: "",
      organization: "",
      amount: "",
      deadline: "",
      notes: "",
    });
  });
});

describe("toPayload", () => {
  test("sends the amount as a number and keeps the deadline as typed", () => {
    assert.deepEqual(toPayload(filledIn, true), {
      title: "SM Foundation College Scholarship",
      organization: "SM Foundation",
      amount: 15000,
      deadline: "2026-12-31",
      notes: "Apply at the mall branch",
    });
  });

  test("trims the text and sends blank optional fields as null", () => {
    const values = {
      title: "  Barangay Scholarship ",
      organization: " Barangay San Roque  ",
      amount: "",
      deadline: "",
      notes: "   ",
    };

    assert.deepEqual(toPayload(values, true), {
      title: "Barangay Scholarship",
      organization: "Barangay San Roque",
      amount: null,
      deadline: null,
      notes: null,
    });
  });

  test("leaves the notes out when the form isn't editing them", () => {
    assert.equal("notes" in toPayload(filledIn, false), false);
  });
});

describe("findProblems", () => {
  const fieldsWithProblems = (changes) =>
    Object.keys(findProblems({ ...filledIn, ...changes }));

  test("finds nothing wrong with a complete entry", () => {
    assert.deepEqual(fieldsWithProblems({}), []);
  });

  test("accepts an entry with no amount, deadline or notes", () => {
    assert.deepEqual(fieldsWithProblems({ amount: "", deadline: "", notes: "" }), []);
  });

  test("flags a blank title", () => {
    assert.deepEqual(fieldsWithProblems({ title: "   " }), ["title"]);
  });

  test("flags a blank organization", () => {
    assert.deepEqual(fieldsWithProblems({ organization: "" }), ["organization"]);
  });

  test("flags a negative amount", () => {
    assert.deepEqual(fieldsWithProblems({ amount: "-500" }), ["amount"]);
  });
});
