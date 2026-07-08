import { useEffect, useState } from "react";
import apiFetch from "../services/api";
import { Link } from "react-router-dom";

function Scholarships() {
  const [scholarships, setScholarship] = useState([]);

  useEffect(() => {
    await apiFetch("/scholarships")
      .then((data) => setScholarship(data.scholarships))
      .catch((error) => console.error("Failed to load scholarships: ", error));
  }, []);

  return (
    <div>
      <h1>Scholarships</h1>
      {scholarships.length === 0 ? (
        <p>No scholarships available</p>
      ) : (
        <ul>
          {scholarships.map((sch) => (
            <li key={sch.id}>
              <Link to={`/scholarships/${sch.id}`}>View Details</Link>
              <h3>{sch.title}</h3>
              <p>Organization: {sch.organization}</p>
              <p>Amount: {sch.amount}</p>
              <p>Description: {sch.description}</p>
              <p>Requirements: {sch.requirements}</p>
              <p>Deadline: {sch.deadline}</p>
              <p>Status: {sch.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Scholarships;
