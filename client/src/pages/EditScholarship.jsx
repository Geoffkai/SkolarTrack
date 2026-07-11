import { useEffect, useState } from "react";
import apiFetch from "../services/api";
import { useNavigate, useParams } from "react-router-dom";

function EditScholarship() {
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch(`/scholarships/${id}`)
      .then((data) => setFormData({ ...data.scholarship }))
      .catch((err) =>
        console.error("Failed to get the details of the scholarship: ", err),
      )
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    try {
      await apiFetch(`/scholarships/${id}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });
      navigate("/admin/dashboard");
    } catch (err) {
      console.error("Registration failed:", err);
      setError(err);
    }
  }

  return (
    <div>
      <h1>Edit Scholarship Page</h1>
      {error && <p>{error.message}</p>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="title">Enter Title</label>
        <input
          id="title"
          name="title"
          value={formData.title}
          type="text"
          onChange={handleChange}
          required
        />

        <label htmlFor="organization">Enter Organization</label>
        <input
          id="organization"
          name="organization"
          value={formData.organization}
          type="text"
          onChange={handleChange}
          required
        />

        <label htmlFor="description">Enter Description</label>
        <input
          id="description"
          name="description"
          value={formData.description}
          type="text"
          onChange={handleChange}
        />

        <label htmlFor="amount">Enter Amount</label>
        <input
          id="amount"
          name="amount"
          value={formData.amount}
          type="number"
          onChange={handleChange}
        />

        <label htmlFor="slots">Enter Slots</label>
        <input
          id="slots"
          name="slots"
          value={formData.slots}
          type="number"
          onChange={handleChange}
        />

        <label htmlFor="requirements">Enter Requirements</label>
        <input
          id="requirements"
          name="requirements"
          value={formData.requirements}
          type="text"
          onChange={handleChange}
        />

        <label htmlFor="deadline">Enter Deadline</label>
        <input
          id="deadline"
          name="deadline"
          value={formData.deadline}
          type="date"
          onChange={handleChange}
          required
        />
        <button type="submit">Edit Scholarship</button>
      </form>
    </div>
  );
}

export default EditScholarship;
