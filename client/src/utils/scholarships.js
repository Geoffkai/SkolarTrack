import { isClosingSoon } from "./dates.js";

// The sort options offered on the browse page: value -> label shown in the dropdown.
export const SORT_OPTIONS = {
  deadline: "Deadline: soonest first",
  amount: "Amount: highest first",
  newest: "Newest listings first",
};

// Searches every text field, not just the title. There is no "course" column, so this is
// what makes typing a course name ("engineering", "nursing") find the scholarships for it.
function matchesSearch(scholarship, query) {
  if (!query) return true;
  return [
    scholarship.title,
    scholarship.organization,
    scholarship.description,
    scholarship.requirements,
  ].some((text) => text?.toLowerCase().includes(query));
}

export function filterScholarships(scholarships, filters = {}, now = new Date()) {
  const {
    search = "",
    openOnly = false,
    closingSoon = false,
    minAmount = 0,
  } = filters;
  const query = search.trim().toLowerCase();

  return scholarships.filter((scholarship) => {
    if (openOnly && scholarship.status !== "open") return false;
    if (closingSoon && !isClosingSoon(scholarship.deadline, now)) return false;
    // a listing with no stated amount can't be said to meet a minimum
    if (minAmount > 0 && !(Number(scholarship.amount) >= minAmount)) return false;
    return matchesSearch(scholarship, query);
  });
}

const COMPARATORS = {
  // "YYYY-MM-DD" strings sort correctly as plain text
  deadline: (a, b) => a.deadline.localeCompare(b.deadline),
  // a missing amount counts as -1 so it always lands after real amounts
  amount: (a, b) => Number(b.amount ?? -1) - Number(a.amount ?? -1),
  newest: (a, b) => new Date(b.created_at) - new Date(a.created_at),
};

// Returns a NEW array: .sort() reorders in place, and the input here is React state.
export function sortScholarships(scholarships, sortBy) {
  const compare = COMPARATORS[sortBy];
  return compare ? [...scholarships].sort(compare) : scholarships;
}
