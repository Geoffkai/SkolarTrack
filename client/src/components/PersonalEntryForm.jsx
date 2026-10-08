import { useState } from "react";
import { Link } from "react-router-dom";
import {
  errorText,
  inputClass,
  labelClass,
  primaryButton,
  secondaryButton,
} from "./styles";
import { findProblems, toFormValues, toPayload } from "../utils/personalEntry";

const optional = <span className="font-medium text-muted">(optional)</span>;

// The student's counterpart to ScholarshipForm, for a scholarship they found themselves.
// Shared by the Add and Edit pages: they differ only in starting values, button text,
// whether the notes are part of the form, and what happens with the finished payload.
function PersonalEntryForm({
  initialValues,
  submitLabel,
  submittingLabel,
  showNotes = false,
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
      await onSubmit(toPayload(values, showNotes));
    } catch (err) {
      console.error("Saving tracker entry failed:", err);
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
          Scholarship name
        </label>
        <input
          {...field("title")}
          type="text"
          maxLength={200}
          placeholder="SM Foundation College Scholarship"
        />
        {problemText("title")}
      </div>

      <div>
        <label htmlFor="organization" className={labelClass}>
          Who offers it
        </label>
        <input
          {...field("organization")}
          type="text"
          maxLength={200}
          placeholder="SM Foundation"
        />
        {problemText("organization")}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="amount" className={labelClass}>
            Amount in pesos {optional}
          </label>
          <input
            {...field("amount")}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="15000"
          />
          {problemText("amount")}
        </div>
        <div>
          <label htmlFor="deadline" className={labelClass}>
            Application deadline {optional}
          </label>
          <input {...field("deadline")} type="date" />
        </div>
      </div>

      {showNotes && (
        <div>
          <label htmlFor="notes" className={labelClass}>
            Notes {optional}
          </label>
          <textarea
            {...field("notes")}
            rows={4}
            maxLength={2000}
            placeholder="Where to apply, documents still needed…"
          />
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
        <Link to="/my-tracker" className={secondaryButton}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

export default PersonalEntryForm;
