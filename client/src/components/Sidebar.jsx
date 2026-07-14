import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// The signed-in left rail. Mirror of Nav: Nav hides when logged IN,
// Sidebar hides when logged OUT — so exactly one shows at a time.
function Sidebar() {
  const navigate = useNavigate();
  const { token, role, logout } = useAuth();

  // Not logged in? Render nothing and let the public <Nav /> take over.
  if (!token) return null;

  // Only show links this role can actually reach (avoids ProtectedRoute bounces).
  const links =
    role === "admin"
      ? [
          { to: "/admin/dashboard", label: "Dashboard" },
          { to: "/scholarships", label: "Browse" },
        ]
      : [
          { to: "/scholarships", label: "Browse" },
          { to: "/my-tracker", label: "My Tracker" },
        ];

  function handleLogout() {
    logout(); // clears token in state + localStorage -> every reader re-renders
    navigate("/scholarships"); // then move to the public page
  }

  // NavLink hands us { isActive }; we style the pill differently when it's the current page.
  const linkClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
      isActive ? "bg-primary text-white" : "text-ink hover:bg-chip"
    }`;

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 min-h-screen bg-surface border-r border-border p-4 gap-6">
      <div className="font-display font-bold text-lg text-ink px-1">
        SkolarTrack
      </div>

      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end className={linkClass}>
            {({ isActive }) => (
              <>
                <span
                  className={`w-4 h-4 rounded ${
                    isActive ? "bg-white" : "border-2 border-muted"
                  }`}
                ></span>
                {link.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* pushes the user block to the bottom */}
      <div className="flex-1"></div>

      <div className="flex items-center gap-3 px-1">
        <div className="w-9 h-9 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center">
          {role === "admin" ? "A" : "S"}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm text-ink capitalize">
            {role}
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold text-muted hover:text-deadline-urgent cursor-pointer"
          >
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
