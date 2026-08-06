import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PublicBrowse from "../pages/PublicBrowse";

function Home() {
  const { token, role } = useAuth();

  if (!token) {
    return <PublicBrowse />;
  }

  if (role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Anything that isn't an admin is treated as a student — same rule as Sidebar.jsx,
  // so the nav links and the page can never disagree about an unknown role.
  return <Navigate to="/scholarships" replace />;
}

export default Home;
