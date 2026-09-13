import { useMemo } from 'react'
import { ChevronLeft, ChevronRight, LifeBuoy, Search } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { EmptyState } from '@/components/ui'
import { useRecentlyViewedHelp } from '@/hooks/useRecentlyViewedHelp'
import {
  getArticlesByCategory,
  getCategoriesForRole,
  getCategoryLabel,
  searchHelpArticles,
  type HelpArticle,
  type HelpCategoryDef,
} from '@/data/helpArticles'

export default function HelpCentreScreen() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const query = searchParams.get('q') ?? ''
  const categoryId = searchParams.get('category')

  const categories = useMemo(() => getCategoriesForRole('worker'), [])
  const results = useMemo(() => searchHelpArticles('worker', query), [query])
  const categoryArticles = useMemo(
    () => (categoryId ? getArticlesByCategory('worker', categoryId) : []),
    [categoryId]
  )
  const { recent } = useRecentlyViewedHelp('worker')

  const isSearching = query.trim().length > 0
  const activeCategory = categoryId ? categories.find(c => c.id === categoryId) : undefined

  const setQuery = (q: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (q) next.set('q', q); else next.delete('q')
      next.delete('category')
      return next
    })
  }

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
        <h1 className="text-lg font-bold text-slate-900">Help Centre</h1>
        <p className="text-xs text-slate-400 mt-1">Guides and answers to help you get the most out of work.wrk</p>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search help articles…"
          aria-label="Search help articles"
          className="w-full h-10 pl-9 pr-4 border border-[#E2E8F0] rounded-xl text-sm text-slate-700 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
        />
      </div>

      {isSearching ? (
        <SearchResults query={query} results={results} />
      ) : activeCategory ? (
        <CategoryView category={activeCategory} articles={categoryArticles} />
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {categories.map(cat => (
              <CategoryRow key={cat.id} category={cat} />
            ))}
          </div>

          {recent.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2 mt-2">Recently viewed</p>
              <ArticleList articles={recent} />
            </div>
          )}

          <div className="bg-[#0F172A] rounded-2xl p-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <LifeBuoy size={16} className="text-blue-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-0.5">Still need help?</p>
              <p className="text-xs text-white/50">Reach out to your manager or admin directly.</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function CategoryRow({ category }: { category: HelpCategoryDef }) {
  const count = getArticlesByCategory('worker', category.id).length
  return (
    <Link
      to={`/worker/help?category=${category.id}`}
      className="w-full flex items-center gap-3.5 px-4 py-3.5 bg-white rounded-2xl border border-[#E2E8F0] hover:bg-slate-50 transition-colors"
    >
      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
        <category.icon size={15} className="text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800">{category.label}</p>
        <p className="text-xs text-slate-400 mt-0.5 truncate">{category.description}</p>
      </div>
      <span className="text-[11px] text-slate-400 shrink-0">{count}</span>
      <ChevronRight size={14} className="text-slate-300 shrink-0" />
    </Link>
  )
}

function CategoryView({ category, articles }: { category: HelpCategoryDef; articles: HelpArticle[] }) {
  return (
    <div className="flex flex-col gap-3">
      <Link to="/worker/help" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        <ChevronLeft size={14} /> Help Centre
      </Link>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <category.icon size={14} className="text-blue-600" />
        </div>
        <h2 className="text-sm font-bold text-slate-900">{category.label}</h2>
      </div>
      <ArticleList articles={articles} />
    </div>
  )
}

function SearchResults({ query, results }: { query: string; results: HelpArticle[] }) {
  if (results.length === 0) {
    return (
      <EmptyState
        icon={<Search size={18} />}
        title={`No results for "${query}"`}
        description="Try a different search term, or browse categories."
      />
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-slate-400">{results.length} result{results.length === 1 ? '' : 's'}</p>
      <ArticleList articles={results} showCategory />
    </div>
  )
}

function ArticleList({ articles, showCategory }: { articles: HelpArticle[]; showCategory?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      {articles.map(article => (
        <Link
          key={article.slug}
          to={`/worker/help/${article.slug}`}
          className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border border-[#E2E8F0] bg-white hover:bg-slate-50 transition-colors"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{article.title}</p>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {showCategory ? `${getCategoryLabel('worker', article.category)} · ` : ''}{article.description}
            </p>
          </div>
          <ChevronRight size={14} className="text-slate-300 shrink-0" />
        </Link>
      ))}
    </div>
  )
}
