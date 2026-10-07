import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/useAuth";

function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  const { token } = useAuth();

  if (token) return null;

  const linkClass = ({ isActive }) =>
    isActive ? "border-b-2 border-primary font-semibold" : "text-muted";

  // tapping a link in the dropdown should also put the dropdown away
  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-20">
      {/* Top row - this div IS the flex container */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: hambuger (mobile only) + logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden flex flex-col gap-1 p-2 -m-2 cursor-pointer"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            aria-controls="public-menu"
          >
            <span className="w-5 h-0.5 bg-ink"></span>
            <span className="w-5 h-0.5 bg-ink"></span>
            <span className="w-5 h-0.5 bg-ink"></span>
          </button>
          <Link
            to="/"
            onClick={closeMenu}
            className="font-display font-bold text-lg text-ink"
          >
            SkolarTrack
          </Link>
        </div>

        {/* Center: nav links - desktop only */}
        <div className="hidden md:flex gap-4">
          <NavLink to="/scholarships" className={linkClass}>
            Browse Scholarships
          </NavLink>
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
          onClick={closeMenu}
          className="md:hidden bg-primary text-white font-semibold text-sm px-4 py-2 rounded-lg"
        >
          Sign up
        </NavLink>
      </div>

      {/* Mobile dropdown - only in the DOM at all when isOpen is true*/}
      {isOpen && (
        <div id="public-menu" className="md:hidden flex flex-col gap-4 px-4 pb-4">
          <NavLink to="/scholarships" onClick={closeMenu} className={linkClass}>
            Browse Scholarships
          </NavLink>

          <NavLink to="/login" onClick={closeMenu} className={linkClass}>
            Log In
          </NavLink>
        </div>
      )}
    </nav>
  );
}

export default Nav;
