import { useState } from 'react'
import { useOutletContext } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Link2, Loader2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Card, Divider } from '@/components/ui'
import type { iUser } from '@/layouts/dashboardlayout'
import { isOwnerRole } from '@/utils/roles'
import { getPublicQuoteLink, rotatePublicQuoteLink } from '@/utils/api-request-functions'

function copyToClipboard(value: string) {
    navigator.clipboard.writeText(value).then(
        () => toast.success('Copied to clipboard'),
        () => toast.error('Could not copy — copy it manually.')
    )
}

export default function QuoteLinkSettings() {
    const { user } = useOutletContext<{ user: iUser }>()
    const isOwner = isOwnerRole(user?.role)
    const queryClient = useQueryClient()

    const [confirming, setConfirming] = useState(false)
    const [rotating, setRotating] = useState(false)

    const { data: link, isLoading } = useQuery({ queryKey: ['public-quote-link'], queryFn: getPublicQuoteLink })

    const handleRotate = async () => {
        setRotating(true)
        const result = await rotatePublicQuoteLink()
        setRotating(false)
        setConfirming(false)
        if (result) {
            queryClient.setQueryData(['public-quote-link'], result)
            toast.success(link?.slug ? 'Link regenerated — the old link no longer works.' : 'Quote link created')
        }
    }

    return (
        <div className="p-6 max-w-3xl mx-auto animate-fade-in flex flex-col gap-4">
            <div>
                <h1 className="text-xl font-semibold text-foreground tracking-tight">Quote Link</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    A public link where anyone can request a quote from you. Someone who fills it in shows up as a new lead —
                    no account or login needed on their end.
                </p>
            </div>

            <Card className="p-6">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-sm font-semibold text-foreground">Your link</h2>
                    {isOwner && !confirming && (
                        <Button variant="outline" size="sm" onClick={() => (link?.slug ? setConfirming(true) : handleRotate())} disabled={rotating}>
                            {rotating ? <Loader2 size={13} className="animate-spin" /> : link?.slug ? <RefreshCw size={13} /> : <Link2 size={13} />}
                            {link?.slug ? 'Regenerate' : 'Create link'}
                        </Button>
                    )}
                </div>
                {!isOwner && (
                    <p className="text-xs text-muted-foreground mb-2">Only the company owner can create or regenerate this link.</p>
                )}

                {confirming && (
                    <>
                        <Divider className="my-3" />
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                            <p className="flex-1 text-xs text-amber-800">
                                Regenerating breaks the current link — anywhere it's shared (your website, social bio, ads)
                                will stop working until updated.
                            </p>
                            <Button size="sm" variant="destructive" onClick={handleRotate} disabled={rotating}>
                                {rotating ? <Loader2 size={13} className="animate-spin" /> : 'Regenerate'}
                            </Button>
                            <button
                                type="button"
                                onClick={() => setConfirming(false)}
                                className="h-8 px-2.5 text-xs font-medium text-amber-800 hover:bg-amber-100 rounded-lg transition-colors shrink-0"
                            >
                                Cancel
                            </button>
                        </div>
                    </>
                )}

                <Divider className="my-3" />

                {isLoading ? (
                    <div className="flex justify-center py-8 text-muted-foreground">
                        <Loader2 size={18} className="animate-spin" />
                    </div>
                ) : !link?.url ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                        No quote link yet. {isOwner ? 'Create one above to start collecting leads from your website.' : 'Ask an owner to create one.'}
                    </p>
                ) : (
                    <div className="flex items-center gap-2 bg-muted border border-[var(--border)] rounded-xl px-3 py-2.5">
                        <Link2 size={14} className="text-muted-foreground shrink-0" />
                        <code className="flex-1 text-xs text-foreground font-mono break-all">{link.url}</code>
                        <button
                            type="button"
                            onClick={() => copyToClipboard(link.url!)}
                            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Copy size={14} />
                        </button>
                    </div>
                )}
            </Card>
        </div>
    )
}
