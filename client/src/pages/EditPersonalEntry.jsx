import apiFetch from "../services/api";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import PersonalEntryForm from "../components/PersonalEntryForm";
import { ErrorState, Loading } from "../components/PageState";
import { secondaryButton } from "../components/styles";

function EditPersonalEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  // There is no endpoint for a single tracker entry, and a tracker is a short list,
  // so load it whole and pick this entry out below.
  const { data, error, isLoading, retry } = useApi("/applications");

  async function handleUpdate(payload) {
    await apiFetch(`/applications/personal/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    navigate("/my-tracker");
  }

  const backToTracker = (
    <Link to="/my-tracker" className={secondaryButton}>
      Back to My Tracker
    </Link>
  );

  if (isLoading) {
    return <Loading label="Loading your scholarship…" />;
  }

  if (error) {
    return (
      <ErrorState message={error.message} onRetry={retry}>
        {backToTracker}
      </ErrorState>
    );
  }

  // The id in the URL is text. A listing saved from the browse page is deliberately not a
  // match: its details belong to the admin who posted it (the server refuses that save too).
  const entry = data.applications.find(
    (application) => String(application.id) === id && application.is_personal,
  );

  if (!entry) {
    return (
      <ErrorState message="There's nothing to edit here. Only scholarships you added yourself can be changed.">
        {backToTracker}
      </ErrorState>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <Link
          to="/my-tracker"
          className="text-xs font-semibold text-primary hover:underline"
        >
          ← Back to My Tracker
        </Link>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-ink mt-3">
          Edit scholarship details
        </h1>
        <p className="text-sm text-muted mt-1">
          The stage and your notes are changed on the tracker card itself.
        </p>

        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 md:p-6 mt-6">
          {/* key={id}: a different entry gets a brand-new form instead of reusing the
              previous one's typed-in state */}
          <PersonalEntryForm
            key={id}
            initialValues={entry}
            submitLabel="Save changes"
            submittingLabel="Saving…"
            onSubmit={handleUpdate}
          />
        </div>
      </div>
    </div>
  );
}

export default EditPersonalEntry;
