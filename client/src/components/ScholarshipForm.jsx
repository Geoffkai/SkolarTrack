import { useState } from "react";
import { Link } from "react-router-dom";
import {
  errorText,
  inputClass,
  labelClass,
  primaryButton,
  secondaryButton,
} from "./styles";

const EMPTY = {
  title: "",
  organization: "",
  description: "",
  amount: "",
  slots: "",
  requirements: "",
  deadline: "",
  status: "open",
};

// A scholarship row from the API has nulls and numbers; inputs want strings.
// A null handed to value={} also flips React's input from "controlled" to "uncontrolled".
function toFormValues(scholarship) {
  const values = { ...EMPTY };
  for (const field of Object.keys(EMPTY)) {
    const value = scholarship?.[field];
    if (value !== null && value !== undefined) values[field] = String(value);
  }
  return values;
}

// The reverse trip: what the API expects. Blank optional fields become null,
// so the database stores "no value" instead of an empty string.
function toPayload(values, includeStatus) {
  const blankToNull = (text) => (text.trim() === "" ? null : text.trim());
  const payload = {
    title: values.title.trim(),
    organization: values.organization.trim(),
    description: blankToNull(values.description),
    amount: values.amount === "" ? null : Number(values.amount),
    slots: values.slots === "" ? null : Number(values.slots),
    requirements: blankToNull(values.requirements),
    deadline: values.deadline,
  };
  if (includeStatus) payload.status = values.status;
  return payload;
}

// The server checks all of this again (it has to — the browser can be bypassed).
// Checking here too just means the admin hears about a mistake before the round trip.
function findProblems(values) {
  const problems = {};
  if (values.title.trim() === "") problems.title = "Enter a title.";
  if (values.organization.trim() === "") {
    problems.organization = "Enter the organization offering it.";
  }
  if (values.deadline === "") problems.deadline = "Choose a deadline.";
  if (values.amount !== "" && !(Number(values.amount) >= 0)) {
    problems.amount = "Amount can't be negative.";
  }
  if (
    values.slots !== "" &&
    !(Number.isInteger(Number(values.slots)) && Number(values.slots) >= 0)
  ) {
    problems.slots = "Slots must be a whole number, 0 or more.";
  }
  return problems;
}

// Shared by the New and Edit pages: they differ only in starting values, button text,
// whether the status can be changed, and what happens with the finished payload.
function ScholarshipForm({
  initialValues,
  submitLabel,
  submittingLabel,
  showStatus = false,
  onSubmit,
}) {
  const [values, setValues] = useState(() => toFormValues(initialValues));
  const [problems, setProblems] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;

    setValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError(null);

    const found = findProblems(values);
    setProblems(found);
    if (Object.keys(found).length > 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(toPayload(values, showStatus));
    } catch (err) {
      console.error("Saving scholarship failed:", err);
      setSubmitError(err.message);
      setIsSubmitting(false);
    }
    // no finally: on success the page navigates away, so there is nothing left to re-enable
  }

  // Wires up one field: the label's htmlFor, the input's id/name/value, and — when the
  // field has a problem — the attributes that tie the error text to it for screen readers.
  function field(name) {
    return {
      id: name,
      name,
      value: values[name],
      onChange: handleChange,
      className: inputClass,
      "aria-invalid": problems[name] ? true : undefined,
      "aria-describedby": problems[name] ? `${name}-error` : undefined,
    };
  }

  function problemText(name) {
    return (
      problems[name] && (
        <p id={`${name}-error`} className="text-xs font-semibold text-deadline-urgent mt-1.5">
          {problems[name]}
        </p>
      )
    );
  }

  return (
    // noValidate: we show our own messages instead of the browser's pop-up bubbles
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <label htmlFor="title" className={labelClass}>
          Scholarship title
        </label>
        <input
          {...field("title")}
          type="text"
          maxLength={200}
          placeholder="DOST-SEI Undergraduate Scholarship"
        />
        {problemText("title")}
      </div>

      <div>
        <label htmlFor="organization" className={labelClass}>
          Organization
        </label>
        <input
          {...field("organization")}
          type="text"
          maxLength={200}
          placeholder="Department of Science and Technology"
        />
        {problemText("organization")}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="amount" className={labelClass}>
            Amount in pesos <span className="font-medium text-muted">(optional)</span>
          </label>
          <input
            {...field("amount")}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="40000"
          />
          {problemText("amount")}
        </div>
        <div>
          <label htmlFor="slots" className={labelClass}>
            Slots <span className="font-medium text-muted">(optional)</span>
          </label>
          <input
            {...field("slots")}
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            placeholder="100"
          />
          {problemText("slots")}
        </div>
        <div>
          <label htmlFor="deadline" className={labelClass}>
            Application deadline
          </label>
          <input {...field("deadline")} type="date" />
          {problemText("deadline")}
        </div>
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description <span className="font-medium text-muted">(optional)</span>
        </label>
        <textarea
          {...field("description")}
          rows={4}
          maxLength={5000}
          placeholder="Who is this for, and what does it cover?"
        />
      </div>

      <div>
        <label htmlFor="requirements" className={labelClass}>
          Requirements <span className="font-medium text-muted">(optional)</span>
        </label>
        <textarea
          {...field("requirements")}
          rows={4}
          maxLength={5000}
          placeholder={"One per line, e.g.\nCertified true copy of grades\nParents' income tax return"}
        />
      </div>

      {showStatus && (
        <div className="sm:max-w-xs">
          <label htmlFor="status" className={labelClass}>
            Status
          </label>
          <select {...field("status")}>
            <option value="open">Open: students can save it</option>
            <option value="closed">Closed: no longer accepting</option>
          </select>
        </div>
      )}

      {submitError && (
        <p role="alert" className={errorText}>
          {submitError}
        </p>
      )}

      <div className="flex flex-wrap gap-3 mt-2">
        <button type="submit" disabled={isSubmitting} className={primaryButton}>
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
        <Link to="/admin/dashboard" className={secondaryButton}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

export default ScholarshipForm;
