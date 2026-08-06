import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import apiFetch from "../services/api";

// Your real application statuses (schema-enforced). The design's "Awarded/Rejected"
// don't exist yet, so we filter by these.
const STAGES = ["interested", "applied", "interview", "result"];

// A label + colored chip per status, using the theme tokens.
const STAGE_STYLE = {
  interested: "bg-chip text-muted",
  applied: "bg-chip text-primary",
  interview: "bg-chip text-amount",
  result: "bg-chip text-success",
};

function AdminApplicants() {
  const { id } = useParams();
  const [scholarship, setScholarship] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("all");

  function load() {
    setIsLoading(true);
    setError(null);
    // Fetch the scholarship (for its title) and its applicants together.
    Promise.all([
      apiFetch(`/scholarships/${id}`),
      apiFetch(`/scholarships/${id}/applications`),
    ])
      .then(([schData, appData]) => {
        setScholarship(schData.scholarship);
        setApplicants(appData.applications);
      })
      .catch((err) => {
        console.error("Failed to load applicants: ", err);
        setError(err);
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    load();
  }, [id]);

  // Count per stage (for the chip labels), recomputed only when applicants change.
  const counts = useMemo(() => {
    const c = { all: applicants.length };
    for (const s of STAGES) {
      c[s] = applicants.filter((a) => a.status === s).length;
    }
    return c;
  }, [applicants]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return applicants.filter((a) => {
      if (stage !== "all" && a.status !== stage) return false;
      if (!query) return true;
      return (
        a.name?.toLowerCase().includes(query) ||
        a.school?.toLowerCase().includes(query) ||
        a.email?.toLowerCase().includes(query)
      );
    });
  }, [applicants, stage, search]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        <p className="text-muted font-body">Loading applicants…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        <p className="text-deadline-urgent font-semibold">{error.message}</p>
        <button
          onClick={load}
          className="mt-3 bg-primary text-white font-semibold text-sm px-4 py-2 rounded-lg cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const chipBase =
    "font-semibold text-xs px-3.5 py-2 rounded-lg cursor-pointer capitalize whitespace-nowrap";

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <Link
          to="/admin/dashboard"
          className="text-xs font-semibold text-primary hover:underline"
        >
          ← Back to dashboard
        </Link>

        {/* header */}
        <div className="mt-3">
          <p className="text-xs font-semibold text-muted">Applicants for</p>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-1">
            <h1 className="font-display font-bold text-xl md:text-2xl text-ink">
              {scholarship?.title}
            </h1>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search applicants..."
              className="w-full md:w-56 bg-white border border-border rounded-lg px-4 py-2.5 text-sm font-body text-ink placeholder:text-muted shadow-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* stage filter chips */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          <button
            onClick={() => setStage("all")}
            className={`${chipBase} ${
              stage === "all" ? "bg-primary text-white" : "bg-chip text-primary"
            }`}
          >
            All · {counts.all}
          </button>
          {STAGES.map((s) => (
            <button
              key={s}
              onClick={() => setStage(s)}
              className={`${chipBase} ${
                stage === s ? "bg-primary text-white" : "bg-chip text-primary"
              }`}
            >
              {s} · {counts[s]}
            </button>
          ))}
        </div>

        {/* applicants table */}
        {visible.length === 0 ? (
          <p className="text-sm text-muted mt-8">
            {applicants.length === 0
              ? "No one has applied to this scholarship yet."
              : "No applicants match your filters."}
          </p>
        ) : (
          <div className="mt-5 bg-white rounded-2xl border border-border shadow-sm overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[1.6fr_1fr_0.8fr] px-5 py-3 text-[10.5px] font-bold text-muted border-b border-border">
                <div>APPLICANT</div>
                <div>SCHOOL</div>
                <div>STAGE</div>
              </div>

              {visible.map((a) => (
                <div
                  key={a.id}
                  className="grid grid-cols-[1.6fr_1fr_0.8fr] px-5 py-4 items-center border-b border-border last:border-b-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 shrink-0 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center">
                      {a.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-ink truncate">
                        {a.name}
                      </div>
                      <div className="text-xs text-muted truncate">
                        {a.email}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-muted truncate">
                    {a.school || "—"}
                  </div>
                  <div>
                    <span
                      className={`text-[10.5px] font-bold px-2.5 py-1 rounded-md capitalize ${
                        STAGE_STYLE[a.status] || "bg-chip text-muted"
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminApplicants;
