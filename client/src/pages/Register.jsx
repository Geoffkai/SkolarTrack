import { useState } from "react"; // Hooks
import { Navigate, useNavigate, Link } from "react-router-dom";
import apiFetch from "../services/api";
import { useAuth } from "../context/useAuth";
import { errorText, inputClass, labelClass } from "../components/styles";

const MIN_PASSWORD_LENGTH = 8; // keep in step with the server's rule

function Register() {
  //Each field get its own pieces of state - React needs to "own" these
  // values so it can re-render the input with the current value on every keystroke
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [school, setSchool] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { token } = useAuth();

  // someone already logged in has no use for a sign-up form
  if (token) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault(); // stop the browser's default reload-on-submit
    setError(null);
    setIsSubmitting(true);

    try {
      // no role in the body: the server decides it (always "student" for public sign-ups)
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          name,
          course,
          school,
          password,
        }),
      });
      // hand the email to the login page so it doesn't have to be typed twice
      navigate("/login", { state: { registered: true, email: email.trim() } });
    } catch (err) {
      console.error("Registration failed:", err);
      // the server's message says which field is the problem — show it, not a generic line
      setError(
        err.status === 409
          ? "That email already has an account. Log in instead."
          : err.message,
      );
      setIsSubmitting(false);
    }
  }

  return (
    // full screen centering wrapper
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      {/* card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        {/* brand header */}
        <div className="text-center mb-6">
          <div className="font-display font-bold text-lg text-ink">
            SkolarTrack
          </div>
          <p className="text-muted text-xs mt-1">
            Scholarships for Filipino students, all in one place
          </p>
        </div>

        {/* title */}
        <h1 className="font-display font-bold text-lg text-ink mb-4">
          Create your account
        </h1>

        {/* form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* full Name */}
          <div>
            <label htmlFor="name" className={labelClass}>
              Full name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              maxLength={200}
              value={name}
              className={inputClass}
              placeholder="Your name"
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* email */}
          <div>
            <label htmlFor="email" className={labelClass}>
              School email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              placeholder="you@up.edu.ph"
              className={inputClass}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* course + school */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label htmlFor="course" className={labelClass}>
                Course
              </label>
              <input
                id="course"
                type="text"
                maxLength={200}
                value={course}
                placeholder="BS Comp Sci"
                className={inputClass}
                onChange={(e) => setCourse(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label htmlFor="school" className={labelClass}>
                School
              </label>
              <input
                id="school"
                type="text"
                autoComplete="organization"
                maxLength={200}
                value={school}
                placeholder="UP Diliman"
                className={inputClass}
                onChange={(e) => setSchool(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              maxLength={72}
              value={password}
              placeholder="••••••••"
              className={inputClass}
              aria-describedby="password-hint"
              onChange={(e) => setPassword(e.target.value)}
            />
            <p id="password-hint" className="text-xs text-muted mt-1.5">
              At least {MIN_PASSWORD_LENGTH} characters.
            </p>
          </div>

          {error && (
            <p role="alert" className={errorText}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 bg-primary text-white font-semibold py-3 rounded-lg hover:brightness-90 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:brightness-100"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        {/* footer link */}
        <p className="text-center text-xs text-muted mt-5">
          Already registered?{" "}
          <Link to="/login" className="text-primary font-bold border-b">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
