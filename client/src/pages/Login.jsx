import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiFetch from "../services/api";
import { getRoleFromToken } from "../services/auth";
import { useAuth } from "../context/AuthContext";

//Login.jsx
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      login(data.token); // updates React state + localStorage in one place

      const role = getRoleFromToken(data.token);

      if (role === "student") {
        navigate("/my-tracker");
      } else if (role === "admin") {
        navigate("/admin/dashboard");
      }
    } catch (error) {
      console.error("Login failed:", error);
      if (error.status === 400) {
        setError("Email and password are required");
      } else if (error.status === 401) {
        setError("Wrong email or password");
      } else {
        setError("Something went wrong on our end. Please try again.");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p>{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
}

export default Login; // "this file's ONE main thing is Login — no label needed"
