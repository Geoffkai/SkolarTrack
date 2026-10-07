import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  daysUntil,
  deadlineStatus,
  formatDate,
  timeAgo,
} from "../src/utils/dates.js";

// A fixed "now" in LOCAL time, so the tests give the same answer on any machine.
const at = (hour, minute = 0) => new Date(2026, 9, 8, hour, minute); // 8 Oct 2026

describe("daysUntil", () => {
  test("a deadline today is 0 days away first thing in the morning", () => {
    assert.equal(daysUntil("2026-10-08", at(0, 1)), 0);
  });

  test("a deadline today is still 0 days away late at night", () => {
    assert.equal(daysUntil("2026-10-08", at(23, 59)), 0);
  });

  test("tomorrow is 1 day away no matter the time of day", () => {
    assert.equal(daysUntil("2026-10-09", at(0, 1)), 1);
    assert.equal(daysUntil("2026-10-09", at(23, 59)), 1);
  });

  test("yesterday is -1", () => {
    assert.equal(daysUntil("2026-10-07", at(12)), -1);
  });

  test("counts across a month boundary", () => {
    assert.equal(daysUntil("2026-11-02", at(12)), 25);
  });
});

describe("deadlineStatus", () => {
  const open = (deadline) => ({ status: "open", deadline });

  test("a closed listing reads Closed even if its date is in the future", () => {
    const result = deadlineStatus(
      { status: "closed", deadline: "2026-12-31" },
      at(12),
    );
    assert.deepEqual(result, { label: "Closed", isUrgent: false, isOver: true });
  });

  test("an open listing past its date reads Deadline passed", () => {
    const result = deadlineStatus(open("2026-10-01"), at(12));
    assert.deepEqual(result, {
      label: "Deadline passed",
      isUrgent: false,
      isOver: true,
    });
  });

  test("due today is urgent", () => {
    const result = deadlineStatus(open("2026-10-08"), at(12));
    assert.deepEqual(result, {
      label: "Due today",
      isUrgent: true,
      isOver: false,
    });
  });

  test("one day uses the singular", () => {
    assert.equal(deadlineStatus(open("2026-10-09"), at(12)).label, "1 day left");
  });

  test("14 days out is still urgent, 15 is not", () => {
    assert.equal(deadlineStatus(open("2026-10-22"), at(12)).isUrgent, true);
    assert.equal(deadlineStatus(open("2026-10-23"), at(12)).isUrgent, false);
    assert.equal(
      deadlineStatus(open("2026-10-23"), at(12)).label,
      "15 days left",
    );
  });
});

describe("formatDate", () => {
  test("writes a date-only string out in full without shifting the day", () => {
    assert.equal(formatDate("2026-12-31"), "December 31, 2026");
  });

  test("returns an empty string when there is no date", () => {
    assert.equal(formatDate(null), "");
  });
});

describe("timeAgo", () => {
  const now = at(15);

  test("earlier the same day is Today", () => {
    assert.equal(timeAgo(at(9).toISOString(), now), "Today");
  });

  test("the previous calendar day is Yesterday, even if under 24 hours ago", () => {
    assert.equal(
      timeAgo(new Date(2026, 9, 7, 22).toISOString(), now),
      "Yesterday",
    );
  });

  test("a few days back counts days", () => {
    assert.equal(
      timeAgo(new Date(2026, 9, 3, 10).toISOString(), now),
      "5 days ago",
    );
  });

  test("a week or more counts weeks", () => {
    assert.equal(
      timeAgo(new Date(2026, 9, 1, 10).toISOString(), now),
      "1 week ago",
    );
    assert.equal(
      timeAgo(new Date(2026, 8, 16, 10).toISOString(), now),
      "3 weeks ago",
    );
  });

  test("a month or more counts months", () => {
    assert.equal(
      timeAgo(new Date(2026, 6, 1, 10).toISOString(), now),
      "3 months ago",
    );
  });
});
