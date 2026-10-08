import { useCallback, useEffect, useState } from "react";
import apiFetch from "../services/api";

// Loads `path` when the component mounts, and again whenever `path` changes or retry() is called.
// Pass null to skip the request (e.g. an endpoint this user's role isn't allowed to call).
//
// Returns { data, error, isLoading, retry, setData }.
export function useApi(path) {
  // Remember WHICH request each result belongs to. isLoading is then derived
  // ("is the result I'm holding the one I'm currently asking for?") instead of being
  // a separate flag that has to be flipped on and off by hand.
  const [result, setResult] = useState({ key: null, data: null, error: null });
  const [attempt, setAttempt] = useState(0);
  const key = path === null ? null : `${path}#${attempt}`;

  useEffect(() => {
    if (key === null) return;

    // If the user navigates away (or to another id) before the response lands,
    // `cancelled` stops a stale answer from overwriting the newer page's data.
    let cancelled = false;
    apiFetch(path)
      .then((data) => {
        if (!cancelled) setResult({ key, data, error: null });
      })
      .catch((error) => {
        console.error(`Failed to load ${path}:`, error);
        if (!cancelled) setResult({ key, data: null, error });
      });
    return () => {
      cancelled = true;
    };
  }, [path, key]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  // For pages that change what they loaded (close a listing, move a tracker card).
  // Takes an updater so two quick changes each build on the latest data, not a stale copy.
  const setData = useCallback((updater) => {
    setResult((current) => ({ ...current, data: updater(current.data) }));
  }, []);

  const isCurrent = result.key === key;
  return {
    data: isCurrent ? result.data : null,
    error: isCurrent ? result.error : null,
    isLoading: key !== null && !isCurrent,
    retry,
    setData,
  };
}
