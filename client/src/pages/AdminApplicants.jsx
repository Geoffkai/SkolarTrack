import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/useAuth";
import { ErrorState, Loading } from "../components/PageState";
import { secondaryButton } from "../components/styles";
import { STAGES, stageFor } from "../utils/stages";

function AdminApplicants() {
  const { id } = useParams();
  const { userId } = useAuth();

  // Two requests, started together: the scholarship (for its title) and its applicants.
  const scholarshipRequest = useApi(`/scholarships/${id}`);
  const applicantsRequest = useApi(`/scholarships/${id}/applications`);

  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("all");

  const applicants = useMemo(
    () => applicantsRequest.data?.applications ?? [],
    [applicantsRequest.data],
  );

  // Count per stage (for the chip labels), recomputed only when applicants change.
  const counts = useMemo(() => {
    const c = { all: applicants.length };
    for (const s of STAGES) {
      c[s.key] = applicants.filter((a) => a.status === s.key).length;
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
        a.course?.toLowerCase().includes(query) ||
        a.email?.toLowerCase().includes(query)
      );
    });
  }, [applicants, stage, search]);

  if (scholarshipRequest.isLoading || applicantsRequest.isLoading) {
    return <Loading label="Loading applicants…" />;
  }

  const error = scholarshipRequest.error || applicantsRequest.error;
  if (error) {
    const isMissing = error.status === 404 || error.status === 400;
    return (
      <ErrorState
        message={isMissing ? "This listing doesn't exist." : error.message}
        onRetry={
          isMissing
            ? undefined
            : () => {
                scholarshipRequest.retry();
                applicantsRequest.retry();
              }
        }
      >
        <Link to="/admin/dashboard" className={secondaryButton}>
          Back to dashboard
        </Link>
      </ErrorState>
    );
  }

  const scholarship = scholarshipRequest.data.scholarship;

  // The server already returns an empty list for a listing you didn't post. Saying
  // so is clearer than an empty table that looks like "nobody applied".
  if (scholarship.posted_by !== userId) {
    return (
      <ErrorState message="You can only see applicants for listings you posted.">
        <Link to="/admin/dashboard" className={secondaryButton}>
          Back to dashboard
        </Link>
      </ErrorState>
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
              {scholarship.title}
            </h1>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search applicants..."
              aria-label="Search applicants"
              className="w-full md:w-56 bg-white border border-border rounded-lg px-4 py-2.5 text-sm font-body text-ink placeholder:text-muted shadow-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* stage filter chips */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          <button
            onClick={() => setStage("all")}
            aria-pressed={stage === "all"}
            className={`${chipBase} ${
              stage === "all" ? "bg-primary text-white" : "bg-chip text-primary"
            }`}
          >
            All · {counts.all}
          </button>
          {STAGES.map((s) => (
            <button
              key={s.key}
              onClick={() => setStage(s.key)}
              aria-pressed={stage === s.key}
              className={`${chipBase} ${
                stage === s.key
                  ? "bg-primary text-white"
                  : "bg-chip text-primary"
              }`}
            >
              {s.label} · {counts[s.key]}
            </button>
          ))}
        </div>

        {/* applicants table */}
        {visible.length === 0 ? (
          <p className="text-sm text-muted mt-8">
            {applicants.length === 0
              ? "No one has saved this scholarship yet."
              : "No applicants match your search and stage filter."}
          </p>
        ) : (
          <div className="mt-5 bg-white rounded-2xl border border-border shadow-sm overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[1.6fr_1fr_0.8fr] px-5 py-3 text-[10.5px] font-bold text-muted border-b border-border">
                <div>APPLICANT</div>
                <div>SCHOOL &amp; COURSE</div>
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
                        {a.name || "No name given"}
                      </div>
                      <a
                        href={`mailto:${a.email}`}
                        className="block text-xs text-muted truncate hover:text-primary hover:underline"
                      >
                        {a.email}
                      </a>
                    </div>
                  </div>
                  <div className="min-w-0 pr-3">
                    <div className="text-xs font-semibold text-muted truncate">
                      {a.school || "—"}
                    </div>
                    {a.course && (
                      <div className="text-xs text-muted truncate">
                        {a.course}
                      </div>
                    )}
                  </div>
                  <div>
                    <span
                      className={`text-[10.5px] font-bold px-2.5 py-1 rounded-md bg-chip ${stageFor(a.status).text}`}
                    >
                      {stageFor(a.status).label}
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
