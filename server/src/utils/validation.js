// Pure input checks — no req/res, no SQL — so controllers stay thin and these stay
// easy to reason about. Every validator returns { error } OR { value }, never both:
// `value` is the cleaned-up input (trimmed, blanks turned into null) that is safe to
// hand to a model.

const MAX_INT = 2147483647; // upper bound of a Postgres INTEGER / SERIAL column
const APPLICATION_STATUSES = ["interested", "applied", "interview", "result"];
const SCHOLARSHIP_STATUSES = ["open", "closed"];

const LIMITS = {
  email: 254,
  shortText: 200,
  longText: 5000,
  notes: 2000,
  passwordMin: 8,
  // bcrypt only reads the first 72 bytes — anything longer would be silently ignored.
  passwordMaxBytes: 72,
};

// req.body is undefined when a request has no JSON body, and JSON also allows
// arrays/strings/numbers at the top level. Treat anything that isn't a plain object as empty.
function asObject(body) {
  return body !== null && typeof body === "object" && !Array.isArray(body)
    ? body
    : {};
}

// Accepts 12 or "12". Rejects "abc", "1.5", -1, 0 and anything Postgres would overflow on.
function parseId(raw) {
  const text = typeof raw === "number" ? String(raw) : raw;
  if (typeof text !== "string" || !/^[1-9]\d{0,9}$/.test(text)) return null;
  const id = Number(text);
  return id <= MAX_INT ? id : null;
}

function requiredText(input, field, max) {
  const raw = input[field];
  if (typeof raw !== "string" || raw.trim() === "") {
    return { error: `${field} is required` };
  }
  const value = raw.trim();
  if (value.length > max) {
    return { error: `${field} must be ${max} characters or fewer` };
  }
  return { value };
}

// Missing, null and "" all mean "not provided" and are stored as NULL.
function optionalText(input, field, max) {
  const raw = input[field];
  if (raw === undefined || raw === null) return { value: null };
  if (typeof raw !== "string") return { error: `${field} must be text` };
  const value = raw.trim();
  if (value.length > max) {
    return { error: `${field} must be ${max} characters or fewer` };
  }
  return { value: value === "" ? null : value };
}

function isBlank(raw) {
  return raw === undefined || raw === null || raw === "";
}

// Pesos: 0 or more, at most two decimal places.
function optionalAmount(input) {
  const raw = input.amount;
  if (isBlank(raw)) return { value: null };
  const error = { error: "amount must be a number that is 0 or more" };
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw >= 0 && raw < 1e12 ? { value: raw } : error;
  }
  if (typeof raw === "string" && /^\d{1,12}(\.\d{1,2})?$/.test(raw.trim())) {
    return { value: raw.trim() };
  }
  return error;
}

function optionalSlots(input) {
  const raw = input.slots;
  if (isBlank(raw)) return { value: null };
  const value =
    typeof raw === "string" && /^\d{1,10}$/.test(raw.trim())
      ? Number(raw.trim())
      : raw;
  if (!Number.isInteger(value) || value < 0 || value > MAX_INT) {
    return { error: "slots must be a whole number that is 0 or more" };
  }
  return { value };
}

// Must look like YYYY-MM-DD *and* be a real calendar day (2099-02-30 is not).
function requiredDate(input, field) {
  const raw = input[field];
  const match =
    typeof raw === "string" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw) : null;
  if (!match) return { error: `${field} must be a date in YYYY-MM-DD format` };

  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDay =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  return isRealDay
    ? { value: raw }
    : { error: `${field} is not a real calendar date` };
}

// Runs each field check in order and stops at the first problem.
function collect(checks) {
  const value = {};
  for (const [field, result] of Object.entries(checks)) {
    if (result.error) return { error: result.error };
    value[field] = result.value;
  }
  return { value };
}

function normalizeEmail(raw) {
  if (typeof raw !== "string") return { error: "email is required" };
  const value = raw.trim().toLowerCase();
  if (value === "") return { error: "email is required" };
  if (value.length > LIMITS.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { error: "email is not a valid email address" };
  }
  return { value };
}

function newPassword(raw) {
  if (typeof raw !== "string" || raw === "") {
    return { error: "password is required" };
  }
  if (raw.length < LIMITS.passwordMin) {
    return {
      error: `password must be at least ${LIMITS.passwordMin} characters`,
    };
  }
  if (Buffer.byteLength(raw, "utf8") > LIMITS.passwordMaxBytes) {
    return {
      error: `password must be ${LIMITS.passwordMaxBytes} characters or fewer`,
    };
  }
  return { value: raw };
}

function validateRegistration(body) {
  const input = asObject(body);
  return collect({
    email: normalizeEmail(input.email),
    password: newPassword(input.password),
    name: optionalText(input, "name", LIMITS.shortText),
    course: optionalText(input, "course", LIMITS.shortText),
    school: optionalText(input, "school", LIMITS.shortText),
  });
}

// Login deliberately does NOT apply the password rules: an account created before the
// rules existed must still be able to sign in. It only needs to be non-empty text.
function validateLogin(body) {
  const input = asObject(body);
  const { email, password } = input;
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    email.trim() === "" ||
    password === ""
  ) {
    return { error: "email and password are required" };
  }
  return { value: { email: email.trim().toLowerCase(), password } };
}

function validateScholarship(body, { requireStatus = false } = {}) {
  const input = asObject(body);
  const checks = {
    title: requiredText(input, "title", LIMITS.shortText),
    organization: requiredText(input, "organization", LIMITS.shortText),
    description: optionalText(input, "description", LIMITS.longText),
    amount: optionalAmount(input),
    slots: optionalSlots(input),
    requirements: optionalText(input, "requirements", LIMITS.longText),
    deadline: requiredDate(input, "deadline"),
  };
  if (requireStatus) {
    checks.status = SCHOLARSHIP_STATUSES.includes(input.status)
      ? { value: input.status }
      : { error: `status must be one of: ${SCHOLARSHIP_STATUSES.join(", ")}` };
  }
  return collect(checks);
}

function validateNewApplication(body) {
  const input = asObject(body);
  const scholarshipId = parseId(input.scholarshipId);
  return collect({
    scholarshipId:
      scholarshipId === null
        ? { error: "scholarshipId must be a valid scholarship id" }
        : { value: scholarshipId },
    notes: optionalText(input, "notes", LIMITS.notes),
  });
}

function validateApplicationUpdate(body) {
  const input = asObject(body);
  return collect({
    status: APPLICATION_STATUSES.includes(input.status)
      ? { value: input.status }
      : { error: `status must be one of: ${APPLICATION_STATUSES.join(", ")}` },
    notes: optionalText(input, "notes", LIMITS.notes),
  });
}

module.exports = {
  parseId,
  validateRegistration,
  validateLogin,
  validateScholarship,
  validateNewApplication,
  validateApplicationUpdate,
};
