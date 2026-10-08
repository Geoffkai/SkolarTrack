import { useState } from "react";
import { Link } from "react-router-dom";
import { deadlineStatus, timeAgo } from "../utils/dates";
import { formatPeso } from "../utils/format";
import { STAGES, stageFor } from "../utils/stages";

const smallButton =
  "text-xs font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";

// One scholarship on the tracker board: a saved listing, or one the student added
// themselves (is_personal). The card owns its own little bits of UI state
// (is the note being edited? is a save in flight?); the actual API calls belong to the page,
// which passes them in as onUpdate / onRemove.
function TrackerCard({ application, onUpdate, onRemove }) {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [draftNote, setDraftNote] = useState("");
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState(null);

  const stage = stageFor(application.application_status);
  const deadline = deadlineStatus({
    status: application.scholarship_status,
    deadline: application.deadline,
  });

  // Every change goes through here so the busy/error handling is written once.
  async function run(action) {
    setError(null);
    setIsBusy(true);
    try {
      await action();
      return true;
    } catch (err) {
      console.error("Tracker update failed:", err);
      setError(err.message);
      return false;
    } finally {
      setIsBusy(false);
    }
  }

  // PUT replaces the whole application, so the field we're NOT changing is sent along unchanged.
  function handleStageChange(e) {
    const status = e.target.value;
    run(() => onUpdate(application.id, { status, notes: application.notes }));
  }

  function startEditingNote() {
    setDraftNote(application.notes ?? "");
    setIsEditingNote(true);
  }

  async function handleSaveNote(e) {
    e.preventDefault();
    const saved = await run(() =>
      onUpdate(application.id, {
        status: application.application_status,
        notes: draftNote.trim() === "" ? null : draftNote.trim(),
      }),
    );
    if (saved) setIsEditingNote(false);
  }

  function handleRemove() {
    // on success the card disappears with the rest of the row, so there's nothing to reset
    run(() => onRemove(application.id));
  }

  return (
    <li
      className={`bg-white border-l-4 ${stage.bar} rounded-r-xl p-3.5 shadow-sm`}
    >
      {application.is_personal ? (
        // The student added this one themselves, so there is no listing page to link to.
        <>
          <span className="inline-block text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-chip text-ink mb-1.5">
            Added by you
          </span>
          <p className="font-display font-bold text-[13px] text-ink">
            {application.title}
          </p>
        </>
      ) : (
        <Link
          to={`/scholarships/${application.scholarship_id}`}
          className="block font-display font-bold text-[13px] text-ink hover:underline"
        >
          {application.title}
        </Link>
      )}
      <p className="text-[11px] font-semibold text-muted mt-0.5">
        {application.organization}
      </p>

      <p className="text-[11px] mt-2">
        <span className="font-semibold text-amount">
          {formatPeso(application.amount, "Amount not stated")}
        </span>
        <span className="text-muted"> · </span>
        <span
          className={
            deadline.isUrgent
              ? "font-bold text-deadline-urgent"
              : "font-semibold text-muted"
          }
        >
          {deadline.label}
        </span>
      </p>

      <div className="mt-3">
        <label
          htmlFor={`stage-${application.id}`}
          className="block text-[10.5px] font-bold text-muted mb-1"
        >
          Stage
        </label>
        <select
          id={`stage-${application.id}`}
          value={application.application_status}
          onChange={handleStageChange}
          disabled={isBusy}
          className="w-full px-2.5 py-2 rounded-lg border border-border bg-background text-xs font-semibold text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
        >
          {STAGES.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isEditingNote ? (
        <form onSubmit={handleSaveNote} className="mt-3">
          <label
            htmlFor={`note-${application.id}`}
            className="block text-[10.5px] font-bold text-muted mb-1"
          >
            Note
          </label>
          <textarea
            id={`note-${application.id}`}
            value={draftNote}
            onChange={(e) => setDraftNote(e.target.value)}
            rows={3}
            maxLength={2000}
            autoFocus
            placeholder="Interview date, documents still needed…"
            className="w-full px-2.5 py-2 rounded-lg border border-border bg-background text-xs text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <div className="flex gap-3 mt-1.5">
            <button
              type="submit"
              disabled={isBusy}
              className={`${smallButton} text-primary`}
            >
              {isBusy ? "Saving…" : "Save note"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditingNote(false)}
              disabled={isBusy}
              className={`${smallButton} text-muted`}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        application.notes && (
          // whitespace-pre-line keeps the line breaks the student typed
          <p className="text-xs text-ink mt-3 whitespace-pre-line wrap-break-word">
            {application.notes}
          </p>
        )
      )}

      {error && (
        <p role="alert" className="text-xs font-semibold text-deadline-urgent mt-2">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mt-3 pt-2.5 border-t border-border">
        <span className="text-[10.5px] text-muted">
          Updated {timeAgo(application.updated_at).toLowerCase()}
        </span>

        {isConfirmingRemove ? (
          <span className="flex items-center gap-3">
            <span className="text-[11px] font-semibold text-ink">Remove it?</span>
            <button
              onClick={handleRemove}
              disabled={isBusy}
              className={`${smallButton} text-deadline-urgent`}
            >
              {isBusy ? "Removing…" : "Yes, remove"}
            </button>
            <button
              onClick={() => setIsConfirmingRemove(false)}
              disabled={isBusy}
              className={`${smallButton} text-muted`}
            >
              Keep
            </button>
          </span>
        ) : (
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {application.is_personal && (
              <Link
                to={`/my-tracker/${application.id}/edit`}
                className={`${smallButton} text-primary`}
              >
                Edit details
              </Link>
            )}
            {!isEditingNote && (
              <button
                onClick={startEditingNote}
                disabled={isBusy}
                className={`${smallButton} text-primary`}
              >
                {application.notes ? "Edit note" : "Add note"}
              </button>
            )}
            <button
              onClick={() => setIsConfirmingRemove(true)}
              disabled={isBusy}
              className={`${smallButton} text-muted hover:text-deadline-urgent`}
            >
              Remove
            </button>
          </span>
        )}
      </div>
    </li>
  );
}

export default TrackerCard;
