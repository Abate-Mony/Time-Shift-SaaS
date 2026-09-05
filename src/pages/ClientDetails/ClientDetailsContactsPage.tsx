import { SectionCard } from "@/components/SectionUi"
import { Mail, Phone, User } from "lucide-react"
import { useClientDetail } from "./ClientDetailContext"

export function ClientDetailsContactsPage() {
    const { client } = useClientDetail()
    if (client.contacts.length === 0) {
        return (
            <div className="bg-white border border-[#E2E8F0] rounded-xl flex flex-col items-center justify-center py-14 text-center">
                <User size={22} className="text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-500">No contacts yet</p>
                <p className="text-xs text-slate-400 mt-1">Add contacts when editing this client.</p>
            </div>
        )
    }
    return (
        <div className="flex flex-col gap-3">
            {client.contacts.map((c, i) => (
                <SectionCard key={i}>
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#1E3A5F]/8 flex items-center justify-center shrink-0">
                            <User size={15} className="text-[#1E3A5F]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <span className="text-sm font-bold text-slate-900">{c.name}</span>
                                {c.isPrimary && (
                                    <span className="text-[10px] font-semibold bg-[#1E3A5F]/8 text-[#1E3A5F] px-2 py-0.5 rounded-full">Primary</span>
                                )}
                            </div>
                            {c.role && <p className="text-xs text-slate-500 mb-2">{c.role}</p>}
                            <div className="flex flex-col gap-1">
                                {c.email && (
                                    <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-xs text-slate-600 hover:text-[#1E3A5F] transition-colors">
                                        <Mail size={11} className="shrink-0 text-slate-400" />
                                        {c.email}
                                    </a>
                                )}
                                {c.phone && (
                                    <span className="flex items-center gap-2 text-xs text-slate-600">
                                        <Phone size={11} className="shrink-0 text-slate-400" />
                                        {c.phone}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </SectionCard>
            ))}
        </div>
    )
}
