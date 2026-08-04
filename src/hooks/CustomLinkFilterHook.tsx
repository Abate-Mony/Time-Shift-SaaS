import { useRef } from "react";
import { useSearchParams } from "react-router";

type FilterValue = string | null | undefined;

export const useFilter = () => {
  const [_querySearch, setQuerySearch] = useSearchParams();

  // Holds params being built up within the current tick, so consecutive
  // calls compose instead of each starting from the committed URL.
  const pendingRef = useRef<URLSearchParams | null>(null);

  const applyEntries = (
    entries: Record<string, FilterValue>,
    replace = true
  ) => {
    setQuerySearch(
      (preParams) => {
        // Start from any in-flight params from earlier calls this tick,
        // otherwise from the real current params.
        const base = pendingRef.current ?? new URLSearchParams(preParams);

        Object.entries(entries).forEach(([key, value]) => {
          if (value == null || value === "") {
            base.delete(key);
          } else {
            base.set(key, value);
          }
        });

        pendingRef.current = base;

        // Clear the accumulator once this tick's work is done, so the next
        // interaction starts fresh from the committed URL.
        queueMicrotask(() => {
          pendingRef.current = null;
        });

        return base;
      },
      { replace }
    );
  };

  // Original single-key signature — unchanged for existing call sites
  const handleFilterChange = (
    { key, value = null }: { key: string; value?: FilterValue },
    replace = true
  ) => {
    applyEntries({ [key]: value }, replace);
  };

  // Preferred for multiple keys — one atomic update, no clobbering
  const handleFiltersChange = (
    entries: Record<string, FilterValue>,
    replace = true
  ) => {
    applyEntries(entries, replace);
  };

  return {
    handleFilterChange,
    handleFiltersChange,
    searchQuery: _querySearch,
  };
};