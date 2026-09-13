import { useEffect } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { useRecentlyViewedHelp } from '@/hooks/useRecentlyViewedHelp'
import {
  getArticleBySlug,
  getCategoryLabel,
  getRelatedArticles,
  type HelpSection,
} from '@/data/helpArticles'

export default function HelpArticleScreen() {
  const { articleSlug } = useParams<{ articleSlug: string }>()
  const navigate = useNavigate()
  const article = articleSlug ? getArticleBySlug('worker', articleSlug) : undefined
  const { markViewed } = useRecentlyViewedHelp('worker')

  useEffect(() => {
    if (article) markViewed(article.slug)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article?.slug])

  if (!article) {
    return <Navigate to="/worker/help" replace />
  }

  const related = getRelatedArticles(article, 'worker')
  const categoryLabel = getCategoryLabel('worker', article.category)

  return (
    <div className="flex flex-col gap-4 pb-4 animate-fade-in">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors -mb-1"
      >
        <ChevronLeft size={16} />
        Back
      </button>

      <div>
        <p className="text-[11px] text-slate-400 mb-1">{categoryLabel}</p>
        <h1 className="text-lg font-bold text-slate-900">{article.title}</h1>
        <p className="text-xs text-slate-400 mt-1">{article.description}</p>

        {article.link && (
          <Link
            to={article.link.to}
            className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-blue-600"
          >
            {article.link.label} <ExternalLink size={11} />
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {article.content.map((section, i) => (
          <ArticleSectionView key={i} section={section} />
        ))}
      </div>

      {related.length > 0 && (
        <div className="pt-4 border-t border-[#E2E8F0]">
          <p className="text-xs font-semibold text-slate-700 mb-2">Related articles</p>
          <div className="flex flex-col gap-2">
            {related.map(a => (
              <Link
                key={a.slug}
                to={`/worker/help/${a.slug}`}
                className="flex items-center justify-between gap-2 px-4 py-3 rounded-2xl border border-[#E2E8F0] bg-white"
              >
                <span className="text-sm font-medium text-slate-700">{a.title}</span>
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
      {section.heading && <h2 className="text-sm font-semibold text-slate-900 mb-1.5">{section.heading}</h2>}
      {section.body && <p className="text-sm text-slate-600 leading-relaxed">{section.body}</p>}
      {section.steps && (
        <ol className="mt-2 flex flex-col gap-2">
          {section.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed">
              <span className="shrink-0 w-5 h-5 rounded-full bg-[#1E3A5F]/10 text-[#1E3A5F] text-[11px] font-semibold flex items-center justify-center mt-0.5">
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
        <div className="mt-3 px-3.5 py-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed">
          {section.note}
        </div>
      )}
    </div>
  )
}
