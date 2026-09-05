export function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white border border-[#E2E8F0] rounded-xl p-5 ${className}`}>
            {children}
        </div>
    )
}
export function SectionLabel({ children }: { children: React.ReactNode }) {
    return <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">{children}</p>
}
export function DataRow({ label, value }: { label: string; value?: string | null }) {
    if (!value) return null
    return (
        <div className="flex items-start justify-between gap-4 py-1.5 min-w-0">
            <span className="text-xs text-slate-500 shrink-0">{label}</span>
            <span className="text-xs font-semibold text-slate-800 text-right min-w-0 truncate">{value}</span>
        </div>
    )
}