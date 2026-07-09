import { useEffect, useState } from "react";
import apiFetch from "../services/api";

function MyTracker() {
  const [applications, setApplication] = useState([]);

  useEffect(() => {
    apiFetch("/applications")
      .then((data) => setApplication(data.applications))
      .catch((error) => console.error("Failed to load applications:", error));
  }, []);

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
