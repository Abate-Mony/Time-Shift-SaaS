import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import {
    ArrowRight,
    Briefcase,
    Calendar,
    Check,
    Clock,
    FileText,
    Globe,
    MapPin,
    Receipt,
    Repeat,
    Sparkles,
    Users,
    X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getPublicPlanCatalog } from '@/utils/api-request-functions'

// The logged-out marketing/landing page — lives entirely outside the
// authenticated app (see routes.tsx: mounted as a bare route, not inside
// DashboardLayout). Pricing pulls from GET /plans, the same
// PLAN_LIMITS-derived catalog the in-app "Change Plan" page uses, so the
// numbers here can never quietly drift from what a plan actually enforces —
// see this app's own past history with a hand-maintained copy of these.

const FEATURES: { icon: typeof Calendar; title: string; description: string }[] = [
    {
        icon: Calendar,
        title: 'Scheduling & calendar',
        description: 'Build shifts, assign workers, and see everything on a real calendar — day, week, or month view.',
    },
    {
        icon: MapPin,
        title: 'GPS-verified clock-in',
        description: 'Workers clock in and out from their phone, with optional geofencing so you know they were actually on site.',
    },
    {
        icon: Users,
        title: 'Worker & team management',
        description: 'Track availability, documents, timesheets, and performance for every worker in one place.',
    },
    {
        icon: Receipt,
        title: 'Invoicing & quotes',
        description: 'Turn completed shifts into invoices automatically, send branded quotes, and get paid faster.',
    },
    {
        icon: Repeat,
        title: 'Recurring billing',
        description: 'Weekly, fortnightly, or monthly clients get a draft invoice generated for you, ready to review and send.',
    },
    {
        icon: Sparkles,
        title: 'AI data assistant',
        description: 'Ask plain-English questions about your jobs, invoices, and workers — get answers grounded in your real data.',
    },
    {
        icon: FileText,
        title: 'Reports & payroll',
        description: 'Payroll, timesheets, profitability, and aging reports — the numbers you need without a spreadsheet.',
    },
    {
        icon: Globe,
        title: 'Your own branding',
        description: 'Send emails and documents from your own domain, with invoice templates that look like you.',
    },
]

function Nav() {
    return (
        <header className="border-b border-border">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                <Link to="/welcome" className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[var(--primary)] flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-xs">I</span>
                    </div>
                    <span className="font-semibold text-foreground tracking-tight">INPRN</span>
                </Link>
                <div className="flex items-center gap-2">
                    <Link to="/auth">
                        <Button variant="ghost" size="sm">Log in</Button>
                    </Link>
                    <Link to="/auth/signup">
                        <Button size="sm">Get started free</Button>
                    </Link>
                </div>
            </div>
        </header>
    )
}

function Hero() {
    return (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-14 text-center">
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--primary)] bg-[var(--primary)]/8 border border-[var(--primary)]/15 rounded-full px-3 py-1 mb-5">
                <Sparkles size={11} /> Built for UK security, cleaning & care agencies
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold text-foreground tracking-tight leading-tight">
                Shift scheduling that runs your whole operation
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mt-5 max-w-2xl mx-auto">
                Schedule shifts, verify clock-ins with GPS, invoice clients automatically, and keep every worker's
                paperwork in order — all from one place.
            </p>
            <div className="flex items-center justify-center gap-3 mt-8">
                <Link to="/auth/signup">
                    <Button size="lg" className="gap-1.5">
                        Get started free <ArrowRight size={15} />
                    </Button>
                </Link>
                <Link to="/auth">
                    <Button variant="outline" size="lg">Log in</Button>
                </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-4">No card required to start on the free plan.</p>
        </section>
    )
}

