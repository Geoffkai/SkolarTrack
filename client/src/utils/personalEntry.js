// Helpers for the form a student uses to add a scholarship of their own to the tracker.
// Pure conversions and checks, kept out of the component so they can be tested.

const EMPTY = {
  title: "",
  organization: "",
  amount: "",
  deadline: "",
  notes: "",
};

// A tracker entry from the API has nulls and numbers; inputs want strings.
// A null handed to value={} also flips React's input from "controlled" to "uncontrolled".
export function toFormValues(entry) {
  const values = { ...EMPTY };
  for (const field of Object.keys(EMPTY)) {
    const value = entry?.[field];
    if (value !== null && value !== undefined) values[field] = String(value);
  }
  return values;
}

// The reverse trip: what the API expects. Blank optional fields become null,
// so the database stores "no value" instead of an empty string.
export function toPayload(values, includeNotes) {
  const payload = {
    title: values.title.trim(),
    organization: values.organization.trim(),
    amount: values.amount === "" ? null : Number(values.amount),
    deadline: values.deadline === "" ? null : values.deadline,
  };
  if (includeNotes) {
    payload.notes = values.notes.trim() === "" ? null : values.notes.trim();
  }
  return payload;
}

// The server checks all of this again (it has to — the browser can be bypassed).
// Checking here too just means the student hears about a mistake before the round trip.
export function findProblems(values) {
  const problems = {};
  if (values.title.trim() === "") {
    problems.title = "Enter the scholarship's name.";
  }
  if (values.organization.trim() === "") {
    problems.organization = "Enter who offers it.";
  }
  if (values.amount !== "" && !(Number(values.amount) >= 0)) {
    problems.amount = "Amount can't be negative.";
  }
  return problems;
}
