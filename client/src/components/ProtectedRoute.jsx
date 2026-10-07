import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function ProtectedRoute({ children, requiredRole }) {
  // Read from context (not localStorage directly) so this re-renders the moment the
  // session ends — e.g. when a request comes back 401 and AuthContext clears the token.
  const { token, role } = useAuth();
  const location = useLocation();

  // Check 1: is there a token at all?
  if (!token) {
    // remember where they were headed so Login can send them back afterwards
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Check 2: does the token's role match what THIS route requires?
  // They ARE logged in, just as the other role — so send them to their own home
  // page, not to a login form they'd have no reason to fill in.
  if (role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  /* Both checks passed - return whatever page was nested inside this
  instance's tags. ProtectedRoute never needs to know or care what that page actually is */
  return children;
}

export default ProtectedRoute;
