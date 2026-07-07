import { Navigate } from "react-router-dom";
import { getRoleFromToken } from "../services/auth";

function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem("token");

  // Check 1: is there a token at all?
  if (!token) {
    return <Navigate to="/login" />;
  }

  // Check 2: does the token's role match what THIS route requires?
  const role = getRoleFromToken(token);
  if (role !== requiredRole) {
    return <Navigate to="/login" />;
  }

  /* Both checks passed - return whatever page was nested inside this
  instance's tags. ProtectedRoute never needs to know or care what that page actually is */
  return children;
}

export default ProtectedRoute;
