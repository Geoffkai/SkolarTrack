//AdminDashboard.jsx
import { useEffect, useState } from "react";
import apiFetch from "../services/api";
import { Link } from "react-router-dom";

function AdminDashboard() {
  const [scholarships, setScholarship] = useState([]);

  useEffect(() => {
    apiFetch("/scholarships/mine")
      .then((data) => setScholarship(data.scholarships))
      .catch((error) => console.error("Failed to load scholarships: ", error));
  }, []);

  const activeScholarships = scholarships.filter(
    (sch) => sch.status === "open",
  );
  const closedScholarships = scholarships.filter(
    (sch) => sch.status === "closed",
  );

  async function handleClose(scholarshipId) {
    try {
      await apiFetch(`/scholarships/${scholarshipId}`, { method: "DELETE" });

      const updatedScholarship = scholarships.map((sch) =>
        sch.id === scholarshipId ? { ...sch, status: "closed" } : sch,
      );

      setScholarship(updatedScholarship);
    } catch (error) {
      console.error("Failed to close scholarship: ", error);
    }
  }

  async function handleReopen(sch) {
    try {
      await apiFetch(`/scholarships/${sch.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...sch, status: "open" }),
      });

      const updatedScholarship = scholarships.map((s) =>
        s.id === sch.id ? { ...s, status: "open" } : s,
      );

      setScholarship(updatedScholarship);
    } catch (error) {
      console.error("Failed to reopen scholarship: ", error);
    }
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
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
