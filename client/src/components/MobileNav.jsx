import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/useAuth";
import { navLinksFor } from "./navLinks";

// The signed-in top bar for phones. The Sidebar is hidden below the md breakpoint and the
// public Nav hides once you log in — without this a logged-in phone user would have no
// way to move between pages or to log out.
function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { token, role } = useAuth();

  if (!token) return null;

  const closeMenu = () => setIsOpen(false);

  function handleLogout() {
    closeMenu();
    navigate("/logout"); // pages/Logout.jsx clears the token, then moves to the public page
  }

  const linkClass = ({ isActive }) =>
    `px-3 py-2.5 rounded-xl font-semibold text-sm ${
      isActive ? "bg-primary text-white" : "text-ink"
    }`;

  return (
    <nav className="md:hidden bg-white border-b border-border sticky top-0 z-20">
      <div className="flex items-center justify-between px-4 py-3">
        <Link
          to="/"
          onClick={closeMenu}
          className="font-display font-bold text-lg text-ink"
        >
          SkolarTrack
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex flex-col gap-1 p-2 -m-2 cursor-pointer"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          aria-controls="signed-in-menu"
        >
          <span className="w-5 h-0.5 bg-ink"></span>
          <span className="w-5 h-0.5 bg-ink"></span>
          <span className="w-5 h-0.5 bg-ink"></span>
        </button>
      </div>

      {isOpen && (
        <div id="signed-in-menu" className="flex flex-col gap-1 px-4 pb-4">
          {navLinksFor(role).map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              onClick={closeMenu}
              className={linkClass}
            >
              {link.label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="text-left px-3 py-2.5 font-semibold text-sm text-muted cursor-pointer"
          >
            Log out
          </button>
        </div>
      )}
    </nav>
  );
}

export default MobileNav;
