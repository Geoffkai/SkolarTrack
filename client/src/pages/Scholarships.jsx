import { useMemo, useState } from "react";
import { useApi } from "../hooks/useApi";
import ScholarshipList from "../components/ScholarshipList";
import { ErrorState, Loading } from "../components/PageState";
import { chipBase, chipOff, chipOn } from "../components/styles";
import {
  SORT_OPTIONS,
  filterScholarships,
  sortScholarships,
} from "../utils/scholarships";

const AMOUNT_OPTIONS = [
  { value: 0, label: "Any amount" },
  { value: 10000, label: "₱10,000 or more" },
  { value: 25000, label: "₱25,000 or more" },
  { value: 50000, label: "₱50,000 or more" },
  { value: 100000, label: "₱100,000 or more" },
];

const selectClass =
  "bg-white border border-border rounded-lg px-3 py-2 text-xs font-semibold text-ink shadow-sm cursor-pointer focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function Scholarships() {
  const { data, error, isLoading, retry } = useApi("/scholarships");

  const [search, setSearch] = useState("");
  const [openOnly, setOpenOnly] = useState(true);
  const [closingSoon, setClosingSoon] = useState(false);
  const [minAmount, setMinAmount] = useState(0);
  const [sortBy, setSortBy] = useState("deadline");

  // Derive the list we actually show. useMemo remembers the result and only
  // recomputes when one of its dependencies changes.
  const visible = useMemo(() => {
    const rows = filterScholarships(data?.scholarships ?? [], {
      search,
      openOnly,
      closingSoon,
      minAmount,
    });
    return sortScholarships(rows, sortBy);
  }, [data, search, openOnly, closingSoon, minAmount, sortBy]);

  if (isLoading) {
    return <Loading label="Loading scholarships…" />;
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={retry} />;
  }

  const hasAnyListings = data.scholarships.length > 0;

  function clearFilters() {
    setSearch("");
    setOpenOnly(false);
    setClosingSoon(false);
    setMinAmount(0);
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {/* Header: title + search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="font-display font-bold text-2xl md:text-3xl text-ink">
            Scholarships
          </h1>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, organization or course"
            aria-label="Search scholarships"
            className="w-full md:w-80 bg-white border border-border rounded-lg px-4 py-2.5 text-sm font-body text-ink placeholder:text-muted shadow-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Filters: toggles on the left, dropdowns on the right */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button
            onClick={() => setOpenOnly((v) => !v)}
            aria-pressed={openOnly}
            className={`${chipBase} ${openOnly ? chipOn : chipOff}`}
          >
            Open only
          </button>
          <button
            onClick={() => setClosingSoon((v) => !v)}
            aria-pressed={closingSoon}
            className={`${chipBase} ${closingSoon ? chipOn : chipOff}`}
          >
            Closing in 2 weeks
          </button>

          <select
            value={minAmount}
            onChange={(e) => setMinAmount(Number(e.target.value))}
            aria-label="Minimum amount"
            className={selectClass}
          >
            {AMOUNT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort scholarships"
            className={selectClass}
          >
            {Object.entries(SORT_OPTIONS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {visible.length === 0 ? (
          <div className="mt-8">
            <p className="text-muted font-body">
              {hasAnyListings
                ? "No scholarships match your search and filters."
                : "No scholarships have been posted yet. Check back soon."}
            </p>
            {hasAnyListings && (
              <button
                onClick={clearFilters}
                className="mt-3 text-sm font-semibold text-primary hover:underline cursor-pointer"
              >
                Clear search and filters
              </button>
            )}
          </div>
        ) : (
          <div className="mt-5">
            <ScholarshipList scholarships={visible} />
            <p className="text-center text-xs font-semibold text-muted mt-6 pt-4 border-t border-border">
              Showing {visible.length} of {data.scholarships.length} scholarship
              {data.scholarships.length === 1 ? "" : "s"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Scholarships;
