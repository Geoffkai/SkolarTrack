import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  filterScholarships,
  sortScholarships,
} from "../src/utils/scholarships.js";

const NOW = new Date(2026, 9, 8, 12); // 8 Oct 2026, local time

const dost = {
  id: 1,
  title: "DOST-SEI Undergraduate Scholarship",
  organization: "DOST",
  description: "For students taking priority science courses",
  requirements: "BS Engineering or BS Computer Science applicants",
  amount: "40000.00",
  deadline: "2026-10-15",
  status: "open",
  created_at: "2026-09-01T00:00:00.000Z",
};
const sm = {
  id: 2,
  title: "SM Foundation College Scholarship",
  organization: "SM Foundation",
  description: null,
  requirements: null,
  amount: "100000",
  deadline: "2026-12-20",
  status: "open",
  created_at: "2026-10-01T00:00:00.000Z",
};
const closed = {
  id: 3,
  title: "Ayala Young Leaders Grant",
  organization: "Ayala Foundation",
  description: "Leadership grant",
  requirements: null,
  amount: null,
  deadline: "2026-11-01",
  status: "closed",
  created_at: "2026-08-01T00:00:00.000Z",
};
const all = [dost, sm, closed];

const ids = (rows) => rows.map((row) => row.id);

describe("filterScholarships", () => {
  test("with no filters, keeps everything", () => {
    assert.deepEqual(ids(filterScholarships(all, {}, NOW)), [1, 2, 3]);
  });

  test("search matches the title, ignoring case", () => {
    const result = filterScholarships(all, { search: "sm foundation" }, NOW);
    assert.deepEqual(ids(result), [2]);
  });

  test("search matches the organization", () => {
    const result = filterScholarships(all, { search: "ayala" }, NOW);
    assert.deepEqual(ids(result), [3]);
  });

  test("search reaches into requirements, so a course name finds its scholarships", () => {
    const result = filterScholarships(all, { search: "engineering" }, NOW);
    assert.deepEqual(ids(result), [1]);
  });

  test("openOnly drops closed listings", () => {
    const result = filterScholarships(all, { openOnly: true }, NOW);
    assert.deepEqual(ids(result), [1, 2]);
  });

  test("minAmount drops smaller amounts and listings with no stated amount", () => {
    const result = filterScholarships(all, { minAmount: 50000 }, NOW);
    assert.deepEqual(ids(result), [2]);
  });

  test("closingSoon keeps only deadlines in the next 14 days", () => {
    const result = filterScholarships(all, { closingSoon: true }, NOW);
    assert.deepEqual(ids(result), [1]);
  });

  test("filters combine", () => {
    const result = filterScholarships(
      all,
      { search: "scholarship", openOnly: true, minAmount: 50000 },
      NOW,
    );
    assert.deepEqual(ids(result), [2]);
  });
});

describe("sortScholarships", () => {
  test("deadline puts the soonest first", () => {
    assert.deepEqual(ids(sortScholarships(all, "deadline")), [1, 3, 2]);
  });

  test("amount puts the largest first and unstated amounts last", () => {
    assert.deepEqual(ids(sortScholarships(all, "amount")), [2, 1, 3]);
  });

  test("newest puts the most recently posted first", () => {
    assert.deepEqual(ids(sortScholarships(all, "newest")), [2, 1, 3]);
  });

  test("does not reorder the array it was given", () => {
    const input = [sm, dost];
    sortScholarships(input, "deadline");
    assert.deepEqual(ids(input), [2, 1]);
  });
});
