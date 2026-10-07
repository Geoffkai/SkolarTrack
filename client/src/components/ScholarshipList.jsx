import { Link, useNavigate } from "react-router-dom";
import { deadlineStatus } from "../utils/dates";
import { formatPeso } from "../utils/format";

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
        {scholarships.map((sch) => {
          const deadline = deadlineStatus(sch);
          return (
            // The whole row is clickable for mouse users; the title inside is a real link,
            // which is what keyboard and screen-reader users land on.
            <div
              key={sch.id}
              onClick={() => navigate(`/scholarships/${sch.id}`)}
              className="grid grid-cols-[1.6fr_1fr_0.8fr_0.8fr] px-5 py-4 items-center border-b border-border last:border-b-0 cursor-pointer hover:bg-surface transition-colors"
            >
              <Link
                to={`/scholarships/${sch.id}`}
                onClick={(e) => e.stopPropagation()}
                className="font-display font-bold text-sm text-ink pr-3 hover:underline"
              >
                {sch.title}
              </Link>
              <div className="text-xs font-semibold text-muted">
                {sch.organization}
              </div>
              <div className="text-xs font-semibold text-amount">
                {formatPeso(sch.amount)}
              </div>
              <div
                className={`text-xs ${
                  deadline.isUrgent
                    ? "font-bold text-deadline-urgent"
                    : "font-semibold text-muted"
                }`}
              >
                {deadline.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: scan list */}
      <ul className="md:hidden">
        {scholarships.map((sch) => {
          const deadline = deadlineStatus(sch);
          return (
            <li
              key={sch.id}
              className="flex gap-3 items-stretch py-4 border-b border-border last:border-b-0"
            >
              <div
                className={`w-1.5 rounded-full ${
                  deadline.isUrgent
                    ? "bg-deadline-urgent"
                    : deadline.isOver
                      ? "bg-border"
                      : "bg-primary"
                }`}
              ></div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline gap-3">
                  <span className="font-semibold text-[10px] text-muted uppercase tracking-wide truncate">
                    {sch.organization}
                  </span>
                  <span
                    className={`font-bold text-[10.5px] whitespace-nowrap ${
                      deadline.isUrgent ? "text-deadline-urgent" : "text-muted"
                    }`}
                  >
                    {deadline.label}
                  </span>
                </div>
                <Link
                  to={`/scholarships/${sch.id}`}
                  className="block font-display font-bold text-ink mt-1"
                >
                  {sch.title}
                </Link>
                <p className="text-xs font-semibold text-amount mt-1">
                  {formatPeso(sch.amount, "Amount not stated")}
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
