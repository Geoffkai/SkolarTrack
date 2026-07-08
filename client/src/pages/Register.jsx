import { useState } from "react"; // Hooks
import { useNavigate } from "react-router-dom";
import apiFetch from "../services/api";

function Register() {
  //Each field get its own pieces of state - React needs to "own" these
  // values so it can re-render the input with the current value on every keystroke
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault(); // stop the browser's default reload-on-submit

    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, name, password, role }),
      });
      navigate("/login");
    } catch (error) {
      console.error("Registration failed:", error);
    }
  }

  return (
    // onSubmit blocks the browser's default full-page-reload-on-submit behavior.
    <form onSubmit={handleSubmit}>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label htmlFor="name">Name</label>
      <input
        id="name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="student">Student</option>
        <option value="admin">Admin</option>
      </select>
      <button type="submit">Register</button>
    </form>
  );
}

export default Register;
