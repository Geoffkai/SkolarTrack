import apiFetch from "../services/api";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/useAuth";
import ScholarshipForm from "../components/ScholarshipForm";
import { ErrorState, Loading } from "../components/PageState";
import { secondaryButton } from "../components/styles";

function EditScholarship() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { data, error, isLoading, retry } = useApi(`/scholarships/${id}`);

  async function handleUpdate(payload) {
    await apiFetch(`/scholarships/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    navigate("/admin/dashboard");
  }

  const backToDashboard = (
    <Link to="/admin/dashboard" className={secondaryButton}>
      Back to dashboard
    </Link>
  );

  if (isLoading) {
    return <Loading label="Loading listing…" />;
  }

  if (error) {
    const isMissing = error.status === 404 || error.status === 400;
    return (
      <ErrorState
        message={isMissing ? "This listing doesn't exist." : error.message}
        onRetry={isMissing ? undefined : retry}
      >
        {backToDashboard}
      </ErrorState>
    );
  }

  // The server refuses the save anyway (a PUT on someone else's listing returns 404);
  // checking here just avoids showing a form that could never be submitted.
  if (data.scholarship.posted_by !== userId) {
    return (
      <ErrorState message="You can only edit listings you posted.">
        {backToDashboard}
      </ErrorState>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <Link
          to="/admin/dashboard"
          className="text-xs font-semibold text-primary hover:underline"
        >
          ← Back to dashboard
        </Link>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-ink mt-3">
          Edit listing
        </h1>

        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 md:p-6 mt-6">
          {/* key={id}: a different listing gets a brand-new form instead of reusing the
              previous one's typed-in state */}
          <ScholarshipForm
            key={id}
            initialValues={data.scholarship}
            showStatus
            submitLabel="Save changes"
            submittingLabel="Saving…"
            onSubmit={handleUpdate}
          />
        </div>
      </div>
    </div>
  );
}

export default EditScholarship;
