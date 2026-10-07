// Class strings that several pages share, so a form field or button looks the same everywhere.
// (Tailwind only generates CSS for class names it can find written out in full, so these
// are whole literal strings — never built up from pieces.)

export const inputClass =
  "w-full px-4 py-3 rounded-lg border border-border bg-background text-sm " +
  "text-ink placeholder:text-muted focus:outline-none focus:border-primary " +
  "focus:ring-2 focus:ring-primary/20 aria-invalid:border-deadline-urgent";

export const labelClass = "block text-xs font-bold text-ink mb-1.5";

export const primaryButton =
  "inline-flex items-center justify-center bg-primary text-white font-semibold text-sm " +
  "px-4 py-2.5 rounded-lg hover:brightness-90 cursor-pointer " +
  "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:brightness-100";

export const secondaryButton =
  "inline-flex items-center justify-center bg-chip text-primary font-semibold text-sm " +
  "px-4 py-2.5 rounded-lg hover:brightness-95 cursor-pointer " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

export const chipBase =
  "font-semibold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer select-none whitespace-nowrap";
export const chipOff = "bg-chip text-primary hover:brightness-95";
export const chipOn = "bg-primary text-white";

export const errorText = "text-sm font-semibold text-deadline-urgent";
