//AdminDashboard.jsx
import { useEffect, useState } from "react";
import apiFetch from "../services/api";
import { Link } from "react-router-dom";

function daysLeft(deadline) {
  return Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
}

function deadlineLabel(sch) {
  if (sch.status === "closed") return "Closed";
  const d = daysLeft(sch.deadline);
  if (d < 0) return "Closed";
  if (d === 0) return "Due today";
  return `${d} days left`;
}

const PREVIEW_COUNT = 5;

function AdminDashboard() {
  const [scholarships, setScholarships] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [showAll, setShowAll] = useState(false);

  function fetchScholarships() {
    setIsLoading(true);
    setError(null);
    apiFetch("/scholarships/mine")
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

  async function handleClose(scholarshipId) {
    setActionError(null);
    try {
      await apiFetch(`/scholarships/${scholarshipId}`, { method: "DELETE" });
      setScholarships((current) =>
        current.map((sch) =>
          sch.id === scholarshipId ? { ...sch, status: "closed" } : sch,
        ),
      );
    } catch (err) {
      console.error("Failed to close scholarship: ", err);
      setActionError(err);
    }
  }

  async function handleReopen(sch) {
    setActionError(null);
    try {
      await apiFetch(`/scholarships/${sch.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...sch, status: "open" }),
      });
      setScholarships((current) =>
        current.map((s) =>
          s.id === sch.id ? { ...s, status: "open" } : s,
        ),
      );
    } catch (err) {
      console.error("Failed to reopen scholarship: ", err);
      setActionError(err);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        <p className="text-muted font-body">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
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

  // Overview numbers, all derived from real data
  const activeCount = scholarships.filter((s) => s.status === "open").length;
  const closedCount = scholarships.filter((s) => s.status === "closed").length;
  const totalApplicants = scholarships.reduce(
    (sum, s) => sum + (s.applicant_count || 0),
    0,
  );

  const visibleListings = showAll
    ? scholarships
    : scholarships.slice(0, PREVIEW_COUNT);

  const statTiles = [
    { label: "ACTIVE LISTINGS", value: activeCount, color: "text-ink" },
    { label: "TOTAL APPLICANTS", value: totalApplicants, color: "text-ink" },
    { label: "CLOSED LISTINGS", value: closedCount, color: "text-muted" },
  ];

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {/* header */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display font-bold text-2xl md:text-3xl text-ink">
            Overview
          </h1>
          <Link
            to="/admin/scholarships/new"
            className="bg-primary text-white font-semibold text-sm px-4 py-2.5 rounded-lg hover:brightness-95 whitespace-nowrap"
          >
            + New listing
          </Link>
        </div>

        {actionError && (
          <p className="text-sm font-semibold text-deadline-urgent mt-4">
            {actionError.message}
          </p>
        )}

        {/* stat tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
          {statTiles.map((tile) => (
            <div
              key={tile.label}
              className="bg-white rounded-xl border border-border p-4 shadow-sm"
            >
              <div className="text-[10.5px] font-bold text-muted">
                {tile.label}
              </div>
              <div
                className={`font-display font-bold text-2xl mt-1 ${tile.color}`}
              >
                {tile.value}
              </div>
            </div>
          ))}
        </div>

        {/* listings */}
        <div className="flex items-center justify-between mt-8 mb-3">
          <h2 className="font-display font-bold text-lg text-ink">
            Your listings
          </h2>
          {scholarships.length > PREVIEW_COUNT && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              {showAll ? "Show less" : "View all →"}
            </button>
          )}
        </div>

        {scholarships.length === 0 ? (
          <p className="text-sm text-muted">
            No listings yet. Click “+ New listing” to post your first scholarship.
          </p>
        ) : (
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-x-auto">
            <div className="min-w-[640px]">
              {/* header row */}
              <div className="grid grid-cols-[1.8fr_0.8fr_0.9fr_0.8fr_1.2fr] px-5 py-3 text-[10.5px] font-bold text-muted border-b border-border">
                <div>SCHOLARSHIP</div>
                <div>APPLICANTS</div>
                <div>DEADLINE</div>
                <div>STATUS</div>
                <div className="text-right">ACTIONS</div>
              </div>

              {visibleListings.map((sch) => (
                <div
                  key={sch.id}
                  className="grid grid-cols-[1.8fr_0.8fr_0.9fr_0.8fr_1.2fr] px-5 py-4 items-center border-b border-border last:border-b-0"
                >
                  <div className="font-display font-bold text-sm text-ink pr-3">
                    {sch.title}
                  </div>
                  <div className="text-xs font-semibold text-muted">
                    {sch.applicant_count}
                  </div>
                  <div
                    className={`text-xs font-semibold ${
                      sch.status === "open" && daysLeft(sch.deadline) <= 14
                        ? "text-deadline-urgent"
                        : "text-muted"
                    }`}
                  >
                    {deadlineLabel(sch)}
                  </div>
                  <div>
                    <span
                      className={`text-[10.5px] font-bold px-2.5 py-1 rounded-md ${
                        sch.status === "open"
                          ? "bg-chip text-success"
                          : "bg-chip text-muted"
                      }`}
                    >
                      {sch.status === "open" ? "Open" : "Closed"}
                    </span>
                  </div>
                  <div className="flex gap-3 justify-end text-xs font-semibold">
                    <Link
                      to={`/admin/scholarships/${sch.id}/applicants`}
                      className="text-primary hover:underline"
                    >
                      Manage
                    </Link>
                    <Link
                      to={`/admin/scholarships/${sch.id}/edit`}
                      className="text-primary hover:underline"
                    >
                      Edit
                    </Link>
                    {sch.status === "open" ? (
                      <button
                        onClick={() => handleClose(sch.id)}
                        className="text-deadline-urgent hover:underline cursor-pointer"
                      >
                        Close
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReopen(sch)}
                        className="text-success hover:underline cursor-pointer"
                      >
                        Reopen
                      </button>
                    )}
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

export default AdminDashboard;
