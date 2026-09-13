import { useQuery } from "@tanstack/react-query"
import { MapPin, Plus } from "lucide-react"
import { Link } from "react-router"
import { useClientDetail } from "./ClientDetailContext"
import { clientSitesQuery } from "@/utils/sites"
import { backLinkState } from "@/hooks/useBackLink"

export function ClientDetailsSitesPage() {
    const { client } = useClientDetail()
    const { data } = useQuery({ ...clientSitesQuery(client._id), enabled: !!client._id })
    const sites = data?.sites ?? []

    return (
        <div>
            <div className="flex items-center justify-end mb-4">
                <Link
                    to={`/sites/create?client=${client._id}`}
                    state={backLinkState(client.name)}
                    className="h-8 px-3.5 bg-[#1E3A5F] text-white text-xs font-bold rounded-xl hover:bg-[#162D4A] transition-colors flex items-center gap-1.5"
                >
                    <Plus size={12} /> Add site
                </Link>
            </div>

            {sites.length === 0 ? (
                <div className="bg-white border border-[#E2E8F0] rounded-xl flex flex-col items-center justify-center py-12 text-center">
                    <MapPin size={20} className="text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">No sites for this client yet</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                        Create a reusable site if your team visits this client's premises regularly.
                    </p>
                </div>
            ) : (
                <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                    {sites.map((site, i) => (
                        <Link
                            to={`/sites/${site._id}`}
                            state={backLinkState(client.name)}
                            key={site._id}
                            className={`w-full flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-slate-50/70 transition-colors text-left ${i > 0 ? 'border-t border-[#E2E8F0]' : ''}`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-[#1E3A5F]/8 flex items-center justify-center shrink-0">
                                    <MapPin size={13} className="text-[#1E3A5F]" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 truncate">{site.name}</p>
                                    {site.formattedAddress && (
                                        <p className="text-xs text-slate-500 truncate mt-0.5">{site.formattedAddress}</p>
                                    )}
                                </div>
                            </div>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${site.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                }`}>
                                {site.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
