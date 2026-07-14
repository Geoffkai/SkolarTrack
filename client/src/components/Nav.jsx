import { NavLink } from "react-router-dom";
import { useState } from "react";

function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  const token = localStorage.getItem("token");

  if (token) return null;

  const linkClass = ({ isActive }) =>
    isActive ? "border-b-2 border-primary font-semibold" : "text-muted";

  return (
    <nav className="bg-white border-b border-border">
      {/* Top row - this div IS the flex container */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: hambuger (mobile only) + logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden flex flex-col gap-1"
          >
            <span className="w-5 h-0.5 bg-ink"></span>
            <span className="w-5 h-0.5 bg-ink"></span>
            <span className="w-5 h-0.5 bg-ink"></span>
          </button>
          <span className="font-display font-bold text-lg text-ink">
            SkolarTrack
          </span>
        </div>

        {/* Center: nav links - desktop only */}
        <div className="hidden md:flex gap-4">
          <NavLink to="/scholarships" className={linkClass}>
            Browse Scholarships
          </NavLink>
          <span className="text-muted">About</span>
          <span className="text-muted">For Institutions</span>
        </div>

        {/* Right: Login + Sign up - desktop only */}
        <div className="hidden md:flex items-center gap-4">
          <NavLink to="/login" className={linkClass}>
            Log In
          </NavLink>
          <NavLink
            to="/register"
            className="hidden md:flex bg-primary text-white font-semibold text-sm px-4 py-2 rounded-lg"
          >
            Sign up free
          </NavLink>
        </div>

        {/* Mobile-only: compact Sign up, replaces the whole right+center group */}
        <NavLink
          to="/register"
          className="md:hidden bg-primary text-white font-semibold text-sm px-4 py-2 rounded-lg"
        >
          Sign up
        </NavLink>
      </div>

      {/* Mobile dropdown - only in the DOM at all when isOpen is true*/}
      {isOpen && (
        <div className="md:hidden flex flex-col gap-4 px-4 pb-4">
          <NavLink to="/scholarships" className={linkClass}>
            Browse Scholarships
          </NavLink>

          <NavLink to="/login" className={linkClass}>
            Log In
          </NavLink>
        </div>
      )}
    </nav>
  );
}

export default Nav;
