import { useEffect } from "react"

const KEY = "create-job:draft"

/**
 * Keeps unsaved wizard state in localStorage so a refresh or an accidental
 * tab close doesn't lose everything.
 *
 * This is a stopgap, not the persistence story — a real draft is a Job with
 * status: "draft", which survives on the server and across devices. This just
 * covers the gap between opening the form and saving one.
 */
export function useDraftAutosave(value: unknown, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const t = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(value))
      } catch {
        // Quota or private browsing — autosave is best-effort
      }
    }, 800)
    return () => clearTimeout(t)
  }, [value, enabled])
}

export function readAutosavedDraft<T>(): T | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function clearAutosavedDraft() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
