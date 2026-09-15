import { useRef, useState } from 'react'
import { Input } from '@/components/ui'
import { Button } from '@/components/ui/button'
import type { iUser } from '@/layouts/dashboardlayout'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Building2, Globe, Loader2, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useOutletContext } from 'react-router'
import { deleteCompanyLogo, uploadCompanyLogo } from '@/utils/api-request-functions'
import { isAdminRole } from '@/utils/roles'
import { MAX_AVATAR_FILE_SIZE } from '@/utils/constants/upload'
import { compressAvatarImage } from '@/utils/imageCompression'

export default function CompanySettings() {
    const { user } = useOutletContext<{ user: iUser }>()
    const isAdmin = isAdminRole(user?.role)
    const queryClient = useQueryClient()
    const logoInputRef = useRef<HTMLInputElement>(null)
    const [compressing, setCompressing] = useState(false)

    const uploadLogoMutation = useMutation({
        mutationFn: uploadCompanyLogo,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] })
            toast.success('Company logo updated')
        },
        onError: (error) => {
            const message = isAxiosError(error) ? error.response?.data?.msg ?? "Couldn't upload — try again." : "Couldn't upload — try again."
            toast.error(message)
        },
    })

    const deleteLogoMutation = useMutation({
        mutationFn: deleteCompanyLogo,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] })
            toast.success('Company logo removed')
        },
        onError: () => toast.error("Couldn't remove the logo — try again."),
    })

    const handleLogoSelected = async (file: File) => {
        setCompressing(true)
        let toUpload = file
        try {
            toUpload = await compressAvatarImage(file)
        } catch (err) {
            console.error('Failed to compress company logo:', err)
            toast.error("Couldn't process that image — try a different file.")
            setCompressing(false)
            return
        }
        setCompressing(false)

        if (toUpload.size > MAX_AVATAR_FILE_SIZE) {
            toast.error('That logo is too large — max 500KB.')
            return
        }
        uploadLogoMutation.mutate(toUpload)
    }

    if (!isAdmin) {
        return (
            <div className="p-6 max-w-3xl mx-auto animate-fade-in">
                <div className="bg-card rounded-xl border border-[var(--border)] p-6 flex items-center gap-3 min-w-0">
                    <Lock size={16} className="text-amber-600 shrink-0" />
                    <p className="text-sm text-muted-foreground">You don't have access to this.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-3xl mx-auto animate-fade-in flex flex-col gap-4">
            <div className="bg-card rounded-xl border border-[var(--border)] p-6 flex flex-col gap-4 min-w-0">
                <h3 className="text-sm font-semibold text-foreground">Company Logo</h3>
                <div className="flex items-center gap-4 min-w-0">
                    <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) handleLogoSelected(file)
                            e.target.value = ''
                        }}
                    />
                    <div className="w-14 h-14 rounded-xl border border-[var(--border)] bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {user?.company?.logo?.url ? (
                            <img src={user.company.logo.url} alt={user.company.name} className="w-full h-full object-cover" />
                        ) : (
                            <Building2 size={20} className="text-slate-300" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs text-muted-foreground mb-2">JPG, PNG or WEBP. Max 500KB.</p>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => logoInputRef.current?.click()}
                                disabled={compressing || uploadLogoMutation.isPending}
                            >
                                {(compressing || uploadLogoMutation.isPending) && <Loader2 size={13} className="animate-spin" />}
                                {compressing ? 'Processing…' : uploadLogoMutation.isPending ? 'Uploading…' : 'Upload Logo'}
                            </Button>
                            {user?.company?.logo && (
                                <button
                                    type="button"
                                    onClick={() => deleteLogoMutation.mutate()}
                                    disabled={deleteLogoMutation.isPending}
                                    className="text-xs font-medium text-rose-500 hover:text-rose-700"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-xl border border-[var(--border)] p-6 flex flex-col gap-4 min-w-0">
                <h3 className="text-sm font-semibold text-foreground">Company Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                    <Input label="Company Name" defaultValue="SecureGuard Ltd" />
                    <Input label="Company Registration" defaultValue="12345678" />
                    <Input label="Industry" defaultValue="Security Services" />
                    <Input label="Company Size" defaultValue="6–20 employees" />
                </div>
                <Input label="Website" icon={<Globe size={14} />} defaultValue="https://secureguard.co.uk" />
                <div className="flex justify-end gap-3 mt-2">
                    <Button variant="outline" size="sm">Cancel</Button>
                    <Button size="sm">Save Changes</Button>
                </div>
            </div>
        </div>
    )
}
