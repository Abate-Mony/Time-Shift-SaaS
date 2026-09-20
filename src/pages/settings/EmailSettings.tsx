import { Button } from '@/components/ui/button'
import { Input } from '../../components/ui'
import { Skeleton } from '@/components/ui/skeleton'
import { useOutletContext } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { AlertTriangle, Check, Copy, Loader2, Lock, RefreshCw, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import type { iUser } from '@/layouts/dashboardlayout'
import { isOwnerRole } from '@/utils/roles'
import {
    connectEmailDomain,
    getEmailSettings,
    removeEmailDomain,
    sendTestEmail,
    updateEmailSettings,
    verifyEmailDomain,
} from '@/utils/api-request-functions'
import type { DnsRecord, DomainStatus } from '@/utils/types/emailSettings'

const errMsg = (err: unknown, fallback: string) =>
    isAxiosError(err) ? err.response?.data?.msg ?? err.response?.data?.message ?? fallback : fallback

const emailSettingsQueryKey = ['email-settings']

// ─── Status badge ───────────────────────────────────────────────────────────

const STATUS_STYLES: Record<DomainStatus, string> = {
    not_connected: 'bg-muted text-muted-foreground',
    pending: 'bg-blue-100 text-blue-700',
    verified: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-600',
}
const STATUS_LABELS: Record<DomainStatus, string> = {
    not_connected: 'Not connected',
    pending: 'Pending verification',
    verified: 'Verified',
    failed: 'Needs attention',
}

function DomainStatusBadge({ status }: { status: DomainStatus }) {
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}>
            {status === 'verified' && <Check size={11} />}
            {status === 'failed' && <AlertTriangle size={11} />}
            {STATUS_LABELS[status]}
        </span>
    )
}

// ─── DNS record card ────────────────────────────────────────────────────────

function copyToClipboard(value: string) {
    navigator.clipboard.writeText(value).then(
        () => toast.success('Copied to clipboard'),
        () => toast.error("Couldn't copy — copy it manually.")
    )
}

const RECORD_STATUS_STYLES: Record<string, string> = {
    verified: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-blue-100 text-blue-700',
    failed: 'bg-red-100 text-red-600',
}

