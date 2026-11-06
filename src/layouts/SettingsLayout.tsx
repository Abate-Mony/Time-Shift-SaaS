import { cn } from '@/lib/utils'
import type { iUser } from '@/layouts/dashboardlayout'
import { useEffect, useRef, useState } from 'react'
import { Outlet, useOutletContext } from 'react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import CustomNavLink from '@/components/ui/link'

const NAV_LINKS = [
    { to: '/settings', label: 'Overview', end: true },
    { to: '/settings/profile', label: 'Profile' },
    { to: '/settings/company', label: 'Company' },
    { to: '/settings/notifications', label: 'Notifications' },
    { to: '/settings/invoicing', label: 'Invoicing' },
    { to: '/settings/security', label: 'Security' },
    { to: '/settings/email', label: 'Email & Sending' },
    { to: '/settings/api-keys', label: 'API Keys' },
    { to: '/settings/quote-link', label: 'Quote Link' },
    { to: '/settings/quote-workflow', label: 'Quote Workflow' },
    { to: '/settings/billing', label: 'Billing' },
]

export default function SettingsLayout() {
    const { user } = useOutletContext<{ user: iUser }>()
    const scrollerRef = useRef<HTMLDivElement>(null)
    // Whether there's more to scroll to in each direction — drives both the
    // arrow buttons' visibility and the fade overlays, so a cut-off tab
    // (like "Billing" at 1920px) is never silently invisible with no hint
    // there's more. Re-measured on scroll and on resize, since overflow
    // itself depends on viewport width.
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)

    useEffect(() => {
        const el = scrollerRef.current
        if (!el) return

        const measure = () => {
            setCanScrollLeft(el.scrollLeft > 1)
            // -1 instead of exact equality — fractional scroll widths from
            // browser zoom/subpixel layout would otherwise never read as
            // "fully scrolled".
            setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
        }

        measure()
        el.addEventListener('scroll', measure, { passive: true })
        const observer = new ResizeObserver(measure)
        observer.observe(el)
        return () => {
            el.removeEventListener('scroll', measure)
            observer.disconnect()
        }
    }, [])

    const scrollByAmount = (direction: 'left' | 'right') => {
        scrollerRef.current?.scrollBy({ left: direction === 'left' ? -220 : 220, behavior: 'smooth' })
    }

    return (
        <div className="animate-fade-in">
            {/* Chrome only — page content brings its own p-6 max-w-3xl mx-auto
                wrapper (matching Settings.tsx's existing convention), so this
                stays a sibling rather than nesting and doubling padding. */}
            <div className="p-6 pb-0 max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-xl font-semibold text-foreground tracking-tight">Settings</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Manage your account preferences</p>
                </div>

                <div className="relative min-w-0">
                    {canScrollLeft && (
                        <>
                            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-background to-transparent z-10" />
                            <button
                                type="button"
                                aria-label="Scroll tabs left"
                                onClick={() => scrollByAmount('left')}
                                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full border border-[var(--border)] bg-card shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground"
                            >
                                <ChevronLeft size={14} />
                            </button>
                        </>
                    )}

                    <div ref={scrollerRef} className="flex items-center gap-1.5 overflow-x-auto scroll-smooth">
                        {NAV_LINKS.map(link => (
                            <CustomNavLink
                            layoutId='setting-layout-links'
                                animateClassName="inset-0 size-full bg-gray-500/25"

                                show
                                key={link.to}
                                to={link.to}
                                end={link.end}
                                className={({ isActive }) => cn(
                                    'shrink-0 px-4 flex-none w-fit py-2 text-sm font-medium rounded-lg transition-colors',
                                    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                                )}
                            >
                                {link.label}
                            </CustomNavLink>
                        ))}
                    </div>

                    {canScrollRight && (
                        <>
                            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-background to-transparent z-10" />
                            <button
                                type="button"
                                aria-label="Scroll tabs right"
                                onClick={() => scrollByAmount('right')}
                                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full border border-[var(--border)] bg-card shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <Outlet context={{ user }} />
        </div>
    )
}
