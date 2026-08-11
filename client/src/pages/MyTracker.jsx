import { useEffect, useState } from "react";
import apiFetch from "../services/api";
import { useNavigate } from "react-router-dom";

const COLUMNS = [
  {
    key: "applied",
    label: "APPLIED",
    header: "text-muted",
    accent: "border-l-primary",
  },
  { key: "interested", label: "INTERESTED", header: "", accent: "" },
  { key: "interview", label: "", header: "", accent: "" },
  { key: "result", label: "", header: "", accent: "" },
];

function MyTracker() {
  const [applications, setApplication] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  function fetchApplications() {
    setIsLoading(true);
    setError(null); //reset from any previous failed attempt, or a successful
    apiFetch("/applications")
      .then((data) => setApplication(data.applications))
      .catch((error) => {
        console.error("Failed to load applications:", error);

        // A 401 means the token is missing/expired, not a generic server
        // problem. Retrying with the same bad token would just 401 again,
        // so send the user to re-auth instead of showing an error+Retry UI.
        if (error.status === 401) {
          navigate("/login");
          return;
        }

        // Runs on every outcome, including the 401/navigate case above —
        // that's harmless here since the component is already unmounting.
        setError(error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  useEffect(() => {
    fetchApplications();
  }, []);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    // 401s redirect above before ever setting this state.
    return (
      <div>
        <p>{error.message}</p>
        <button onClick={fetchApplications}>Retry</button>
      </div>
    );
  }
  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <h1 className="font-display font-bold text-2xl md:text-3xl text-ink">
          My Tracker
        </h1>

        {applications.length === 0 ? (
          <p className="text-muted mt-8">
            No applications yet - browse scholarships to get started.
          </p>
        ) : (
          <div className="mt-6 flex gap-4">
            {COLUMNS.map((col) => {
              const items = applications.filter(
                (a) => a.application_status === col.key,
              );

              return (
                <div key={col.key} className="flex-1 flex flex-col gap-2.5">
                  <div className={`font-bold text-[11px] ${col.header}`}>
                    <h2>{col.label}</h2>
                  </div>
                </div>
              );
            })}
            <ul>
              {applications.map((app) => (
                <li key={app.id}>
                  <h3>{app.title}</h3>
                  <p>{app.organization}</p>
                  <p>Status: {app.application_status}</p>
                  <p>Description: {app.description}</p>
                  <p>Deadline: {app.deadline}</p>
                  <p>Requirements: {app.requirements}</p>
                  <p>Amount: {app.amount}</p>
                  <p>Slots: {app.slots}</p>
                  <p>Notes: {app.notes}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyTracker;
