import apiFetch from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import ScholarshipForm from "../components/ScholarshipForm";

function NewScholarship() {
  const navigate = useNavigate();

  // ScholarshipForm validates, builds the payload and shows any error this throws.
  async function handleCreate(payload) {
    await apiFetch("/scholarships", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    navigate("/admin/dashboard");
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
          New listing
        </h1>
        <p className="text-sm text-muted mt-1">
          Students see it on the browse page as soon as you post it.
        </p>

        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 md:p-6 mt-6">
          <ScholarshipForm
            submitLabel="Post scholarship"
            submittingLabel="Posting…"
            onSubmit={handleCreate}
          />
        </div>
      </div>
    </div>
  );
}

export default NewScholarship;
