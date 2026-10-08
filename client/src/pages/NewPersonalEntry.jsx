import apiFetch from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import PersonalEntryForm from "../components/PersonalEntryForm";

function NewPersonalEntry() {
  const navigate = useNavigate();

  // PersonalEntryForm validates, builds the payload and shows any error this throws.
  async function handleCreate(payload) {
    await apiFetch("/applications/personal", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    navigate("/my-tracker");
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
          Add your own scholarship
        </h1>
        <p className="text-sm text-muted mt-1">
          For one you found somewhere else. Only you can see it; it won&rsquo;t
          appear on the browse page.
        </p>

        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 md:p-6 mt-6">
          <PersonalEntryForm
            showNotes
            submitLabel="Add to My Tracker"
            submittingLabel="Adding…"
            onSubmit={handleCreate}
          />
        </div>
      </div>
    </div>
  );
}

export default NewPersonalEntry;
