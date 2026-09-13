import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery, type QueryClient } from '@tanstack/react-query'
import { Building2, MapPin, Plus, Search, ShieldCheck } from 'lucide-react'
import { backLinkState } from '@/hooks/useBackLink'
import { sitesQuery } from '@/utils/sites'
import { clientsQuery } from '@/utils/clients'
import type { Client } from '@/utils/types/client'
import type { SiteStatus } from '@/utils/types/site'

export const loader = (queryClient: QueryClient) => async () => {
    await Promise.all([
        queryClient.ensureQueryData(sitesQuery()),
        queryClient.ensureQueryData(clientsQuery()),
    ])
    return null
}

type FilterType = 'all' | SiteStatus

function SiteStatusBadge({ status }: { status: SiteStatus }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${status === 'active'
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-slate-100 text-slate-500'
            }`}>
            {status === 'active' ? 'Active' : 'Inactive'}
        </span>
    )
}

function SitesEmptyState({ hasFilters, onAdd }: { hasFilters: boolean; onAdd: () => void }) {
    return (
        <div className="bg-white border border-dashed border-[#E2E8F0] rounded-xl flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-11 h-11 rounded-xl bg-[#1E3A5F]/6 flex items-center justify-center mb-3">
                <MapPin size={18} className="text-[#1E3A5F]" />
            </div>
            {hasFilters ? (
                <p className="text-sm text-slate-500">No sites match your filters.</p>
            ) : (
                <>
                    <p className="text-sm font-semibold text-slate-700">No sites yet</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        Create reusable workplaces for locations your team visits regularly. Sites can store
                        addresses, geofence settings and worker instructions.
                    </p>
                    <button
                        onClick={onAdd}
                        className="mt-4 h-9 px-4 bg-[#1E3A5F] text-white text-sm font-bold rounded-xl hover:bg-[#162D4A] transition-colors flex items-center gap-2"
                    >
                        <Plus size={13} /> Add site
                    </button>
                </>
            )}
        </div>
    )
}

export function Sites() {
    const navigate = useNavigate()
    const onNavigate = (path: string) => navigate(path, { state: backLinkState('Sites') })

    const { sites } = useQuery(sitesQuery()).data as { sites: import('@/utils/types/site').Site[] }
    const { clients } = useQuery(clientsQuery()).data as { clients: Client[] }

    const [filter, setFilter] = useState<FilterType>('all')
    const [clientFilter, setClientFilter] = useState<string>('all')
    const [search, setSearch] = useState('')

    const filtered = sites.filter(s => {
        const matchStatus = filter === 'all' || s.status === filter
        const siteClientId = typeof s.client === 'string' ? s.client : s.client?._id
        const matchClient = clientFilter === 'all' || siteClientId === clientFilter
        const q = search.trim().toLowerCase()
        const matchSearch = !q ||
            s.name.toLowerCase().includes(q) ||
            s.formattedAddress?.toLowerCase().includes(q)
        return matchStatus && matchClient && matchSearch
    })

    const counts = {
        all: sites.length,
        active: sites.filter(s => s.status === 'active').length,
        inactive: sites.filter(s => s.status === 'inactive').length,
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Sites</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Manage the places where your teams work.</p>
                </div>
                <button
                    onClick={() => onNavigate('/sites/create')}
                    className="h-9 px-4 bg-[#1E3A5F] text-white text-sm font-bold rounded-xl hover:bg-[#162D4A] transition-colors flex items-center gap-2"
                >
                    <Plus size={13} /> Add site
                </button>
            </div>

            {/* Filters + search */}
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                        {(['all', 'active', 'inactive'] as FilterType[]).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`h-8 px-4 rounded-lg text-sm font-semibold capitalize transition-all ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {f === 'all' ? `All (${counts.all})` : f === 'active' ? `Active (${counts.active})` : `Inactive (${counts.inactive})`}
                            </button>
                        ))}
                    </div>
                    <select
                        value={clientFilter}
                        onChange={e => setClientFilter(e.target.value)}
                        className="h-9 px-3 border border-[#E2E8F0] rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all cursor-pointer"
                    >
                        <option value="all">All clients</option>
                        {clients.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div className="relative min-w-[220px]">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search sites…"
                        className="w-full h-9 pl-8 pr-3 border border-[#E2E8F0] rounded-xl text-sm text-slate-700 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all"
                    />
                </div>
            </div>

            {/* Content */}
            {filtered.length === 0 ? (
                <SitesEmptyState hasFilters={!!search || filter !== 'all' || clientFilter !== 'all'} onAdd={() => onNavigate('/sites/create')} />
            ) : (
                <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#E2E8F0] bg-slate-50/60">
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Site</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 hidden sm:table-cell">Client</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 hidden md:table-cell">Address</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 hidden lg:table-cell">Geofence</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(site => {
                                const clientRef = typeof site.client === 'string' ? null : site.client
                                return (
                                    <tr
                                        key={site._id}
                                        onClick={() => onNavigate(`/sites/${site._id}`)}
                                        className="border-b border-[#F1F5F9] last:border-0 hover:bg-slate-50/70 transition-colors cursor-pointer"
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-8 h-8 rounded-lg bg-[#1E3A5F]/8 flex items-center justify-center shrink-0">
                                                    <MapPin size={13} className="text-[#1E3A5F]" />
                                                </div>
                                                <span className="text-sm font-semibold text-slate-800 truncate">{site.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 hidden sm:table-cell">
                                            <span className="flex items-center gap-1.5 text-sm text-slate-600">
                                                <Building2 size={12} className="text-slate-400 shrink-0" />
                                                {clientRef?.name ?? '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 hidden md:table-cell">
                                            <span className="text-sm text-slate-500 truncate max-w-[260px] block">
                                                {site.formattedAddress || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 hidden lg:table-cell">
                                            {site.geofenceRadiusMeters ? (
                                                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                                    <ShieldCheck size={12} className="text-slate-400" />
                                                    {site.geofenceRadiusMeters}m
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400">Company default</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <SiteStatusBadge status={site.status} />
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
