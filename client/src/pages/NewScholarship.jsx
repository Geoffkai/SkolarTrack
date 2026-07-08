import { useState } from "react";
import apiFetch from "../services/api";
import { useNavigate } from "react-router-dom";

function NewScholarship() {
  const [formData, setFormData] = useState({
    title: "",
    organization: "",
    description: "",
    amount: "",
    slots: "",
    requirements: "",
    deadline: "",
  });
  const navigate = useNavigate();
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await apiFetch("/scholarships", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      navigate("/admin/dashboard");
    } catch (err) {
      console.error("Adding new scholarship failed:", err);
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <div>
      <h1>New Scholarship Page</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="title">Enter Title</label>
        <input
          id="title"
          name="title"
          value={formData.title}
          type="text"
          onChange={handleChange}
        />

        <label htmlFor="organization">Enter Organization</label>
        <input
          id="organization"
          name="organization"
          value={formData.organization}
          type="text"
          onChange={handleChange}
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
        />
        <button type="submit">Create New Scholarship</button>
      </form>
    </div>
  );
}

export default NewScholarship;
