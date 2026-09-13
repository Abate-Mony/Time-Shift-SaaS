import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate, useParams, type LoaderFunctionArgs } from 'react-router'
import { useQuery, type QueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    ChevronLeft, Pencil, Archive, RefreshCw, MapPin, Building2, Phone, Mail,
    ShieldCheck, Navigation, Calendar, Briefcase,
} from 'lucide-react'
import customFetch from '@/utils/customFetch'
import { queryClient } from '@/lib/queryClient'
import { useBackLink } from '@/hooks/useBackLink'
import { siteDetailQuery, type SiteJobSummary } from '@/utils/sites'
import { clientsQuery } from '@/utils/clients'
import type { Client } from '@/utils/types/client'
import type { Site } from '@/utils/types/site'
import { buildMapUrl } from '@/utils/mapLinks'
import { SiteForm, buildSitePayload, siteFormValuesFromSite } from '@/components/site/SiteForm'

export const loader = (queryClient: QueryClient) => async ({ params }: LoaderFunctionArgs) => {
    await Promise.all([
        queryClient.ensureQueryData(siteDetailQuery(params.id as string)),
        queryClient.ensureQueryData(clientsQuery()),
    ])
    return null
}

function DialogBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            {children}
        </motion.div>
    )
}

function SiteStatusBadge({ status }: { status: Site['status'] }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${status === 'active'
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-slate-100 text-slate-500'
            }`}>
            {status === 'active' ? 'Active' : 'Inactive'}
        </span>
    )
}

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={`bg-white border border-[#E2E8F0] rounded-xl p-5 ${className}`}>{children}</div>
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{children}</p>
}

function JobRow({ job }: { job: SiteJobSummary }) {
    return (
        <Link
            to={`/jobs/${job._id}`}
            className="flex items-center justify-between gap-3 py-2.5 border-b border-[#F1F5F9] last:border-0 hover:bg-slate-50/70 transition-colors -mx-1 px-1 rounded-lg"
        >
            <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{job.title}</p>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <Calendar size={10} /> {new Date(job.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    · {job.startTime}–{job.endTime}
                </p>
            </div>
        </Link>
    )
}

function StatusDialog({ site, onConfirm, onClose }: { site: Site; onConfirm: () => void; onClose: () => void }) {
    const isActive = site.status === 'active'
    return (
        <DialogBackdrop onClose={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
                <div className="p-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${isActive ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                        {isActive ? <Archive size={18} className="text-amber-600" /> : <RefreshCw size={18} className="text-emerald-600" />}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2">
                        {isActive ? `Mark ${site.name} as inactive?` : 'Reactivate site'}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        {isActive
                            ? "Historical jobs at this site remain intact. It just won't show up when scheduling new site-backed jobs until reactivated."
                            : `${site.name} will be available again when scheduling new jobs.`}
                    </p>
                </div>
                <div className="border-t border-[#E2E8F0] px-6 py-4 flex items-center justify-end gap-2.5">
                    <button onClick={onClose} className="h-9 px-4 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
                    <button onClick={onConfirm} className={`h-9 px-5 text-sm font-bold rounded-xl transition-colors ${isActive ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                        {isActive ? 'Mark inactive' : 'Reactivate site'}
                    </button>
                </div>
            </div>
        </DialogBackdrop>
    )
}

export function SiteDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const back = useBackLink({ to: '/sites', label: 'Sites' })

    const { site, upcomingJobs, recentJobs } = useQuery(siteDetailQuery(id as string)).data as {
        site: Site
        upcomingJobs: SiteJobSummary[]
        recentJobs: SiteJobSummary[]
    }
    const { clients } = useQuery(clientsQuery()).data as { clients: Client[] }

    const [showEdit, setShowEdit] = useState(false)
    const [showStatus, setShowStatus] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['site', id] })
        queryClient.invalidateQueries({ queryKey: ['sites'] })
        const clientId = typeof site.client === 'string' ? site.client : site.client._id
        queryClient.invalidateQueries({ queryKey: ['client-sites', clientId] })
    }

    const handleSaveEdit = async (values: ReturnType<typeof siteFormValuesFromSite>) => {
        setSaving(true)
        setSaveError(null)
        try {
            const { client, ...payload } = buildSitePayload(values)
            await customFetch.patch(`/sites/${site._id}`, payload)
            invalidate()
            toast.success('Site updated.')
            setShowEdit(false)
        } catch (err: any) {
            setSaveError(err.response?.data?.msg ?? 'Failed to save site.')
        } finally {
            setSaving(false)
        }
    }

    const handleStatusChange = async () => {
        const nextStatus = site.status === 'active' ? 'inactive' : 'active'
        try {
            await customFetch.patch(`/sites/${site._id}/status`, { status: nextStatus })
            invalidate()
            toast.success(nextStatus === 'inactive' ? `${site.name} marked inactive.` : 'Site reactivated.')
            setShowStatus(false)
        } catch (err: any) {
            toast.error(err.response?.data?.msg ?? 'Failed to update status.')
        }
    }

    const clientRef = typeof site.client === 'string' ? null : site.client
    const directionsHref = site.coordinates?.lat != null
        ? buildMapUrl('google', { lat: site.coordinates.lat, lng: site.coordinates.lng, address: site.formattedAddress })
        : null

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <Link to={back.to} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-5">
                <ChevronLeft size={14} /> Back to {back.label}
            </Link>

            {/* Header */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 mb-5">
                <div className="flex items-start gap-4 flex-wrap">
                    <div className="w-12 h-12 rounded-xl bg-[#1E3A5F]/8 flex items-center justify-center shrink-0">
                        <MapPin size={20} className="text-[#1E3A5F]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap mb-1">
                            <h1 className="text-lg font-bold text-slate-900 truncate">{site.name}</h1>
                            <SiteStatusBadge status={site.status} />
                        </div>
                        <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500">
                            {clientRef && (
                                <Link to={`/clients/${clientRef._id}`} className="flex items-center gap-1 hover:text-[#1E3A5F] transition-colors">
                                    <Building2 size={10} className="text-slate-400" />{clientRef.name}
                                </Link>
                            )}
                            {site.formattedAddress && (
                                <span className="flex items-center gap-1"><MapPin size={10} className="text-slate-400" />{site.formattedAddress}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => setShowEdit(true)}
                            className="h-9 px-4 border border-[#E2E8F0] text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                        >
                            <Pencil size={13} /> Edit
                        </button>
                        <button
                            onClick={() => setShowStatus(true)}
                            className="h-9 px-4 border border-[#E2E8F0] text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                        >
                            {site.status === 'active' ? <><Archive size={13} /> Deactivate</> : <><RefreshCw size={13} /> Reactivate</>}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Geofence */}
                <SectionCard>
                    <SectionLabel>Geofence</SectionLabel>
                    {site.geofenceMode && site.geofenceMode !== 'off' ? (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                            <ShieldCheck size={14} className="text-slate-400" />
                            {site.geofenceRadiusMeters ?? 150}m radius · {site.geofenceMode === 'enforce' ? 'Enforced' : 'Warn only'}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 italic">Using your company's default geofence settings.</p>
                    )}
                    {directionsHref && (
                        <a
                            href={directionsHref}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E3A5F] hover:opacity-75 transition-opacity"
                        >
                            <Navigation size={11} /> Get directions
                        </a>
                    )}
                </SectionCard>

                {/* Contact */}
                <SectionCard>
                    <SectionLabel>Site contact</SectionLabel>
                    {site.contact?.name || site.contact?.phone || site.contact?.email ? (
                        <div className="flex flex-col gap-1.5">
                            {site.contact?.name && <p className="text-sm font-semibold text-slate-800">{site.contact.name}</p>}
                            {site.contact?.phone && (
                                <span className="flex items-center gap-2 text-xs text-slate-600"><Phone size={11} className="text-slate-400" />{site.contact.phone}</span>
                            )}
                            {site.contact?.email && (
                                <a href={`mailto:${site.contact.email}`} className="flex items-center gap-2 text-xs text-slate-600 hover:text-[#1E3A5F] transition-colors">
                                    <Mail size={11} className="text-slate-400" />{site.contact.email}
                                </a>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 italic">No site contact on file.</p>
                    )}
                </SectionCard>

                {/* Instructions */}
                {(site.instructions || site.accessInstructions || site.parkingInstructions) && (
                    <SectionCard className="md:col-span-2">
                        <SectionLabel>Worker instructions</SectionLabel>
                        <div className="flex flex-col gap-3">
                            {site.instructions && (
                                <div>
                                    <p className="text-xs font-semibold text-slate-600 mb-0.5">General</p>
                                    <p className="text-sm text-slate-700 leading-relaxed">{site.instructions}</p>
                                </div>
                            )}
                            {site.accessInstructions && (
                                <div>
                                    <p className="text-xs font-semibold text-slate-600 mb-0.5">Access</p>
                                    <p className="text-sm text-slate-700 leading-relaxed">{site.accessInstructions}</p>
                                </div>
                            )}
                            {site.parkingInstructions && (
                                <div>
                                    <p className="text-xs font-semibold text-slate-600 mb-0.5">Parking</p>
                                    <p className="text-sm text-slate-700 leading-relaxed">{site.parkingInstructions}</p>
                                </div>
                            )}
                        </div>
                    </SectionCard>
                )}

                {/* Upcoming jobs */}
                <SectionCard>
                    <div className="flex items-center justify-between mb-1">
                        <SectionLabel>Upcoming jobs</SectionLabel>
                        <Briefcase size={12} className="text-slate-300" />
                    </div>
                    {upcomingJobs.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">No upcoming jobs at this site.</p>
                    ) : (
                        <div>{upcomingJobs.map(j => <JobRow key={j._id} job={j} />)}</div>
                    )}
                </SectionCard>

                {/* Recent jobs */}
                <SectionCard>
                    <div className="flex items-center justify-between mb-1">
                        <SectionLabel>Recent jobs</SectionLabel>
                        <Briefcase size={12} className="text-slate-300" />
                    </div>
                    {recentJobs.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">No past jobs at this site yet.</p>
                    ) : (
                        <div>{recentJobs.map(j => <JobRow key={j._id} job={j} />)}</div>
                    )}
                </SectionCard>
            </div>

            <AnimatePresence>
                {showEdit && (
                    <DialogBackdrop onClose={() => { if (!saving) setShowEdit(false) }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: 8 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0] shrink-0">
                                <h2 className="text-base font-bold text-slate-900">Edit site</h2>
                                <button onClick={() => setShowEdit(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                                    <span className="text-lg leading-none">×</span>
                                </button>
                            </div>
                            <div className="overflow-y-auto flex-1 px-6 py-5">
                                <SiteForm
                                    clients={clients}
                                    initialValues={siteFormValuesFromSite(site)}
                                    clientLocked
                                    onSubmit={handleSaveEdit}
                                    submitting={saving}
                                    submitLabel="Save changes"
                                    onCancel={() => setShowEdit(false)}
                                    errorMessage={saveError}
                                />
                            </div>
                        </motion.div>
                    </DialogBackdrop>
                )}
                {showStatus && (
                    <StatusDialog site={site} onConfirm={handleStatusChange} onClose={() => setShowStatus(false)} />
                )}
            </AnimatePresence>
        </div>
    )
}
