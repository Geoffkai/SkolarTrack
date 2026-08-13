import { useEffect, useState } from "react";
import apiFetch from "../services/api";
import { useNavigate } from "react-router-dom";

const COLUMNS = [
  {
    key: "interested",
    label: "INTERESTED",
    header: "text-amount",
    accent: "border-l",
  },
  {
    key: "applied",
    label: "APPLIED",
    header: "text-muted",
    accent: "border-l-primary",
  },
  { key: "interview", label: "INTERVIEW", header: "text-success", accent: "" },
  {
    key: "result",
    label: "RESULT",
    header: "text-deadline-urgent",
    accent: "",
  },
];

function daysSince(timestamp) {
  const today = new Date();
  const longAgo = new Date(timestamp);
  const diffMs = today - longAgo;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function dateLabel(date) {
  const d = daysSince(date);
  if (d === 0) {
    return `Today`;
  }
  if (d < 7) {
    return `${d} day${d === 1 ? "" : "s"} ago`;
  }
  const week = Math.floor(d / 7);
  return `${week} week${d < 14 ? "" : "s"} ago`;
}

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
          <div className="mt-6 flex flex-col gap-4 md:flex-row">
            {COLUMNS.map((col) => {
              const items = applications.filter(
                (a) => a.application_status === col.key,
              );

              return (
                <div key={col.key} className="flex-1 flex flex-col gap-2.5">
                  <div className={`font-bold text-[11px] ${col.header}`}>
                    <h2>{`${col.label} · ${items.length}`}</h2>
                  </div>

                  {items.map((app) => (
                    <div
                      key={app.id}
                      className={`bg-white border-l-4 ${col.accent} rounded-r-xl p-3.5 shadow-sm`}
                    >
                      <h3 className="font-display font-bold text-[13px] text-ink">
                        {app.title}
                      </h3>
                      <p className="text-[10.5px] text-muted mt-1">
                        {dateLabel(app.updated_at)}
                      </p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyTracker;
