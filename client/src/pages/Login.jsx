import { useState } from "react";
import { Navigate, Link, useLocation } from "react-router-dom";
import apiFetch from "../services/api";
import { useAuth } from "../context/useAuth";
import { errorText, inputClass, labelClass } from "../components/styles";

//Login.jsx
function Login() {
  // location.state is filled in by whoever sent the visitor here:
  // ProtectedRoute ({ from }) or the Register page ({ registered, email })
  const { state } = useLocation();
  const [email, setEmail] = useState(state?.email ?? "");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { token, role, login, sessionExpired } = useAuth();

  // Already logged in — or login() below just ran and re-rendered us with a token.
  // Either way there's nothing to do here: go back to where they were headed, or home.
  if (token) {
    const home = role === "admin" ? "/admin/dashboard" : "/my-tracker";
    return <Navigate to={state?.from ?? home} replace />;
  }

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
    } catch (error) {
      console.error("Login failed:", error);
      // 401 gets our own wording; everything else (too many attempts, no connection,
      // server trouble) already arrives from apiFetch as a sentence a person can read
      setError(
        error.status === 401 ? "Wrong email or password." : error.message,
      );
      setIsSubmitting(false);
    }
  }

  return (
    /* full screen centering wrapper*/
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      {/* card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        {/* brand header */}
        <div className="text-center mb-6">
          <div className="font-display font-bold text-xl text-ink">
            SkolarTrack
          </div>
          <p className="text-xs text-muted mt-1">
            Scholarships for Filipino students, all in one place
          </p>
        </div>

        {/* title */}
        <h1 className="font-display font-bold text-lg text-ink mb-4">
          Welcome back
        </h1>

        {/* why you're looking at this form, when there's a reason beyond "you clicked Log In" */}
        {sessionExpired && (
          <p role="status" className="text-sm font-semibold text-amount mb-4">
            Your session expired. Log in again to pick up where you left off.
          </p>
        )}
        {state?.registered && !sessionExpired && (
          <p role="status" className="text-sm font-semibold text-success mb-4">
            Account created. Log in to start tracking scholarships.
          </p>
        )}

        {/* form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@up.edu.ph"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>

          {/* styled error */}
          {error && (
            <p role="alert" className={errorText}>
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
