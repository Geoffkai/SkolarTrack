const TOKEN_KEY = "token";

// The middle part of a JWT is base64url-encoded JSON. base64url swaps "+" and "/" for
// "-" and "_" (so tokens are safe inside URLs); atob() only understands the originals.
function decodePayload(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    // not a string, not three parts, not base64, not JSON — all just mean "not a token"
    return null;
  }
}

// Who the token says we are, or null if it's malformed or already expired.
// This only decides what the UI SHOWS. Anyone can edit their own localStorage, so the
// browser can't trust this — the server re-verifies the signature on every request.
export function getSession(token, now = Date.now()) {
  const payload = decodePayload(token);
  if (!payload || typeof payload.role !== "string") return null;
  // exp is in seconds, Date.now() is in milliseconds
  if (typeof payload.exp === "number" && payload.exp * 1000 <= now) return null;
  return { userId: payload.userId, role: payload.role };
}

// localStorage can throw (storage blocked, some private modes), so every touch goes
// through these three instead of being scattered across the app.
export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // still logged in for this tab; the token just won't survive a refresh
  }
}

export function clearStoredToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // nothing stored, nothing to clear
  }
}
