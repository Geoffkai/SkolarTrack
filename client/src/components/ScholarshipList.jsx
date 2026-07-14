import { Link, useNavigate } from "react-router-dom";

// --- Date helpers: pure calculations, so they live outside the component ---

function daysLeft(deadline) {
  const today = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate - today;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// Fewer than two weeks out is treated as urgent — drives the red text + accent bar
function isUrgent(deadline) {
  const d = daysLeft(deadline);
  return d >= 0 && d <= 14;
}

function deadlineLabel(deadline) {
  const d = daysLeft(deadline);
  if (d < 0) return "Closed";
  if (d === 0) return "Due today";
  return `${d} day${d === 1 ? "" : "s"} left`;
}

// Presentational only: it receives an already-filtered/sorted array and draws it.
// It does NOT fetch, filter, or know anything about login state.
function ScholarshipList({ scholarships }) {
  const navigate = useNavigate();

  return (
    <>
      {/* Desktop: table */}
      <div className="hidden md:block bg-white rounded-2xl overflow-hidden shadow-sm border border-border">
        <div className="grid grid-cols-[1.6fr_1fr_0.8fr_0.8fr] px-5 py-3 text-[10.5px] font-bold tracking-wide text-muted border-b border-border">
          <div>SCHOLARSHIP</div>
          <div>ORGANIZATION</div>
          <div>AMOUNT</div>
          <div>DEADLINE</div>
        </div>
        {scholarships.map((sch) => (
          <div
            key={sch.id}
            onClick={() => navigate(`/scholarships/${sch.id}`)}
            className="grid grid-cols-[1.6fr_1fr_0.8fr_0.8fr] px-5 py-4 items-center border-b border-border last:border-b-0 cursor-pointer hover:bg-surface transition-colors"
          >
            <div className="font-display font-bold text-sm text-ink pr-3">
              {sch.title}
            </div>
            <div className="text-xs font-semibold text-muted">
              {sch.organization}
            </div>
            <div className="text-xs font-semibold text-amount">
              ₱{Number(sch.amount).toLocaleString()}
            </div>
            <div
              className={`text-xs ${
                isUrgent(sch.deadline)
                  ? "font-bold text-deadline-urgent"
                  : "font-semibold text-muted"
              }`}
            >
              {deadlineLabel(sch.deadline)}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: scan list */}
      <ul className="md:hidden">
        {scholarships.map((sch) => {
          const urgent = isUrgent(sch.deadline);
          return (
            <li
              key={sch.id}
              className="flex gap-3 items-stretch py-4 border-b border-border last:border-b-0"
            >
              <div
                className={`w-1.5 rounded-full ${
                  urgent ? "bg-deadline-urgent" : "bg-primary"
                }`}
              ></div>
              <div className="flex-1">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-[10px] text-muted uppercase tracking-wide">
                    {sch.organization}
                  </span>
                  <span
                    className={`font-bold text-[10.5px] ${
                      urgent ? "text-deadline-urgent" : "text-muted"
                    }`}
                  >
                    {daysLeft(sch.deadline) < 0
                      ? "Closed"
                      : `${daysLeft(sch.deadline)}d left`}
                  </span>
                </div>
                <Link
                  to={`/scholarships/${sch.id}`}
                  className="block font-display font-bold text-ink mt-1"
                >
                  {sch.title}
                </Link>
                <p className="text-xs font-semibold text-amount mt-1">
                  ₱{Number(sch.amount).toLocaleString()}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default ScholarshipList;
