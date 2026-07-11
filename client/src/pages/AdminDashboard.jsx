//AdminDashboard.jsx
import { useEffect, useState } from "react";
import apiFetch from "../services/api";
import { Link } from "react-router-dom";

function AdminDashboard() {
  const [scholarships, setScholarship] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  function fetchScholarship() {
    setIsLoading(true);
    setError(null);
    apiFetch("/scholarships/mine")
      .then((data) => setScholarship(data.scholarships))
      .catch((error) => console.error("Failed to load scholarships: ", error))
      .finally(() => {
        setIsLoading(false);
      });
  }

  useEffect(() => {
    fetchScholarship();
  }, []);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return (
      <div>
        <p>{error.message}</p>
        <button onClick={fetchScholarship}>Retry</button>
      </div>
    );
  }

  const activeScholarships = scholarships.filter(
    (sch) => sch.status === "open",
  );
  const closedScholarships = scholarships.filter(
    (sch) => sch.status === "closed",
  );

  async function handleClose(scholarshipId) {
    setActionError(null);
    try {
      await apiFetch(`/scholarships/${scholarshipId}`, {
        method: "DELETE",
      });

      setScholarship((currentScholarship) => {
        return currentScholarship.map((sch) =>
          sch.id === scholarshipId ? { ...sch, status: "closed" } : sch,
        );
      });
    } catch (error) {
      console.error("Failed to close scholarship: ", error);
      setActionError(error);
    }
  }

  async function handleReopen(sch) {
    setActionError(null);
    try {
      await apiFetch(`/scholarships/${sch.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...sch, status: "open" }),
      });

      setScholarship((currentScholarship) => {
        return currentScholarship.map((s) =>
          s.id === sch.id ? { ...s, status: "open" } : s,
        );
      });
    } catch (error) {
      console.error("Failed to reopen scholarship: ", error);
      setActionError(error);
    }
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      {actionError && <p>{actionError.message}</p>}
      <Link to="/admin/scholarships/new">Add New Scholarship</Link>
      <section>
        <h2>Active Scholarships</h2>
        {activeScholarships.length === 0 ? (
          <p>No Active Scholarships</p>
        ) : (
          <ul>
            {activeScholarships.map((sch) => (
              <li key={sch.id}>
                <h3>{sch.title}</h3>
                <Link to={`/admin/scholarships/${sch.id}/edit`}>
                  Edit Scholarship
                </Link>
                <button
                  onClick={() => {
                    handleClose(sch.id);
                  }}
                >
                  Close
                </button>
                <p>Organization: {sch.organization}</p>
                <p>Amount: {sch.amount}</p>
                <p>Description: {sch.description}</p>
                <p>Slots: {sch.slots}</p>
                <p>Requirements: {sch.requirements}</p>
                <p>Deadline: {sch.deadline}</p>
                <p>Status: {sch.status}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2>Closed Scholarships</h2>
        {closedScholarships.length === 0 ? (
          <p>No Closed Scholarships</p>
        ) : (
          <ul>
            {closedScholarships.map((sch) => (
              <li key={sch.id}>
                <h3>{sch.title}</h3>
                <Link to={`/admin/scholarships/${sch.id}/edit`}>
                  Edit Scholarship
                </Link>
                <button
                  onClick={() => {
                    handleReopen(sch);
                  }}
                >
                  Reopen
                </button>
                <p>Organization: {sch.organization}</p>
                <p>Amount: {sch.amount}</p>
                <p>Description: {sch.description}</p>
                <p>Slots: {sch.slots}</p>
                <p>Requirements: {sch.requirements}</p>
                <p>Deadline: {sch.deadline}</p>
                <p>Status: {sch.status}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default AdminDashboard;
