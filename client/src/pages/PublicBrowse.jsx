import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import ScholarshipList from "../components/ScholarshipList";
import { ErrorState, Loading } from "../components/PageState";
import { chipBase, chipOff, chipOn } from "../components/styles";
import { filterScholarships, sortScholarships } from "../utils/scholarships";

// The pre-login (public) browse view. Same rows as the signed-in page, but the
// chrome is a marketing hero + a "sign up" call-to-action instead of app tools.
function PublicBrowse() {
  const { data, error, isLoading, retry } = useApi("/scholarships");

  const [search, setSearch] = useState("");
  const [soonestFirst, setSoonestFirst] = useState(true);

  const visible = useMemo(() => {
    // Public visitors only ever see OPEN scholarships.
    const rows = filterScholarships(data?.scholarships ?? [], {
      search,
      openOnly: true,
    });
    return sortScholarships(rows, soonestFirst ? "deadline" : "newest");
  }, [data, search, soonestFirst]);

  if (isLoading) {
    return <Loading label="Loading scholarships…" />;
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={retry} />;
  }

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
            placeholder="Search by name, organization or course"
            aria-label="Search scholarships"
            className="w-full md:w-96 bg-white border border-border rounded-xl px-4 py-3 text-sm font-body text-ink placeholder:text-muted shadow-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={() => setSoonestFirst((v) => !v)}
            aria-pressed={soonestFirst}
            className={`${chipBase} ${soonestFirst ? chipOn : chipOff}`}
          >
            {soonestFirst ? "Soonest deadline first" : "Newest first"}
          </button>
        </div>

        {/* The shared list */}
        <div className="mt-8">
          {visible.length === 0 ? (
            <p className="text-center text-muted font-body py-8">
              {search.trim()
                ? "No open scholarships match that search."
                : "No open scholarships right now. Check back soon."}
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
