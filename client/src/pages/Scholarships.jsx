import { use, useEffect, useState } from "react";
import apiFetch from "../services/api";
import { Link } from "react-router-dom";

function Scholarships() {
  const [scholarships, setScholarship] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  function fetchScholarship() {
    setIsLoading(true);
    setError(null);
    apiFetch("/scholarships")
      .then((data) => setScholarship(data.scholarships))
      .catch((error) => {
        console.error("Failed to load scholarships: ", error);
        setError(error);
      })
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
