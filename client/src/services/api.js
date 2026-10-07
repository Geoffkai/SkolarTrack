import { getStoredToken } from "./auth";

// Backend is hosted on Render — update this if the Render URL ever changes.
// VITE_API_URL (client/.env.local) overrides both, e.g. to point a local build at a staging API.
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:3000"
    : "https://skolartrack.onrender.com");

// api.js is plain JavaScript, so it can't call React hooks. Instead AuthContext hands it
// one function to run whenever the server says our token is no longer good.
let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

// The server writes its messages in lowercase ("email already in use").
function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// A shared wrapper around fetch() - every page calls this instead of writing fetch() directly
async function apiFetch(path, options = {}) {
  const token = getStoredToken();

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      // path gets glued onto BASE_URL (e.g. "/scholarships" -> "http://localhost:3000/scholarships")
      // ...options spreads in anything the caller passed (method, body, etc.)
      ...options,
      headers: {
        "Content-Type": "application/json", // tells the backend the body is JSON
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers, // lets a caller add extra headers later (e.g. Authorization)
      },
    });
  } catch {
    // fetch() itself only throws when NO response arrived: offline, server down, DNS failure.
    // Its own message ("Failed to fetch") means nothing to a user, so replace it.
    const err = new Error(
      "Can't reach the server. Check your connection and try again.",
    );
    err.status = 0;
    throw err;
  }

  // Not every response is JSON — while the server is waking up the host can answer with
  // an HTML error page — so a body that won't parse becomes null instead of a crash.
  const data = await response.json().catch(() => null);

  // fetch() does NOT throw on a 401/404/500 — it only throws on real network failure.
  if (!response.ok) {
    // We sent a token and it was refused: it expired or is no longer valid.
    // Retrying can never work, so end the session here, once, for every page.
    if (response.status === 401 && token && onUnauthorized) {
      onUnauthorized();
    }

    const err = new Error(
      data?.error
        ? capitalize(data.error)
        : `Something went wrong on our end (error ${response.status}). Please try again.`,
    );
    err.status = response.status;
    throw err;
  }

  // response is a Response OBJECT
  // hasn't been read/parsed yet. .json() reads it and parses it into real data.
  return data;
}

export default apiFetch;
