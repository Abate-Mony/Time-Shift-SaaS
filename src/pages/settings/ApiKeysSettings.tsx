import { useState } from 'react'
import { useOutletContext } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Key, Loader2, Plus, ShieldAlert, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Input, Card, Divider } from '@/components/ui'
import { PlanUpgradeNotice } from '@/components/billing/PlanUpgradeNotice'
import { useCompanyPlan } from '@/hooks/useCompanyPlan'
import type { iUser } from '@/layouts/dashboardlayout'
import { isOwnerRole } from '@/utils/roles'
import { getApiKeys, createApiKey, revokeApiKey } from '@/utils/api-request-functions'
import type { ApiKeyInfo } from '@/utils/types/apiKey'

function copyToClipboard(value: string) {
    navigator.clipboard.writeText(value).then(
        () => toast.success('Copied to clipboard'),
        () => toast.error('Could not copy — copy it manually.')
    )
}

function formatDate(iso: string | null) {
    if (!iso) return 'Never'
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Shown exactly once, right after creation — the raw key is never
// retrievable again (the backend only ever stores a hash of it).
function RevealKeyDialog({ name, rawKey, onClose }: { name: string; rawKey: string; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                        <ShieldAlert size={16} className="text-amber-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground">"{name}" created</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Copy this key now — you won't be able to see it again after closing this dialog.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-muted border border-[var(--border)] rounded-xl px-3 py-2.5">
                    <code className="flex-1 text-xs text-foreground font-mono break-all">{rawKey}</code>
                    <button
                        type="button"
                        onClick={() => copyToClipboard(rawKey)}
                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Copy size={14} />
                    </button>
                </div>

                <Button onClick={onClose} className="w-full">I've copied it</Button>
            </div>
        </div>
    )
}

function CreateKeyForm({ onCreated, onClose }: { onCreated: (name: string, rawKey: string) => void; onClose: () => void }) {
    const [name, setName] = useState('')
    const [saving, setSaving] = useState(false)

    const handleCreate = async () => {
        if (!name.trim()) return
        setSaving(true)
        const result = await createApiKey(name.trim())
        setSaving(false)
        if (result) onCreated(result.apiKey.name, result.rawKey)
    }

    return (
        <div className="flex items-center gap-2">
            <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Booking website"
                className="h-9"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <Button size="sm" onClick={handleCreate} disabled={!name.trim() || saving}>
                {saving ? <Loader2 size={13} className="animate-spin" /> : 'Create'}
            </Button>
            <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors shrink-0"
            >
                <X size={14} />
            </button>
        </div>
    )
}

function ApiKeyRow({ apiKey, canManage }: { apiKey: ApiKeyInfo; canManage: boolean }) {
    const [confirming, setConfirming] = useState(false)

    const revokeMutation = useMutation({
        mutationFn: () => revokeApiKey(apiKey._id),
    })

    return (
        <div className="flex items-center gap-3 py-3.5">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Key size={13} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{apiKey.name}</p>
                    {!apiKey.isActive && (
                        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0">Revoked</span>
                    )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                    {apiKey.keyPrefix}••••••••••••• · Created {formatDate(apiKey.createdAt)} · Last used {formatDate(apiKey.lastUsedAt)}
                </p>
            </div>
            {canManage && apiKey.isActive && (
                confirming ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs text-muted-foreground">Revoke?</span>
                        <button
                            type="button"
                            onClick={() => revokeMutation.mutate()}
                            disabled={revokeMutation.isPending}
                            className="h-7 px-2.5 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                            {revokeMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : 'Yes, revoke'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirming(false)}
                            className="h-7 px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setConfirming(true)}
                        className="text-muted-foreground/60 hover:text-red-500 transition-colors shrink-0"
                    >
                        <Trash2 size={14} />
                    </button>
                )
            )}
        </div>
    )
}

export default function ApiKeysSettings() {
    const { user } = useOutletContext<{ user: iUser }>()
    const isOwner = isOwnerRole(user?.role)
    const { hasFeature } = useCompanyPlan()
    const canUseApi = hasFeature('externalApiAccess')
    const queryClient = useQueryClient()

    const [showCreateForm, setShowCreateForm] = useState(false)
    const [revealed, setRevealed] = useState<{ name: string; rawKey: string } | null>(null)

    const { data: apiKeys, isLoading } = useQuery({ queryKey: ['api-keys'], queryFn: getApiKeys, enabled: canUseApi })

    if (!canUseApi) return <PlanUpgradeNotice feature="External API access" />

    return (
        <div className="p-6 max-w-3xl mx-auto animate-fade-in flex flex-col gap-4">
            <div>
                <h1 className="text-xl font-semibold text-foreground tracking-tight">API Keys</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Let an external system (your own booking website, a Zapier flow, etc.) read your schedule and submit job
                    requests. Jobs created this way always come in as a draft for a manager to review — nothing goes live
                    unattended.
                </p>
            </div>

            <Card className="p-6">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-sm font-semibold text-foreground">Your keys</h2>
                    {isOwner && !showCreateForm && (
                        <Button variant="outline" size="sm" onClick={() => setShowCreateForm(true)}>
                            <Plus size={13} /> New key
                        </Button>
                    )}
                </div>
                {!isOwner && (
                    <p className="text-xs text-muted-foreground mb-2">Only the company owner can create or revoke API keys.</p>
                )}

                {showCreateForm && (
                    <>
                        <Divider className="my-3" />
                        <CreateKeyForm
                            onClose={() => setShowCreateForm(false)}
                            onCreated={(name, rawKey) => {
                                setShowCreateForm(false)
                                setRevealed({ name, rawKey })
                            }}
                        />
                    </>
                )}

                <Divider className="my-3" />

                {isLoading ? (
                    <div className="flex justify-center py-8 text-muted-foreground">
                        <Loader2 size={18} className="animate-spin" />
                    </div>
                ) : !apiKeys || apiKeys.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No API keys yet.</p>
                ) : (
                    <div className="divide-y divide-border">
                        {apiKeys.map(k => (
                            <ApiKeyRow key={k._id} apiKey={k} canManage={isOwner} />
                        ))}
                    </div>
                )}
            </Card>

            {revealed && (
                <RevealKeyDialog
                    name={revealed.name}
                    rawKey={revealed.rawKey}
                    onClose={() => {
                        setRevealed(null)
                        queryClient.invalidateQueries({ queryKey: ['api-keys'] })
                    }}
                />
            )}
        </div>
    )
}
