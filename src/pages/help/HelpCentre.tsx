import { useMemo } from 'react'
import { Link, useOutletContext, useSearchParams } from 'react-router'
import { ChevronLeft, ChevronRight, LifeBuoy, Search } from 'lucide-react'
import type { iUser } from '@/layouts/dashboardlayout'
import { EmptyState } from '@/components/ui'
import { useRecentlyViewedHelp } from '@/hooks/useRecentlyViewedHelp'
import {
  getArticlesByCategory,
  getCategoriesForRole,
  getCategoryLabel,
  searchHelpArticles,
  type HelpArticle,
  type HelpCategoryDef,
  type HelpRole,
} from '@/data/helpArticles'

export function HelpCentre() {
  const { user } = useOutletContext<{ user: iUser }>()
  const role = (user?.role ?? 'admin') as HelpRole
  const [searchParams, setSearchParams] = useSearchParams()

  const query = searchParams.get('q') ?? ''
  const categoryId = searchParams.get('category')

  const categories = useMemo(() => getCategoriesForRole(role), [role])
  const results = useMemo(() => searchHelpArticles(role, query), [role, query])
  const categoryArticles = useMemo(
    () => (categoryId ? getArticlesByCategory(role, categoryId) : []),
    [role, categoryId]
  )
  const { recent } = useRecentlyViewedHelp(role)

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
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Help Centre</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Guides and answers to help you get the most out of work.wrk</p>
      </div>

      <div className="relative mb-8">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search help articles…"
          aria-label="Search help articles"
          className="w-full h-11 pl-11 pr-5 border border-[var(--border)] rounded-xl text-sm text-foreground bg-card placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all shadow-sm"
        />
      </div>

      {isSearching ? (
        <SearchResults role={role} query={query} results={results} />
      ) : activeCategory ? (
        <CategoryView role={role} category={activeCategory} articles={categoryArticles} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {categories.map(cat => (
              <CategoryCard key={cat.id} role={role} category={cat} />
            ))}
          </div>

          {recent.length > 0 && (
            <Section title="Recently viewed">
              <ArticleList role={role} articles={recent} />
            </Section>
          )}

          <div className="mt-2 bg-[#0F172A] rounded-2xl p-6 flex items-center gap-4 flex-wrap">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <LifeBuoy size={18} className="text-blue-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-0.5">Still need help?</p>
              <p className="text-xs text-white/50">Reach out to your team, or check back soon — more guides are on the way.</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">{title}</p>
      {children}
    </div>
  )
}

function CategoryCard({ role, category }: { role: HelpRole; category: HelpCategoryDef }) {
  const count = getArticlesByCategory(role, category.id).length
  return (
    <Link
      to={`/help?category=${category.id}`}
      className="bg-card rounded-xl border border-[var(--border)] p-5 hover:border-slate-300 hover:shadow-sm transition-all group"
    >
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
        <category.icon size={18} className="text-blue-600" />
      </div>
      <h3 className="text-sm font-semibold text-foreground group-hover:text-foreground">{category.label}</h3>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{category.description}</p>
      <p className="text-[11px] text-muted-foreground mt-3">{count} article{count === 1 ? '' : 's'}</p>
    </Link>
  )
}

function CategoryView({ role, category, articles }: { role: HelpRole; category: HelpCategoryDef; articles: HelpArticle[] }) {
  return (
    <div>
      <Link to="/help" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ChevronLeft size={14} /> Help Centre
      </Link>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <category.icon size={16} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">{category.label}</h2>
          <p className="text-xs text-muted-foreground">{category.description}</p>
        </div>
      </div>
      <ArticleList role={role} articles={articles} />
    </div>
  )
}

function SearchResults({ role, query, results }: { role: HelpRole; query: string; results: HelpArticle[] }) {
  if (results.length === 0) {
    return (
      <EmptyState
        icon={<Search size={20} />}
        title={`No results for "${query}"`}
        description="Try a different search term, or browse categories below."
      />
    )
  }
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">{results.length} result{results.length === 1 ? '' : 's'}</p>
      <ArticleList role={role} articles={results} showCategory />
    </div>
  )
}

function ArticleList({ role, articles, showCategory }: { role: HelpRole; articles: HelpArticle[]; showCategory?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      {articles.map(article => (
        <Link
          key={article.slug}
          to={`/help/${article.slug}`}
          className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border border-[var(--border)] bg-card hover:border-slate-300 hover:shadow-sm transition-all group"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground group-hover:text-foreground truncate">{article.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {showCategory ? `${getCategoryLabel(role, article.category)} · ` : ''}{article.description}
            </p>
          </div>
          <ChevronRight size={14} className="text-slate-300 shrink-0" />
        </Link>
      ))}
    </div>
  )
}
