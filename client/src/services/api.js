// The one place this changes when deploying - swap this for the Railway URL on deployment
const BASE_URL = "http://localhost:3000";

// A shared wrapper around fetch() - every page calls this instead of writing fetch() directly
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${BASE_URL}${path}`, {
    // path gets glued onto BASE_URL (e.g. "/scholarships" -> "http://localhost:3000/scholarships")
    // ...options spreads in anything the caller passed (method, body, etc.)
    ...options,
    headers: {
      "Content-Type": "application/json", // tells the backend the body is JSON
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers, // lets a caller add extra headers later (e.g. Authorization)
    },
  });

  const data = await response.json();
  // fetch() does NOT throw on a 401/404/500 — it only throws on real network failure.
  if (!response.ok) {
    const err = new Error(data.error || `Request failed ${response.status}`);
    err.status = response.status;
    throw err;
  }

  // response is a Response OBJECT
  // hasn't been read/parsed yet. .json() reads it and parses it into real data.
  return data;
}

export default apiFetch;
