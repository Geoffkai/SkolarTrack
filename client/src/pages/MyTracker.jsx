import { useEffect, useState } from "react";
import apiFetch from "../services/api";
import { useNavigate } from "react-router-dom";

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
    <div>
      <h1>My Tracker</h1>
      {applications.length === 0 ? (
        <p>No applications yet - browse scholarships to get started.</p>
      ) : (
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
      )}
    </div>
  );
}

export default MyTracker;
