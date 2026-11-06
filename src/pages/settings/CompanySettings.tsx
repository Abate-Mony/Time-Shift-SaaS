import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import type { iUser } from '@/layouts/dashboardlayout'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Building2, Globe, Loader2, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useOutletContext } from 'react-router'
import { deleteCompanyLogo, getCompanyProfile, updateCompanyProfile, uploadCompanyLogo } from '@/utils/api-request-functions'
import { isAdminRole, isManagementRole } from '@/utils/roles'
import { MAX_AVATAR_FILE_SIZE } from '@/utils/constants/upload'
import { BUSINESS_TYPES } from '@/utils/constants/company'
import { compressAvatarImage } from '@/utils/imageCompression'
import { companyProfileSchema } from '@/utils/schemas'
import type { CompanyProfileForm } from '@/utils/types'

const FieldError = ({ message }: { message?: string }) => {
    if (!message) return null
    return <p className="text-xs text-red-500 mt-1">{message}</p>
}

export default function CompanySettings() {
    const { user } = useOutletContext<{ user: iUser }>()
    const isAdmin = isAdminRole(user?.role)
    // The logo stays admin/owner-only (companyRouter.ts's /logo route never
    // changed) — everything below it is admin AND manager, per /profile.
    const canEditProfile = isManagementRole(user?.role)
    const queryClient = useQueryClient()
    const logoInputRef = useRef<HTMLInputElement>(null)
    const [compressing, setCompressing] = useState(false)

    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ['company-profile'],
        queryFn: getCompanyProfile,
        enabled: canEditProfile,
    })

    const {
        control,
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting, isDirty },
    } = useForm<CompanyProfileForm>({
        resolver: zodResolver(companyProfileSchema),
        defaultValues: { name: '', businessType: undefined, website: '', registrationNumber: '' },
    })

    // profile arrives async — seed the form once it's in, same pattern as
    // ProfileSettings.tsx re-seeding from the outlet-context user. "size"
    // isn't part of this form at all (see companyProfileSchema's comment) —
    // it's read straight off `profile` below, display-only.
    useEffect(() => {
        if (!profile) return
        reset({
            name: profile.name ?? '',
            businessType: profile.businessType,
            website: profile.website ?? '',
            registrationNumber: profile.registrationNumber ?? '',
        })
    }, [profile, reset])

    const onSubmit = async (data: CompanyProfileForm) => {
        const ok = await updateCompanyProfile(data)
        if (ok) reset(data)
    }

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

    if (!canEditProfile) {
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
            {isAdmin && (
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
            )}

            <div className="bg-card rounded-xl border border-[var(--border)] p-6 flex flex-col gap-4 min-w-0">
                <h3 className="text-sm font-semibold text-foreground">Company Information</h3>

                {profileLoading ? (
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Skeleton className="h-9 w-full" />
                            <Skeleton className="h-9 w-full" />
                            <Skeleton className="h-9 w-full" />
                            <Skeleton className="h-9 w-full" />
                        </div>
                        <Skeleton className="h-9 w-full" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 min-w-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                            <div>
                                <Input label="Company Name" {...register('name')} />
                                <FieldError message={errors.name?.message} />
                            </div>
                            <div>
                                <Input label="Company Registration" {...register('registrationNumber')} />
                                <FieldError message={errors.registrationNumber?.message} />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Industry</label>
                                <Controller
                                    control={control}
                                    name="businessType"
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger className="w-full h-9 border-[var(--border)]">
                                                <SelectValue placeholder="Select your industry…" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {BUSINESS_TYPES.map(type => (
                                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                <FieldError message={errors.businessType?.message} />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Company Size</label>
                                {/* Read-only — tied to the subscription plan, not something
                                    anyone should be able to self-report (see companyController.ts's
                                    COMPANY_PROFILE_READ_ONLY_EXTRA_FIELDS). Change it from Billing. */}
                                <div className="h-9 w-full flex items-center px-3 rounded-md border border-[var(--border)] bg-muted text-sm text-muted-foreground">
                                    {profile?.size || '—'}
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-1">Based on your subscription — change it from Billing.</p>
                            </div>
                        </div>
                        <div>
                            <Input label="Website" icon={<Globe size={14} />} {...register('website')} />
                            <FieldError message={errors.website?.message} />
                        </div>
                        <div className="flex justify-end gap-3 mt-2">
                            <Button type="button" variant="outline" size="sm" disabled={!isDirty || isSubmitting} onClick={() => reset()}>
                                Cancel
                            </Button>
                            <Button type="submit" size="sm" disabled={!isDirty || isSubmitting}>
                                {isSubmitting && <Loader2 size={13} className="animate-spin" />}
                                {isSubmitting ? 'Saving…' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
