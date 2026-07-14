import { useEffect, useMemo, useState } from "react";
import apiFetch from "../services/api";
import ScholarshipList from "../components/ScholarshipList";

function Scholarships() {
  const [scholarships, setScholarships] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [openOnly, setOpenOnly] = useState(true);
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

  // Derive the list we actually show. useMemo remembers the result and only
  // recomputes when one of its dependencies changes.
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    let rows = scholarships.filter((sch) => {
      if (openOnly && sch.status !== "open") return false; // hide closed ones
      if (!query) return true; // empty search box -> keep everything
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
  }, [scholarships, search, openOnly, soonestFirst]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <p className="text-muted font-body">Loading scholarships…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
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
    "font-semibold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer select-none";
  const chipOff = "bg-chip text-primary hover:brightness-95";
  const chipOn = "bg-primary text-white";

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8 bg-surface">
      {/* Header: title + search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="font-display font-bold text-2xl md:text-3xl text-ink">
          Scholarships
        </h1>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search scholarships..."
          className="w-full md:w-64 bg-white border border-border rounded-lg px-4 py-2.5 text-sm font-body text-ink placeholder:text-muted shadow-sm focus:outline-none focus:border-primary"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
        <button
          onClick={() => setOpenOnly((v) => !v)}
          className={`${chipBase} ${openOnly ? chipOn : chipOff} whitespace-nowrap`}
        >
          Open only
        </button>
        <button
          onClick={() => setSoonestFirst((v) => !v)}
          className={`${chipBase} ${soonestFirst ? chipOn : chipOff} whitespace-nowrap`}
        >
          Deadline {soonestFirst ? "↑" : "↕"}
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="text-muted font-body mt-8">
          No scholarships match your filters.
        </p>
      ) : (
        <div className="mt-5">
          <ScholarshipList scholarships={visible} />
          <p className="text-center text-xs font-semibold text-muted mt-6 pt-4 border-t border-border">
            {visible.length} {openOnly ? "open " : ""}
            scholarship{visible.length === 1 ? "" : "s"}
            {openOnly ? " match your profile" : ""}
          </p>
        </div>
      )}
    </div>
  );
}

export default Scholarships;
