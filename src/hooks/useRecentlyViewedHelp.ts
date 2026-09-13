import { useCallback, useEffect, useState } from "react"
import { getArticleBySlug, type HelpArticle, type HelpRole } from "@/data/helpArticles"

const MAX_RECENT = 5

function storageKey(role: HelpRole) {
  return `help-recently-viewed:${role}`
}

function readSlugs(role: HelpRole): string[] {
  try {
    const raw = localStorage.getItem(storageKey(role))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : []
  } catch {
    return []
  }
}

function writeSlugs(role: HelpRole, slugs: string[]) {
  try {
    localStorage.setItem(storageKey(role), JSON.stringify(slugs))
  } catch {
    // Best-effort — private browsing / disabled storage just means no history.
  }
}

/**
 * Recently viewed Help Centre articles, kept in localStorage so this is real
 * per-viewer history rather than a fabricated "popular guides" list backed by
 * analytics that don't exist.
 */
export function useRecentlyViewedHelp(role: HelpRole) {
  const [slugs, setSlugs] = useState<string[]>(() => readSlugs(role))

  useEffect(() => {
    setSlugs(readSlugs(role))
  }, [role])

  const markViewed = useCallback((slug: string) => {
    setSlugs(prev => {
      const next = [slug, ...prev.filter(s => s !== slug)].slice(0, MAX_RECENT)
      writeSlugs(role, next)
      return next
    })
  }, [role])

  const recent = slugs
    .map(slug => getArticleBySlug(role, slug))
    .filter((a): a is HelpArticle => !!a)

  return { recent, markViewed }
}
