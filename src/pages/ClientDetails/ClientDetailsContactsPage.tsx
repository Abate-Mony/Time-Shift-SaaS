import { SectionCard } from "@/components/SectionUi"
import { Mail, Phone, User } from "lucide-react"
import { useClientDetail } from "./ClientDetailContext"

export function ClientDetailsContactsPage() {
    const { client } = useClientDetail()
    if (client.contacts.length === 0) {
        return (
            <div className="bg-card border border-[var(--border)] rounded-xl flex flex-col items-center justify-center py-14 text-center">
                <User size={22} className="text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-muted-foreground">No contacts yet</p>
                <p className="text-xs text-muted-foreground mt-1">Add contacts when editing this client.</p>
            </div>
        )
    }
    return (
        <div className="flex flex-col gap-3">
            {client.contacts.map((c, i) => (
                <SectionCard key={i}>
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/8 flex items-center justify-center shrink-0">
                            <User size={15} className="text-[var(--primary)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <span className="text-sm font-bold text-foreground">{c.name}</span>
                                {c.isPrimary && (
                                    <span className="text-[10px] font-semibold bg-[var(--primary)]/8 text-[var(--primary)] px-2 py-0.5 rounded-full">Primary</span>
                                )}
                            </div>
                            {c.role && <p className="text-xs text-muted-foreground mb-2">{c.role}</p>}
                            <div className="flex flex-col gap-1">
                                {c.email && (
                                    <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-[var(--primary)] transition-colors">
                                        <Mail size={11} className="shrink-0 text-muted-foreground" />
                                        {c.email}
                                    </a>
                                )}
                                {c.phone && (
                                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Phone size={11} className="shrink-0 text-muted-foreground" />
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
