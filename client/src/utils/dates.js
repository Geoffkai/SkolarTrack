// Date helpers: pure calculations, shared by every page that shows a deadline.
// Each takes an optional `now` so tests can pin the current time.

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const URGENT_WITHIN_DAYS = 14;

// "2026-12-31" -> a Date at LOCAL midnight on that day.
// new Date("2026-12-31") would mean midnight UTC, which is 8 AM in the Philippines —
// so "days left" would change at 8 in the morning instead of at midnight.
function parseDateOnly(value) {
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Whole calendar days between two moments, ignoring the time of day.
function calendarDaysBetween(from, to) {
  return Math.round((startOfDay(to) - startOfDay(from)) / MS_PER_DAY);
}

// 0 = the deadline is today, negative = it has passed.
export function daysUntil(deadline, now = new Date()) {
  return calendarDaysBetween(now, parseDateOnly(deadline));
}

// One answer to "what do we show for this scholarship's deadline?",
// so the list, the detail page, the tracker and the dashboard can never disagree.
export function deadlineStatus(scholarship, now = new Date()) {
  if (scholarship.status === "closed") {
    return { label: "Closed", isUrgent: false, isOver: true };
  }
  const days = daysUntil(scholarship.deadline, now);
  if (days < 0) {
    return { label: "Deadline passed", isUrgent: false, isOver: true };
  }
  const label =
    days === 0 ? "Due today" : `${days} day${days === 1 ? "" : "s"} left`;
  return { label, isUrgent: days <= URGENT_WITHIN_DAYS, isOver: false };
}

export function isClosingSoon(deadline, now = new Date()) {
  const days = daysUntil(deadline, now);
  return days >= 0 && days <= URGENT_WITHIN_DAYS;
}

// "2026-12-31" -> "December 31, 2026"
export function formatDate(value) {
  if (!value) return "";
  return parseDateOnly(value).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function plural(count, unit) {
  return `${count} ${unit}${count === 1 ? "" : "s"} ago`;
}

// A full timestamp -> "Today", "Yesterday", "5 days ago", "3 weeks ago", "2 months ago"
export function timeAgo(timestamp, now = new Date()) {
  const days = calendarDaysBetween(new Date(timestamp), now);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return plural(days, "day");
  if (days < 30) return plural(Math.floor(days / 7), "week");
  return plural(Math.floor(days / 30), "month");
}
