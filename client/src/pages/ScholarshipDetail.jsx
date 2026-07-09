import { useEffect, useState } from "react";
import apiFetch from "../services/api";
import { useParams } from "react-router-dom";

function ScholarshipDetail() {
  const [scholarshipDetail, setScholarshipDetail] = useState({});
  const { id } = useParams();

  useEffect(() => {
    apiFetch(`/scholarships/${id}`)
      .then((data) => setScholarshipDetail(data.scholarship))
      .catch((error) =>
        console.error("Failed to get the data of scholarship: ", error),
      );
  }, [id]);

  return (
    <div>
      {Object.keys(scholarshipDetail).length === 0 ? (
        <p>Scholarship not found</p>
      ) : (
        <>
          <h3>{scholarshipDetail.title}</h3>
          <p>Organization: {scholarshipDetail.organization}</p>
          <p>Amount: {scholarshipDetail.amount}</p>
          <p>Description: {scholarshipDetail.description}</p>
          <p>Requirements: {scholarshipDetail.requirements}</p>
          <p>Deadline: {scholarshipDetail.deadline}</p>
          <p>Status: {scholarshipDetail.status}</p>
        </>
      )}
    </div>
  );
}

export default ScholarshipDetail;
