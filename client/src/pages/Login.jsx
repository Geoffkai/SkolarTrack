import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiFetch from "../services/api";
import { getRoleFromToken } from "../services/auth";
import { useAuth } from "../context/AuthContext";

//Login.jsx
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

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
    } finally {
      setIsSubmitting(false);
    }
  }

  // Share input styling
  const inputClass =
    "w-full px-4 py-3 rounded-lg border border-border bg-background text-sm " +
    "text-ink placeholder:text-muted focus:outline-none focus:border-primary";

  return (
    /* full screen centering wrapper*/
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        {/* brand header */}
        <div className="text-center mb-6">
          <div className="font-display font-bold text-xl text-ink">
            SkolarTrack
          </div>
          <p className="text-xs text-muted mt-1">
            Scholarship for Filipino students, all in one place
          </p>
        </div>

        {/* title */}
        <h1 className="font-display font-bold text-lg text-ink mb-4">
          Welcome back
        </h1>

        {/* form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-bold text-ink mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@up.edu.ph"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-bold text-ink mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>

          {/* styled error */}
          {error && (
            <p className="text-sm font-semibold text-deadline-urgent">
              {error}
            </p>
          )}

          {/* styled button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 bg-primary text-white font-semibold py-3 rounded-lg hover:brightness-90 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:brightness-100"
          >
            {isSubmitting ? "Logging in..." : "Log In"}
          </button>
        </form>

        {/* footer link */}
        <p className="text-center text-xs text-muted mt-5">
          New here?{" "}
          <Link to="/register" className="text-primary font-bold border-b">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login; // "this file's ONE main thing is Login — no label needed"
