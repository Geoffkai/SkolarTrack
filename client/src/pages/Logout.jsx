import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

// Logging out is its own (public) route on purpose. If "Log out" cleared the token while
// the student was still ON a protected page, ProtectedRoute would react first and bounce
// them to /login. Moving here first means the token is cleared on a page that doesn't
// care about it, and the redirect below reliably lands on the public browse page.
function Logout() {
  const { logout } = useAuth();

  useEffect(() => {
    logout(); // clears token in state + localStorage -> every reader re-renders
  }, [logout]);

  return <Navigate to="/scholarships" replace />;
}

export default Logout;
