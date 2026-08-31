import { cn } from '@/lib/utils'
import type { iUser } from '@/layouts/dashboardlayout'
import { NavLink, Outlet, useOutletContext } from 'react-router'
import CustomNavLink from '@/components/ui/link'

const NAV_LINKS = [
    { to: '/settings', label: 'Overview', end: true },
    { to: '/settings/profile', label: 'Profile' },
    { to: '/settings/company', label: 'Company' },
    { to: '/settings/notifications', label: 'Notifications' },
    { to: '/settings/security', label: 'Security' },
    { to: '/settings/billing', label: 'Billing' },
]

export default function SettingsLayout() {
    const { user } = useOutletContext<{ user: iUser }>()

    return (
        <div className="animate-fade-in">
            {/* Chrome only — page content brings its own p-6 max-w-3xl mx-auto
                wrapper (matching Settings.tsx's existing convention), so this
                stays a sibling rather than nesting and doubling padding. */}
            <div className="p-6 pb-0 max-w-3xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Settings</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Manage your account preferences</p>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto">
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
                                isActive ? 'bg-[#1E3A5F] text-white' : 'text-slate-500 hover:bg-slate-100'
                            )}
                        >
                            {link.label}
                        </CustomNavLink>
                    ))}
                </div>
            </div>

            <Outlet context={{ user }} />
        </div>
    )
}
