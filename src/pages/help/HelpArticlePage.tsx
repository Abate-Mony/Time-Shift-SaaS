import { useEffect } from 'react'
import { Link, Navigate, useOutletContext, useParams } from 'react-router'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import type { iUser } from '@/layouts/dashboardlayout'
import { backLinkState } from '@/hooks/useBackLink'
import { useRecentlyViewedHelp } from '@/hooks/useRecentlyViewedHelp'
import {
  getArticleBySlug,
  getCategoryLabel,
  getRelatedArticles,
  type HelpRole,
  type HelpSection,
} from '@/data/helpArticles'

export function HelpArticlePage() {
  const { articleSlug } = useParams<{ articleSlug: string }>()
  const { user } = useOutletContext<{ user: iUser }>()
  const role = (user?.role ?? 'admin') as HelpRole
  const article = articleSlug ? getArticleBySlug(role, articleSlug) : undefined
  const { markViewed } = useRecentlyViewedHelp(role)

  useEffect(() => {
    if (article) markViewed(article.slug)
    // Only the slug should re-trigger this — markViewed's identity changes
    // with every render of the hook's own state update otherwise.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article?.slug])

  // Covers both a genuinely unknown slug and one that exists but isn't
  // visible to this role — either way, there's nothing to render here.
  if (!article) {
    return <Navigate to="/help" replace />
  }

  const related = getRelatedArticles(article, role)
  const categoryLabel = getCategoryLabel(role, article.category)

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-5 flex-wrap">
        <Link to="/help" className="hover:text-slate-800 transition-colors flex items-center gap-1">
          <ChevronLeft size={14} /> Help Centre
        </Link>
        <span className="text-slate-300">/</span>
        <Link to={`/help?category=${article.category}`} className="hover:text-slate-800 transition-colors">
          {categoryLabel}
        </Link>
      </div>

      <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{article.title}</h1>
      <p className="text-sm text-slate-500 mt-1.5">{article.description}</p>

      {article.link && (
        <Link
          to={article.link.to}
          state={backLinkState('Help Centre', '/help')}
          className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          {article.link.label} <ExternalLink size={12} />
        </Link>
      )}

      <div className="mt-6 flex flex-col gap-5">
        {article.content.map((section, i) => (
          <ArticleSectionView key={i} section={section} />
        ))}
      </div>

      {related.length > 0 && (
        <div className="mt-10 pt-6 border-t border-[#E2E8F0]">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">Related articles</h2>
          <div className="flex flex-col gap-1.5">
            {related.map(a => (
              <Link
                key={a.slug}
                to={`/help/${a.slug}`}
                className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-[#E2E8F0] bg-white hover:border-slate-300 hover:shadow-sm transition-all group"
              >
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{a.title}</span>
                <ChevronRight size={14} className="text-slate-300 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ArticleSectionView({ section }: { section: HelpSection }) {
  return (
    <div>
      {section.heading && <h2 className="text-base font-semibold text-slate-900 mb-2">{section.heading}</h2>}
      {section.body && <p className="text-sm text-slate-600 leading-relaxed">{section.body}</p>}
      {section.steps && (
        <ol className="mt-2 flex flex-col gap-2.5">
          {section.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed">
              <span className="shrink-0 w-5 h-5 rounded-full bg-[#1E3A5F]/10 text-[#1E3A5F] text-xs font-semibold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      )}
      {section.bullets && (
        <ul className="mt-2 flex flex-col gap-1.5">
          {section.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600 leading-relaxed">
              <span className="mt-2 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
              {b}
            </li>
          ))}
        </ul>
      )}
      {section.note && (
        <div className="mt-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed">
          {section.note}
        </div>
      )}
    </div>
  )
}
