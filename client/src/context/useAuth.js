import { createContext, useContext } from "react";

// A Context is a value any component in the tree can read without prop-drilling.
// It lives in its own file (not next to AuthProvider) because a file that exports a
// component should export only components — that's what lets Vite hot-reload it.
export const AuthContext = createContext(null);

// A tiny convenience hook so components write `useAuth()` instead of useContext(...).
export function useAuth() {
  return useContext(AuthContext);
}
