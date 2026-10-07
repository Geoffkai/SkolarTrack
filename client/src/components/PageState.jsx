import { useEffect, useState } from "react";
import { errorText, primaryButton } from "./styles";

// The backend's free hosting tier goes to sleep when nobody is using it, and the first
// request afterwards can take most of a minute. Saying so beats a silent spinner.
const SLOW_AFTER_MS = 6000;

export function Loading({ label = "Loading…" }) {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    // role="status" makes screen readers announce the text when it appears
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8" role="status">
      <p className="text-muted">{label}</p>
      {isSlow && (
        <p className="text-xs text-muted mt-2">
          The server is waking up after a quiet spell. This can take up to a
          minute.
        </p>
      )}
    </div>
  );
}

// `children` is for a way out other than Retry (e.g. a link back to the list).
export function ErrorState({ message, onRetry, children }) {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8" role="alert">
      <p className={errorText}>{message}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {onRetry && (
          <button onClick={onRetry} className={primaryButton}>
            Try again
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
