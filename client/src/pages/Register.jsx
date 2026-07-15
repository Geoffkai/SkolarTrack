import { useState } from "react"; // Hooks
import { useNavigate, Link } from "react-router-dom";
import apiFetch from "../services/api";

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

  async function handleSubmit(e) {
    e.preventDefault(); // stop the browser's default reload-on-submit
    setError(null);
    setIsSubmitting(true);

    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          name,
          course,
          school,
          password,
          role: "student",
        }),
      });
      navigate("/login");
    } catch (err) {
      console.error("Registration failed:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "w-full px-4 py-3 rounded-lg border border-border bg-background text-sm " +
    "text-ink placeholder:text-muted focus:outline-none focus:border-primary";
  return (
    // full screen centering wrapper
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
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
            <label
              htmlFor="name"
              className="block text-xs font-bold text-ink mb-1.5"
            >
              Full name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              className={inputClass}
              placeholder="Your name"
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-bold text-ink mb-1.5"
            >
              School email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              placeholder="you@up.edu.ph"
              className={inputClass}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* course + school */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label
                htmlFor="course"
                className="block text-xs font-bold text-ink mb-1.5"
              >
                Course
              </label>
              <input
                id="course"
                type="text"
                value={course}
                placeholder="BS Comp Sci"
                className={inputClass}
                onChange={(e) => setCourse(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="school"
                className="block text-xs font-bold text-ink mb-1.5"
              >
                School
              </label>
              <input
                id="school"
                type="text"
                value={school}
                placeholder="UP Diliman"
                className={inputClass}
                onChange={(e) => setSchool(e.target.value)}
              />
            </div>
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
              value={password}
              placeholder="••••••••"
              className={inputClass}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm font-semibold text-deadline-urgent">
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
