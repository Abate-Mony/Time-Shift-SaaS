import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { isAxiosError } from "axios"
import { Users, Plus, RefreshCw, Ban, CheckCircle2, X } from "lucide-react"
import { SectionCard } from "@/components/SectionUi"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import customFetch from "@/utils/customFetch"
import { queryClient } from "@/lib/queryClient"
import { useClientDetail } from "./ClientDetailContext"
import type { ClientRole, PortalUser, PortalInvitation } from "@/utils/types/clientPortal"
import { CLIENT_ROLE_LABELS } from "@/utils/types/clientPortal"

const mutationErrorMessage = (err: unknown, fallback: string) =>
    isAxiosError(err) ? err.response?.data?.msg ?? fallback : fallback

const portalUsersQuery = (clientId: string) => ({
    queryKey: ["client-portal-users", clientId],
    queryFn: async (): Promise<{ users: PortalUser[]; invitations: PortalInvitation[] }> => {
        const { data } = await customFetch.get(`/clients/${clientId}/portal-users`)
        return data
    },
})

const INVITATION_STATUS_STYLES: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    accepted: "bg-emerald-50 text-emerald-700",
    expired: "bg-slate-100 text-slate-500",
    revoked: "bg-red-50 text-red-600",
}

function StatusBadge({ label, className }: { label: string; className: string }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${className}`}>
            {label}
        </span>
    )
}

export function ClientDetailsPortalAccessPage() {
    const { client } = useClientDetail()
    const [showInvite, setShowInvite] = useState(false)

    const { data, isLoading } = useQuery(portalUsersQuery(client._id))
    const users = data?.users ?? []
    const invitations = data?.invitations ?? []

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["client-portal-users", client._id] })

    const toggleActiveMutation = useMutation({
        mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
            customFetch.patch(`/clients/${client._id}/portal-users/${userId}`, { isActive }),
        onSuccess: () => { toast.success("Portal user updated."); invalidate() },
        onError: (err: unknown) => toast.error(mutationErrorMessage(err, "Failed to update portal user.")),
    })

    const resendMutation = useMutation({
        mutationFn: (inviteId: string) => customFetch.post(`/clients/${client._id}/portal-invitations/${inviteId}/resend`),
        onSuccess: () => { toast.success("Invitation resent."); invalidate() },
        onError: (err: unknown) => toast.error(mutationErrorMessage(err, "Failed to resend invitation.")),
    })

    const revokeMutation = useMutation({
        mutationFn: (inviteId: string) => customFetch.patch(`/clients/${client._id}/portal-invitations/${inviteId}/revoke`),
        onSuccess: () => { toast.success("Invitation revoked."); invalidate() },
        onError: (err: unknown) => toast.error(mutationErrorMessage(err, "Failed to revoke invitation.")),
    })

    const hasNothing = !isLoading && users.length === 0 && invitations.length === 0

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">People who can log into the client portal for {client.name}.</p>
                <button onClick={() => setShowInvite(true)}
                    className="h-8 px-3.5 bg-[var(--primary)] text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-1.5">
                    <Plus size={12} /> Invite Portal User
                </button>
            </div>

            {hasNothing ? (
                <div className="bg-card border border-[var(--border)] rounded-xl flex flex-col items-center justify-center py-14 text-center">
                    <Users size={22} className="text-slate-300 mb-3" />
                    <p className="text-sm font-semibold text-muted-foreground">No portal access yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Invite someone from {client.name} to manage their own bookings, quotes, and invoices.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {users.map(u => (
                        <SectionCard key={u._id}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                        <span className="text-sm font-bold text-foreground">{u.fullname}</span>
                                        <StatusBadge label={CLIENT_ROLE_LABELS[u.clientRole]} className="bg-[var(--primary)]/8 text-[var(--primary)]" />
                                        {!u.isActive && <StatusBadge label="Disabled" className="bg-slate-100 text-slate-500" />}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{u.email}</p>
                                </div>
                                <button
                                    onClick={() => toggleActiveMutation.mutate({ userId: u._id, isActive: !u.isActive })}
                                    disabled={toggleActiveMutation.isPending}
                                    className={`h-7 px-3 text-[11px] font-bold rounded-lg flex items-center gap-1 shrink-0 transition-colors disabled:opacity-50 ${u.isActive
                                        ? "text-red-600 bg-red-50 hover:bg-red-100"
                                        : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                        }`}
                                >
                                    {u.isActive ? <><Ban size={10} /> Disable</> : <><CheckCircle2 size={10} /> Enable</>}
                                </button>
                            </div>
                        </SectionCard>
                    ))}

                    {invitations.map(inv => (
                        <SectionCard key={inv._id}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                        <span className="text-sm font-bold text-foreground">{inv.fullname || inv.email}</span>
                                        <StatusBadge label={CLIENT_ROLE_LABELS[inv.clientRole]} className="bg-[var(--primary)]/8 text-[var(--primary)]" />
                                        <StatusBadge label={inv.status} className={INVITATION_STATUS_STYLES[inv.status] ?? "bg-muted text-muted-foreground"} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">{inv.email}</p>
                                </div>
                                {(inv.status === "pending" || inv.status === "expired") && (
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            onClick={() => resendMutation.mutate(inv._id)}
                                            disabled={resendMutation.isPending}
                                            className="h-7 px-3 text-[11px] font-bold text-[var(--primary)] bg-[var(--primary)]/8 rounded-lg hover:bg-[var(--primary)]/15 transition-colors flex items-center gap-1 disabled:opacity-50">
                                            <RefreshCw size={10} /> Resend
                                        </button>
                                        <button
                                            onClick={() => revokeMutation.mutate(inv._id)}
                                            disabled={revokeMutation.isPending}
                                            className="h-7 px-3 text-[11px] font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1 disabled:opacity-50">
                                            <X size={10} /> Revoke
                                        </button>
                                    </div>
                                )}
                            </div>
                        </SectionCard>
                    ))}
                </div>
            )}

            {showInvite && (
                <InvitePortalUserModal
                    clientId={client._id}
                    onClose={() => setShowInvite(false)}
                    onInvited={() => { setShowInvite(false); invalidate() }}
                />
            )}
        </div>
    )
}

function InvitePortalUserModal({ clientId, onClose, onInvited }: { clientId: string; onClose: () => void; onInvited: () => void }) {
    const [email, setEmail] = useState("")
    const [fullname, setFullname] = useState("")
    const [clientRole, setClientRole] = useState<ClientRole>("viewer")

    const inviteMutation = useMutation({
        mutationFn: () => customFetch.post(`/clients/${clientId}/portal-users/invite`, { email, fullname: fullname || undefined, clientRole }),
        onSuccess: () => { toast.success("Invitation sent."); onInvited() },
        onError: (err: unknown) => toast.error(mutationErrorMessage(err, "Failed to send invitation.")),
    })

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-card rounded-2xl shadow-2xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
                    <h2 className="text-base font-bold text-foreground">Invite portal user</h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                        <span className="text-lg leading-none">×</span>
                    </button>
                </div>
                <div className="px-6 py-5 flex flex-col gap-4">
                    <div>
                        <Label className="block text-xs font-semibold text-foreground mb-1.5">Email <span className="text-red-400">*</span></Label>
                        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="sarah@client.co.uk"
                            className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-sm" />
                    </div>
                    <div>
                        <Label className="block text-xs font-semibold text-foreground mb-1.5">Name</Label>
                        <Input value={fullname} onChange={e => setFullname(e.target.value)} placeholder="Sarah Williams"
                            className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-sm" />
                    </div>
                    <div>
                        <Label className="block text-xs font-semibold text-foreground mb-1.5">Role</Label>
                        <Select value={clientRole} onValueChange={v => setClientRole(v as ClientRole)}>
                            <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {Object.entries(CLIENT_ROLE_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-2">
                    <button onClick={onClose} className="h-9 px-4 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-colors">Cancel</button>
                    <button
                        onClick={() => inviteMutation.mutate()}
                        disabled={!email || inviteMutation.isPending}
                        className="h-9 px-4 bg-[var(--primary)] text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">
                        {inviteMutation.isPending ? "Sending…" : "Send invite"}
                    </button>
                </div>
            </div>
        </div>
    )
}