function DnsRecordCard({ record }: { record: DnsRecord }) {
    return (
        <div className="border border-[var(--border)] rounded-xl p-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-wide">{record.type}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${RECORD_STATUS_STYLES[record.status] ?? 'bg-muted text-muted-foreground'}`}>
                    {record.status}
                </span>
            </div>
            <div className="grid sm:grid-cols-[1fr_2fr] gap-2">
                <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Name</p>
                    <div className="flex items-center gap-1.5">
                        <code className="text-xs text-foreground bg-muted rounded px-2 py-1 truncate">{record.name}</code>
                        <button type="button" onClick={() => copyToClipboard(record.name)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"><Copy size={12} /></button>
                    </div>
                </div>
                <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Value</p>
                    <div className="flex items-center gap-1.5">
                        <code className="text-xs text-foreground bg-muted rounded px-2 py-1 truncate">{record.value}</code>
                        <button type="button" onClick={() => copyToClipboard(record.value)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"><Copy size={12} /></button>
                    </div>
                </div>
            </div>
            {record.priority != null && <p className="text-xs text-muted-foreground">Priority: {record.priority}</p>}
        </div>
    )
}

// ─── Test email dialog ──────────────────────────────────────────────────────

function TestEmailDialog({ onClose }: { onClose: () => void }) {
    const [email, setEmail] = useState('')
    const mutation = useMutation({
        mutationFn: () => sendTestEmail(email.trim()),
        onSuccess: result => { if (result) onClose() },
    })

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className="bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm p-5">
                <h3 className="text-base font-bold text-foreground mb-1">Send test email</h3>
                <p className="text-sm text-muted-foreground mb-4">Send a sample email to confirm your sender identity.</p>
                <Input
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="owner@yourcompany.co.uk"
                />
                <div className="flex gap-2.5 mt-5">
                    <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
                    <Button
                        type="button"
                        className="flex-1"
                        disabled={!/\S+@\S+\.\S+/.test(email) || mutation.isPending}
                        onClick={() => mutation.mutate()}
                    >
                        {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Send test'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ─── Remove domain dialog ───────────────────────────────────────────────────

function RemoveDomainDialog({ domain, onClose, onRemoved }: { domain: string; onClose: () => void; onRemoved: () => void }) {
    const [removing, setRemoving] = useState(false)
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className="bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm p-5">
                <h3 className="text-base font-bold text-foreground mb-2">Remove {domain}?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    INPRN will stop sending emails from this domain and will fall back to its own sending address.
                    Your workers and clients will still receive emails.
                </p>
                <div className="flex gap-2.5 mt-5">
                    <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={removing}>Cancel</Button>
                    <Button
                        type="button"
                        variant="destructive"
                        className="flex-1"
                        disabled={removing}
                        onClick={async () => { setRemoving(true); const ok = await removeEmailDomain(); setRemoving(false); if (ok) onRemoved() }}
                    >
                        {removing ? <Loader2 size={14} className="animate-spin" /> : 'Remove domain'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ─── Connect-domain wizard ──────────────────────────────────────────────────

function ConnectDomainWizard({ onClose, onFinished }: { onClose: () => void; onFinished: () => void }) {
    const queryClient = useQueryClient()
    const [step, setStep] = useState(1)
    const [domain, setDomain] = useState('')
    const [domainError, setDomainError] = useState<string | null>(null)
    const [records, setRecords] = useState<DnsRecord[]>([])
    const [localPart, setLocalPart] = useState('notifications')
    const [senderName, setSenderName] = useState('')
    const [replyToEmail, setReplyToEmail] = useState('')
    const [showTestDialog, setShowTestDialog] = useState(false)

    const connectMutation = useMutation({
        mutationFn: () => connectEmailDomain(domain.trim()),
        onSuccess: res => {
            setRecords(res.dnsRecords)
            queryClient.setQueryData(emailSettingsQueryKey, res)
            setStep(2)
        },
        onError: err => setDomainError(errMsg(err, "Couldn't connect that domain — try again.")),
    })

    const verifyMutation = useMutation({
        mutationFn: verifyEmailDomain,
        onSuccess: res => {
            setRecords(res.dnsRecords)
            queryClient.setQueryData(emailSettingsQueryKey, res)
            if (res.settings.domainStatus === 'verified') toast.success('Domain verified')
        },
        onError: err => toast.error(errMsg(err, "Couldn't check DNS right now.")),
    })

    const saveSenderMutation = useMutation({
        mutationFn: () => updateEmailSettings({ senderName: senderName.trim(), replyToEmail: replyToEmail.trim(), senderLocalPart: localPart.trim() }),
        onSuccess: settings => {
            queryClient.setQueryData(emailSettingsQueryKey, (prev: any) => prev ? { ...prev, settings } : prev)
            toast.success('Sender details saved')
            onFinished()
        },
        onError: err => toast.error(errMsg(err, "Couldn't save sender details.")),
    })

    const domainVerified = connectMutation.data?.settings.domainStatus === 'verified' || verifyMutation.data?.settings.domainStatus === 'verified'
    const sendingDomain = connectMutation.data?.settings.sendingDomain ?? domain.trim()

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className="bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg my-auto">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                    <h3 className="text-base font-bold text-foreground">Connect sending domain</h3>
                    <span className="text-xs text-muted-foreground">Step {step} of 3</span>
                </div>

                <div className="p-5">
                    {step === 1 && (
                        <div className="flex flex-col gap-4">
                            <p className="text-sm text-muted-foreground">
                                Use a dedicated email subdomain, e.g. <code className="text-xs bg-muted px-1.5 py-0.5 rounded">mail.yourcompany.com</code>. You'll need access to your DNS provider to finish setup.
                            </p>
                            <Input
                                label="Domain"
                                value={domain}
                                onChange={e => { setDomain(e.target.value); setDomainError(null) }}
                                placeholder="mail.yourcompany.com"
                                error={domainError ?? undefined}
                            />
                            <div className="flex gap-2.5 justify-end mt-2">
                                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                                <Button type="button" disabled={!domain.trim() || connectMutation.isPending} onClick={() => connectMutation.mutate()}>
                                    {connectMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Continue'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="flex flex-col gap-4">
                            <p className="text-sm text-muted-foreground">
                                Add these records at your DNS provider (Cloudflare, GoDaddy, Namecheap, or your hosting provider) exactly as shown. DNS changes can take some time to propagate.
                            </p>
                            <div className="flex flex-col gap-3">
                                {records.map((r, i) => <DnsRecordCard key={i} record={r} />)}
                            </div>
                            {domainVerified && (
                                <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
                                    <Check size={14} /> All records verified
                                </div>
                            )}
                            <div className="flex gap-2.5 justify-between mt-2">
                                <Button type="button" variant="outline" onClick={() => verifyMutation.mutate()} disabled={verifyMutation.isPending}>
                                    {verifyMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={13} />} Check DNS
                                </Button>
                                <Button type="button" disabled={!domainVerified} onClick={() => setStep(3)}>
                                    Continue
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col gap-4">
                            <p className="text-sm text-muted-foreground">Choose how INPRN emails will appear to your workers and clients.</p>
                            <Input label="Sender name" value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="Your Company Ltd" />
                            <div>
                                <label className="text-sm font-medium text-foreground">Sender address</label>
                                <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden mt-1.5 focus-within:ring-2 focus-within:ring-[var(--primary)]/15">
                                    <input
                                        value={localPart}
                                        onChange={e => setLocalPart(e.target.value)}
                                        placeholder="notifications"
                                        className="flex-1 h-9 px-3 text-sm text-foreground bg-card outline-none"
                                    />
                                    <span className="px-3 h-9 flex items-center text-sm text-muted-foreground bg-muted border-l border-[var(--border)] shrink-0">@{sendingDomain}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Only the mailbox name is editable — the domain is fixed to what you verified.</p>
                            </div>
                            <Input label="Reply-to (optional)" type="email" value={replyToEmail} onChange={e => setReplyToEmail(e.target.value)} placeholder="office@yourcompany.co.uk" />

                            <div className="flex gap-2.5 justify-end mt-2">
                                <Button type="button" variant="outline" onClick={() => setShowTestDialog(true)} disabled={!localPart.trim()}>
                                    <Send size={13} /> Send test email
                                </Button>
                                <Button
                                    type="button"
                                    disabled={!senderName.trim() || !localPart.trim() || saveSenderMutation.isPending}
                                    onClick={() => saveSenderMutation.mutate()}
                                >
                                    {saveSenderMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Finish setup'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showTestDialog && <TestEmailDialog onClose={() => setShowTestDialog(false)} />}
        </div>
    )
}

// ─── Main page ───────────────────────────────────────────────────────────────

const USES_SENDER = [
    'New shift assignments',
    'Job assignments',
    'Quotes',
    'Invoices',
    'Team invitations',
]

export default function EmailSettings() {
    const { user } = useOutletContext<{ user: iUser }>()
    const isOwner = isOwnerRole(user?.role)
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({ queryKey: emailSettingsQueryKey, queryFn: getEmailSettings })
    const settings = data?.settings
    const dnsRecords = data?.dnsRecords ?? []

    const [senderName, setSenderName] = useState<string | null>(null)
    const [replyToEmail, setReplyToEmail] = useState<string | null>(null)
    const [showWizard, setShowWizard] = useState(false)
    const [showRemoveDialog, setShowRemoveDialog] = useState(false)
    const [showTestDialog, setShowTestDialog] = useState(false)

    const identityMutation = useMutation({
        mutationFn: () => updateEmailSettings({ senderName: senderName ?? settings?.senderName, replyToEmail: replyToEmail ?? settings?.replyToEmail }),
        onSuccess: newSettings => {
            queryClient.setQueryData(emailSettingsQueryKey, (prev: any) => prev ? { ...prev, settings: newSettings } : prev)
            toast.success('Sender identity updated')
        },
        onError: err => toast.error(errMsg(err, "Couldn't save changes.")),
    })

    const verifyMutation = useMutation({
        mutationFn: verifyEmailDomain,
        onSuccess: res => {
            queryClient.setQueryData(emailSettingsQueryKey, res)
            toast.success(res.settings.domainStatus === 'verified' ? 'Domain verified' : 'Still pending — check back after DNS propagates')
        },
        onError: err => toast.error(errMsg(err, "Couldn't check DNS right now.")),
    })

    if (isLoading || !settings) {
        return (
            <div className="p-6 max-w-3xl mx-auto animate-fade-in flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-96 max-w-full" />
                </div>
                <div className="bg-card rounded-xl border border-[var(--border)] p-6 flex flex-col gap-4">
                    <Skeleton className="h-4 w-32" />
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Skeleton className="h-9 w-full rounded-lg" />
                        <Skeleton className="h-9 w-full rounded-lg" />
                    </div>
                </div>
                <div className="bg-card rounded-xl border border-[var(--border)] p-6 flex flex-col gap-4">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-9 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-3xl mx-auto animate-fade-in flex flex-col gap-4">
            <div>
                <h1 className="text-xl font-semibold text-foreground tracking-tight">Email &amp; Sending</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Control how emails sent by INPRN appear to your workers and clients.</p>
            </div>

            {!isOwner && (
                <div className="bg-card rounded-xl border border-[var(--border)] p-4 flex items-center gap-3">
                    <Lock size={15} className="text-amber-600 shrink-0" />
                    <p className="text-sm text-muted-foreground">Only the company owner can change email domain settings. You can view the current setup below.</p>
                </div>
            )}

            {/* Sender identity */}
            <div className="bg-card rounded-xl border border-[var(--border)] p-6 flex flex-col gap-4">
                <h2 className="text-sm font-semibold text-foreground">Sender identity</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                        label="Sender name"
                        value={senderName ?? settings.senderName}
                        onChange={e => setSenderName(e.target.value)}
                        placeholder="Your Company Ltd"
                        disabled={!isOwner}
                    />
                    <Input
                        label="Reply-to email"
                        type="email"
                        value={replyToEmail ?? settings.replyToEmail}
                        onChange={e => setReplyToEmail(e.target.value)}
                        placeholder="office@yourcompany.co.uk"
                        disabled={!isOwner}
                    />
                </div>
                {isOwner && (
                    <div className="flex justify-end">
                        <Button
                            type="button"
                            size="sm"
                            disabled={identityMutation.isPending || (senderName === null && replyToEmail === null)}
                            onClick={() => identityMutation.mutate()}
                        >
                            {identityMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : 'Save changes'}
                        </Button>
                    </div>
                )}
            </div>

            {/* Sending domain */}
            <div className="bg-card rounded-xl border border-[var(--border)] p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-foreground">Sending domain</h2>
                    <DomainStatusBadge status={settings.domainStatus} />
                </div>

                {settings.domainStatus === 'not_connected' ? (
                    <>
                        <p className="text-sm text-muted-foreground">
                            Send emails from your own company domain instead of INPRN's — workers and clients will see it come from you.
                        </p>
                        <p className="text-sm text-foreground">
                            Current sender: <span className="font-semibold">INPRN &lt;notifications@inprn.com&gt;</span>
                        </p>
                        {isOwner && (
                            <div>
                                <Button type="button" onClick={() => setShowWizard(true)}>Connect sending domain</Button>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <p className="text-sm font-mono text-foreground">{settings.sendingDomain}</p>

                        {settings.domainStatus === 'verified' && (
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Current sender</p>
                                <p className="text-sm font-semibold text-foreground">{settings.senderName}</p>
                                <p className="text-sm text-muted-foreground">{settings.senderEmail}</p>
                                {settings.replyToEmail && <p className="text-xs text-muted-foreground mt-0.5">Reply-to: {settings.replyToEmail}</p>}
                            </div>
                        )}

                        {settings.domainStatus === 'pending' && (
                            <p className="text-sm text-muted-foreground">Some DNS records still need verification.</p>
                        )}

                        {settings.domainStatus === 'failed' && (
                            <p className="text-sm text-muted-foreground">We couldn't verify all required DNS records. Review them and check your DNS provider.</p>
                        )}

                        {(settings.domainStatus === 'pending' || settings.domainStatus === 'failed') && dnsRecords.length > 0 && (
                            <div className="flex flex-col gap-3">
                                {dnsRecords.map((r, i) => <DnsRecordCard key={i} record={r} />)}
                            </div>
                        )}

                        {isOwner && (
                            <div className="flex gap-2.5 flex-wrap">
                                {settings.domainStatus === 'verified' ? (
                                    <>
                                        <Button type="button" variant="outline" size="sm" onClick={() => setShowTestDialog(true)}>
                                            <Send size={13} /> Send test email
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" className="text-red-600 hover:text-red-600 hover:bg-red-50" onClick={() => setShowRemoveDialog(true)}>
                                            <Trash2 size={13} /> Manage domain
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button type="button" variant="outline" size="sm" disabled={verifyMutation.isPending} onClick={() => verifyMutation.mutate()}>
                                            {verifyMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Check DNS
                                        </Button>
                                        {settings.senderEmail === '' && (
                                            <Button type="button" variant="outline" size="sm" onClick={() => setShowWizard(true)}>
                                                Finish sender setup
                                            </Button>
                                        )}
                                        <Button type="button" variant="outline" size="sm" className="text-red-600 hover:text-red-600 hover:bg-red-50" onClick={() => setShowRemoveDialog(true)}>
                                            <Trash2 size={13} /> Remove domain
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Emails using this sender */}
            <div className="bg-card rounded-xl border border-[var(--border)] p-6">
                <h2 className="text-sm font-semibold text-foreground mb-3">Emails using this sender</h2>
                <div className="flex flex-col gap-1.5">
                    {USES_SENDER.map(item => (
                        <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check size={13} className="text-emerald-500 shrink-0" /> {item}
                        </div>
                    ))}
                </div>
            </div>

            {showWizard && (
                <ConnectDomainWizard
                    onClose={() => setShowWizard(false)}
                    onFinished={() => { setShowWizard(false); queryClient.invalidateQueries({ queryKey: emailSettingsQueryKey }) }}
                />
            )}
            {showRemoveDialog && (
                <RemoveDomainDialog
                    domain={settings.sendingDomain}
                    onClose={() => setShowRemoveDialog(false)}
                    onRemoved={() => setShowRemoveDialog(false)}
                />
            )}
            {showTestDialog && <TestEmailDialog onClose={() => setShowTestDialog(false)} />}
        </div>
    )
}
