import { useEffect, useState } from "react";
import apiFetch from "../services/api";
import { useParams } from "react-router-dom";

function ScholarshipDetail() {
  const [scholarshipDetail, setScholarshipDetail] = useState({});
  const { id } = useParams();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  function fetchScholarshipDetail() {
    setIsLoading(true);
    setError(null);
    apiFetch(`/scholarships/${id}`)
      .then((data) => setScholarshipDetail(data.scholarship))
      .catch((error) => {
        console.error("Failed to get the data of scholarship: ", error);
        setError(error);
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    fetchScholarshipDetail();
  }, [id]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return (
      <div>
        <p>{error.message}</p>
        <button onClick={fetchScholarshipDetail}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h3>{scholarshipDetail.title}</h3>
      <p>Organization: {scholarshipDetail.organization}</p>
      <p>Amount: {scholarshipDetail.amount}</p>
      <p>Description: {scholarshipDetail.description}</p>
      <p>Requirements: {scholarshipDetail.requirements}</p>
      <p>Deadline: {scholarshipDetail.deadline}</p>
      <p>Status: {scholarshipDetail.status}</p>
    </div>
  );
}

export default ScholarshipDetail;
