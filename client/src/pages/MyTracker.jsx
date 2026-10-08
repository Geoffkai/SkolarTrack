import { Link } from "react-router-dom";
import apiFetch from "../services/api";
import { useApi } from "../hooks/useApi";
import TrackerCard from "../components/TrackerCard";
import { ErrorState, Loading } from "../components/PageState";
import { primaryButton, secondaryButton } from "../components/styles";
import { STAGES } from "../utils/stages";

function MyTracker() {
  // An expired token (401) is handled once, centrally: apiFetch ends the session and
  // ProtectedRoute sends the student to /login — so this page only handles real errors.
  const { data, error, isLoading, retry, setData } = useApi("/applications");

  // Both handlers throw on failure. TrackerCard catches that and shows the message
  // on the card that caused it, so one failed save doesn't blank the whole board.
  async function handleUpdate(applicationId, changes) {
    const { updatedApplication } = await apiFetch(
      `/applications/${applicationId}`,
      { method: "PUT", body: JSON.stringify(changes) },
    );

    // Functional update: if two cards are changed in quick succession, each change is
    // applied on top of the latest list instead of overwriting the other one.
    setData((current) => ({
      applications: current.applications.map((application) =>
        application.id === applicationId
          ? {
              ...application,
              // the list calls this field application_status; the PUT response calls it status
              application_status: updatedApplication.status,
              notes: updatedApplication.notes,
              updated_at: updatedApplication.updated_at,
            }
          : application,
      ),
    }));
  }

  async function handleRemove(applicationId) {
    await apiFetch(`/applications/${applicationId}`, { method: "DELETE" });
    setData((current) => ({
      applications: current.applications.filter(
        (application) => application.id !== applicationId,
      ),
    }));
  }

  if (isLoading) {
    return <Loading label="Loading your tracker…" />;
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={retry} />;
  }

  const applications = data.applications;

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display font-bold text-2xl md:text-3xl text-ink">
            My Tracker
          </h1>
          {/* for a scholarship found somewhere else, with no listing on the browse page */}
          <Link to="/my-tracker/new" className={secondaryButton}>
            Add your own
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="mt-8">
            <p className="text-muted">
              Nothing saved yet. Open a scholarship and choose &ldquo;Save to My
              Tracker&rdquo;, or add one you found somewhere else, to start
              following your application here.
            </p>
            <Link to="/scholarships" className={`${primaryButton} mt-4`}>
              Browse scholarships
            </Link>
          </div>
        ) : (
          // phones: the four stages stack as one list; lg screens: four columns side by side
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6 items-start">
            {STAGES.map((stage) => {
              const items = applications.filter(
                (a) => a.application_status === stage.key,
              );

              return (
                <section key={stage.key} aria-labelledby={`stage-${stage.key}`}>
                  <h2
                    id={`stage-${stage.key}`}
                    className={`font-bold text-[11px] uppercase ${stage.text}`}
                  >
                    {`${stage.label} · ${items.length}`}
                  </h2>

                  {items.length === 0 ? (
                    <p className="text-xs text-muted mt-2.5">Nothing here yet.</p>
                  ) : (
                    <ul className="flex flex-col gap-2.5 mt-2.5">
                      {items.map((application) => (
                        <TrackerCard
                          key={application.id}
                          application={application}
                          onUpdate={handleUpdate}
                          onRemove={handleRemove}
                        />
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyTracker;
