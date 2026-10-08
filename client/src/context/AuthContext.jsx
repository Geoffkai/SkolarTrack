import { useCallback, useEffect, useMemo, useState } from "react";
import {
  clearStoredToken,
  getSession,
  getStoredToken,
  storeToken,
} from "../services/auth";
import { setUnauthorizedHandler } from "../services/api";
import { AuthContext } from "./useAuth";

// A token left in localStorage from last week may have expired since.
// Throw it away on load so the app never starts in a "logged in" state that isn't real.
function readValidToken() {
  const stored = getStoredToken();
  if (stored && !getSession(stored)) {
    clearStoredToken();
    return null;
  }
  return stored;
}

// AuthProvider holds the ONE piece of auth state and shares it downward.
export function AuthProvider({ children }) {
  // Initialize from localStorage ONCE (the function form runs only on first render),
  // so a page refresh keeps you logged in.
  const [token, setToken] = useState(readValidToken);
  // true only when the SERVER ended the session, so Login can explain why you're back there
  const [sessionExpired, setSessionExpired] = useState(false);

  // Call on successful login: persist for refreshes AND update React state.
  const login = useCallback((newToken) => {
    storeToken(newToken);
    setSessionExpired(false);
    setToken(newToken); // <- this is the reactive part: every reader re-renders
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setSessionExpired(false);
    setToken(null);
  }, []);

  // Tell api.js what to do when a request comes back 401 with our token attached.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearStoredToken();
      setSessionExpired(true);
      setToken(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // The 'storage' event fires in every OTHER tab when localStorage changes,
  // so logging out (or in) in one tab is reflected in all of them.
  useEffect(() => {
    function syncFromOtherTab(event) {
      if (event.key === "token") setToken(readValidToken());
    }
    window.addEventListener("storage", syncFromOtherTab);
    return () => window.removeEventListener("storage", syncFromOtherTab);
  }, []);

  // Derive who we are from whatever token we currently have.
  const session = token ? getSession(token) : null;
  // if the token expired while the tab sat open, session is null — treat that as logged out
  const activeToken = session ? token : null;
  const role = session?.role ?? null;
  const userId = session?.userId ?? null;

  // useMemo keeps this object the same between renders unless one of its values changed,
  // so components reading the context don't re-render for nothing.
  const value = useMemo(
    () => ({ token: activeToken, role, userId, sessionExpired, login, logout }),
    [activeToken, role, userId, sessionExpired, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
