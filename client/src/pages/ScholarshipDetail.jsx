import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import apiFetch from "../services/api";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/useAuth";
import { ErrorState, Loading } from "../components/PageState";
import {
  errorText,
  primaryButton,
  secondaryButton,
} from "../components/styles";
import { deadlineStatus, formatDate } from "../utils/dates";
import { formatPeso } from "../utils/format";
import { stageFor } from "../utils/stages";

function ScholarshipDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { token, role, userId } = useAuth();

  const { data, error, isLoading, retry } = useApi(`/scholarships/${id}`);
  // Only students have a tracker. Passing null skips the request for everyone else —
  // an admin token on /applications would be refused, and a visitor has no token at all.
  const tracker = useApi(role === "student" ? "/applications" : null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  if (isLoading) {
    return <Loading label="Loading scholarship…" />;
  }

  if (error) {
    // 404 = no such id, 400 = the id in the URL isn't even a number. Retrying won't help either.
    const isMissing = error.status === 404 || error.status === 400;
    return (
      <ErrorState
        message={
          isMissing
            ? "This scholarship doesn't exist or has been removed."
            : error.message
        }
        onRetry={isMissing ? undefined : retry}
      >
        <Link to="/scholarships" className={secondaryButton}>
          Browse scholarships
        </Link>
      </ErrorState>
    );
  }

  const scholarship = data.scholarship;
  const deadline = deadlineStatus(scholarship);
  const isOpen = scholarship.status === "open";
  // the student's tracker entry for THIS scholarship, if they've saved it
  const saved = tracker.data?.applications.find(
    (application) => application.scholarship_id === scholarship.id,
  );

  async function handleSave() {
    setSaveError(null);
    setIsSaving(true);
    try {
      await apiFetch("/applications", {
        method: "POST",
        body: JSON.stringify({ scholarshipId: scholarship.id }),
      });
      tracker.retry(); // reload the tracker so `saved` above becomes true
    } catch (err) {
      console.error("Saving scholarship failed:", err);
      // 409 = it's already there (saved from another tab, say) — same end result, so just refresh
      if (err.status === 409 && isOpen) {
        tracker.retry();
      } else {
        setSaveError(err.message);
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <Link
          to="/scholarships"
          className="text-xs font-semibold text-primary hover:underline"
        >
          ← All scholarships
        </Link>

        {/* header */}
        <p className="text-xs font-semibold text-muted uppercase tracking-wide mt-4">
          {scholarship.organization}
        </p>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-ink mt-1">
          {scholarship.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <span
            className={`text-[10.5px] font-bold px-2.5 py-1 rounded-md bg-chip ${
              isOpen ? "text-success" : "text-muted"
            }`}
          >
            {isOpen ? "Open" : "Closed"}
          </span>
          {isOpen && (
            <span
              className={`text-xs ${
                deadline.isUrgent
                  ? "font-bold text-deadline-urgent"
                  : "font-semibold text-muted"
              }`}
            >
              {deadline.label}
            </span>
          )}
        </div>

        {/* key facts: a definition list, because each value answers one named question */}
        <dl className="grid grid-cols-1 sm:grid-cols-3 bg-white rounded-2xl border border-border shadow-sm mt-6 divide-y sm:divide-y-0 sm:divide-x divide-border">
          <div className="px-5 py-4">
            <dt className="text-[10.5px] font-bold text-muted">AMOUNT</dt>
            <dd className="font-display font-bold text-lg text-amount mt-1">
              {formatPeso(scholarship.amount, "Not stated")}
            </dd>
          </div>
          <div className="px-5 py-4">
            <dt className="text-[10.5px] font-bold text-muted">DEADLINE</dt>
            <dd className="font-display font-bold text-lg text-ink mt-1">
              {formatDate(scholarship.deadline)}
            </dd>
          </div>
          <div className="px-5 py-4">
            <dt className="text-[10.5px] font-bold text-muted">SLOTS</dt>
            <dd className="font-display font-bold text-lg text-ink mt-1">
              {scholarship.slots ?? "Not stated"}
            </dd>
          </div>
        </dl>

        {/* what to do next — depends entirely on who is looking */}
        <div className="mt-6">
          {!token && (
            <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
              <p className="text-sm text-ink">
                Log in to save this scholarship and track your application from
                Interested through to Result.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <Link
                  to="/login"
                  state={{ from: location.pathname }}
                  className={primaryButton}
                >
                  Log in to save
                </Link>
                <Link to="/register" className={secondaryButton}>
                  Create a free account
                </Link>
              </div>
            </div>
          )}

          {role === "student" && saved && (
            <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
              <p className="text-sm font-semibold text-ink">
                In your tracker, at the{" "}
                <span className={stageFor(saved.application_status).text}>
                  {stageFor(saved.application_status).label}
                </span>{" "}
                stage.
              </p>
              <Link to="/my-tracker" className={`${secondaryButton} mt-4`}>
                Open My Tracker
              </Link>
            </div>
          )}

          {role === "student" && !saved && isOpen && (
            <div>
              <button
                onClick={handleSave}
                // while the tracker is still loading we don't know yet whether it's already saved
                disabled={isSaving || tracker.isLoading}
                className={primaryButton}
              >
                {isSaving ? "Saving…" : "Save to My Tracker"}
              </button>
              {saveError && (
                <p role="alert" className={`${errorText} mt-3`}>
                  {saveError}
                </p>
              )}
            </div>
          )}

          {role === "student" && !saved && !isOpen && (
            <p className="text-sm text-muted">
              This scholarship is closed, so it can&rsquo;t be added to your
              tracker.
            </p>
          )}

          {/* an admin only gets tools for listings they posted — the server enforces the same rule */}
          {role === "admin" && scholarship.posted_by === userId && (
            <div className="flex flex-wrap gap-3">
              <Link
                to={`/admin/scholarships/${scholarship.id}/edit`}
                className={primaryButton}
              >
                Edit listing
              </Link>
              <Link
                to={`/admin/scholarships/${scholarship.id}/applicants`}
                className={secondaryButton}
              >
                View applicants
              </Link>
            </div>
          )}
        </div>

        {/* long-form text. whitespace-pre-line keeps the line breaks the admin typed. */}
        <section className="mt-8">
          <h2 className="font-display font-bold text-lg text-ink">
            About this scholarship
          </h2>
          <p className="text-sm text-ink leading-relaxed mt-2 whitespace-pre-line wrap-break-word max-w-prose">
            {scholarship.description || "No description was provided."}
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display font-bold text-lg text-ink">
            Requirements
          </h2>
          <p className="text-sm text-ink leading-relaxed mt-2 whitespace-pre-line wrap-break-word max-w-prose">
            {scholarship.requirements ||
              "No requirements were listed. Check with the organization before applying."}
          </p>
        </section>
      </div>
    </div>
  );
}

export default ScholarshipDetail;