function Features() {
    return (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-border">
            <div className="text-center mb-10">
                <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">Everything the job needs, nothing it doesn't</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
                    Built specifically for agencies that staff real shifts, not a generic project-management tool bent into shape.
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {FEATURES.map(f => (
                    <div key={f.title} className="bg-card border border-border rounded-xl p-5">
                        <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/8 flex items-center justify-center mb-3">
                            <f.icon size={16} className="text-[var(--primary)]" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{f.description}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}

function PriceCardSkeleton() {
    return (
        <div className="bg-card border border-border rounded-2xl p-6 animate-pulse">
            <div className="h-4 w-20 bg-muted rounded mb-4" />
            <div className="h-8 w-24 bg-muted rounded mb-6" />
            <div className="flex flex-col gap-2.5">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-3 w-full bg-muted rounded" />
                ))}
            </div>
        </div>
    )
}

function Pricing() {
    const { data: plans, isLoading, isError } = useQuery({ queryKey: ['public-plans'], queryFn: getPublicPlanCatalog })

    return (
        <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-border">
            <div className="text-center mb-10">
                <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">Simple, honest pricing</h2>
                <p className="text-sm text-muted-foreground mt-2">Start free. Upgrade only when you actually need to.</p>
            </div>

            {isError ? (
                <p className="text-sm text-muted-foreground text-center">Couldn't load pricing right now — try refreshing.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
                    {isLoading
                        ? Array.from({ length: 4 }).map((_, i) => <PriceCardSkeleton key={i} />)
                        : plans?.map(plan => (
                            <div
                                key={plan.id}
                                className={`rounded-2xl p-6 flex flex-col gap-5 ${plan.highlighted
                                    ? 'bg-[#0F172A] text-white border-2 border-[var(--primary)] shadow-lg shadow-[var(--primary)]/10 relative'
                                    : 'bg-card border border-border'
                                    }`}
                            >
                                {plan.highlighted && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wide bg-[var(--primary)] text-white px-3 py-1 rounded-full">
                                        Most popular
                                    </span>
                                )}
                                <div>
                                    <p className={`text-sm font-semibold ${plan.highlighted ? 'text-white' : 'text-foreground'}`}>{plan.name}</p>
                                    <p className={`text-xs mt-0.5 ${plan.highlighted ? 'text-white/50' : 'text-muted-foreground'}`}>{plan.tagline}</p>
                                </div>
                                <div>
                                    {plan.monthlyPrice === null ? (
                                        <p className={`text-2xl font-bold ${plan.highlighted ? 'text-white' : 'text-foreground'}`}>Custom</p>
                                    ) : (
                                        <p className={`text-2xl font-bold ${plan.highlighted ? 'text-white' : 'text-foreground'}`}>
                                            £{plan.monthlyPrice}
                                            <span className={`text-sm font-normal ${plan.highlighted ? 'text-white/50' : 'text-muted-foreground'}`}>/mo</span>
                                        </p>
                                    )}
                                </div>
                                <ul className="flex flex-col gap-2 flex-1">
                                    {plan.features.map(f => (
                                        <li key={f} className="flex items-start gap-2 text-xs">
                                            <Check size={13} className={`shrink-0 mt-0.5 ${plan.highlighted ? 'text-emerald-400' : 'text-emerald-600'}`} />
                                            <span className={plan.highlighted ? 'text-white/80' : 'text-muted-foreground'}>{f}</span>
                                        </li>
                                    ))}
                                    {plan.notIncluded?.slice(0, 2).map(f => (
                                        <li key={f} className="flex items-start gap-2 text-xs opacity-50">
                                            <X size={13} className="shrink-0 mt-0.5" />
                                            <span className={plan.highlighted ? 'text-white/60' : 'text-muted-foreground'}>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link to={plan.monthlyPrice === null ? '/auth/signup' : '/auth/signup'}>
                                    <Button
                                        className="w-full"
                                        variant={plan.highlighted ? 'default' : 'outline'}
                                    >
                                        {plan.ctaLabel}
                                    </Button>
                                </Link>
                            </div>
                        ))}
                </div>
            )}
        </section>
    )
}

function FinalCta() {
    return (
        <section className="border-t border-border">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
                <Briefcase size={28} className="text-[var(--primary)] mx-auto mb-4" />
                <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">Ready to run your shifts properly?</h2>
                <p className="text-sm text-muted-foreground mt-2">Set up your company in a few minutes — no card required.</p>
                <Link to="/auth/signup" className="inline-block mt-6">
                    <Button size="lg" className="gap-1.5">
                        Get started free <ArrowRight size={15} />
                    </Button>
                </Link>
            </div>
        </section>
    )
}

function Footer() {
    return (
        <footer className="border-t border-border">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[var(--primary)] flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-[10px]">I</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">INPRN</span>
                </div>
                <div className="flex items-center gap-5 text-xs text-muted-foreground">
                    <Link to="/auth" className="hover:text-foreground transition-colors">Log in</Link>
                    <Link to="/auth/signup" className="hover:text-foreground transition-colors">Sign up</Link>
                    <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={11} /> © {new Date().getFullYear()} INPRN
                </p>
            </div>
        </footer>
    )
}

export function MarketingHome() {
    return (
        <div className="min-h-screen bg-background">
            <Nav />
            <Hero />
            <Features />
            <Pricing />
            <FinalCta />
            <Footer />
        </div>
    )
}
