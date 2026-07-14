import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import apiFetch from "../services/api";
import ScholarshipList from "../components/ScholarshipList";

// The pre-login (public) browse view. Same rows as the signed-in page, but the
// chrome is a marketing hero + a "sign up" call-to-action instead of app tools.
function PublicBrowse() {
  const [scholarships, setScholarships] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [soonestFirst, setSoonestFirst] = useState(true);

  function fetchScholarships() {
    setIsLoading(true);
    setError(null);
    apiFetch("/scholarships")
      .then((data) => setScholarships(data.scholarships))
      .catch((err) => {
        console.error("Failed to load scholarships: ", err);
        setError(err);
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    fetchScholarships();
  }, []);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    // Public visitors only ever see OPEN scholarships.
    let rows = scholarships.filter((sch) => {
      if (sch.status !== "open") return false;
      if (!query) return true;
      return (
        sch.title?.toLowerCase().includes(query) ||
        sch.organization?.toLowerCase().includes(query)
      );
    });

    if (soonestFirst) {
      rows = [...rows].sort(
        (a, b) => new Date(a.deadline) - new Date(b.deadline),
      );
    }
    return rows;
  }, [scholarships, search, soonestFirst]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-muted font-body">Loading scholarships…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-deadline-urgent font-semibold">{error.message}</p>
        <button
          onClick={fetchScholarships}
          className="mt-3 bg-primary text-white font-semibold text-sm px-4 py-2 rounded-lg cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const chipBase =
    "font-semibold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer select-none whitespace-nowrap";
  const chipOff = "bg-chip text-primary hover:brightness-95";
  const chipOn = "bg-primary text-white";

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Hero */}
        <div className="text-center max-w-xl mx-auto">
          <h1 className="font-display font-bold text-2xl md:text-4xl text-ink">
            Find every scholarship you&rsquo;re eligible for
          </h1>
          <p className="text-sm md:text-base font-body text-muted mt-3 leading-relaxed">
            Browse open scholarships from CHED, DOST, local governments and
            foundations. Create a free account to save listings and track your
            applications.
          </p>
        </div>

        {/* Search + filter row */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-center mt-8">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search scholarships..."
            className="w-full md:w-96 bg-white border border-border rounded-xl px-4 py-3 text-sm font-body text-ink placeholder:text-muted shadow-sm focus:outline-none focus:border-primary"
          />
          <button
            onClick={() => setSoonestFirst((v) => !v)}
            className={`${chipBase} ${soonestFirst ? chipOn : chipOff}`}
          >
            Deadline {soonestFirst ? "↑" : "↕"}
          </button>
        </div>

        {/* The shared list */}
        <div className="mt-8">
          {visible.length === 0 ? (
            <p className="text-center text-muted font-body py-8">
              No open scholarships right now — check back soon.
            </p>
          ) : (
            <ScholarshipList scholarships={visible} />
          )}
        </div>

        {/* Call to action */}
        <div className="text-center mt-8">
          <Link
            to="/register"
            className="inline-block font-semibold text-sm text-primary hover:underline"
          >
            Sign up to save scholarships and track your applications &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PublicBrowse;
