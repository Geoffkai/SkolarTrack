import { createContext, useContext, useState } from "react";
import { getRoleFromToken } from "../services/auth";

// A Context is a value any component in the tree can read without prop-drilling.
const AuthContext = createContext(null);

// AuthProvider holds the ONE piece of auth state and shares it downward.
export function AuthProvider({ children }) {
  // Initialize from localStorage ONCE (the function form runs only on first render),
  // so a page refresh keeps you logged in.
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  // Call on successful login: persist for refreshes AND update React state.
  function login(newToken) {
    localStorage.setItem("token", newToken);
    setToken(newToken); // <- this is the reactive part: every reader re-renders
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
  }

  // Derive the role from whatever token we currently have.
  const role = token ? getRoleFromToken(token) : null;

  return (
    <AuthContext.Provider value={{ token, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// A tiny convenience hook so components write `useAuth()` instead of useContext(...).
export function useAuth() {
  return useContext(AuthContext);
}
