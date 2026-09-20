import { useEffect, useRef, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import toast from 'react-hot-toast'
import { useOutletContext } from 'react-router'
import type { iUser } from '@/layouts/dashboardlayout'
import { Avatar, Divider, Input } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { deleteProfilePhoto, updateAdminProfile, uploadProfilePhoto } from '@/utils/api-request-functions'
import { getInitials } from '@/utils/getInitials'
import { MAX_AVATAR_FILE_SIZE } from '@/utils/constants/upload'
import { compressAvatarImage } from '@/utils/imageCompression'
import { adminProfileSchema } from '@/utils/schemas'
import type { AdminProfileForm } from '@/utils/types'

const FieldError = ({ message }: { message?: string }) => {
    if (!message) return null
    return <p className="text-xs text-red-500 mt-1">{message}</p>
}

export default function ProfileSettings() {
    const { user } = useOutletContext<{ user: iUser }>()
    const queryClient = useQueryClient()
    const photoInputRef = useRef<HTMLInputElement>(null)
    const [compressing, setCompressing] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting, isDirty },
    } = useForm<AdminProfileForm>({
        resolver: zodResolver(adminProfileSchema),
        defaultValues: { fullname: user?.fullname ?? '', phone: user?.phone ?? '' },
    })

    // user arrives async (outlet context) — the form's initial render can
    // beat it, so re-seed once the real values are in.
    useEffect(() => {
        reset({ fullname: user?.fullname ?? '', phone: user?.phone ?? '' })
    }, [user?.fullname, user?.phone, reset])

    const onSubmit = async (data: AdminProfileForm) => {
        const ok = await updateAdminProfile(data)
        if (ok) reset(data)
    }

    const uploadPhotoMutation = useMutation({
        mutationFn: uploadProfilePhoto,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] })
            toast.success('Profile photo updated')
        },
        onError: (error) => {
            const message = isAxiosError(error) ? error.response?.data?.msg ?? "Couldn't upload — try again." : "Couldn't upload — try again."
            toast.error(message)
        },
    })

    const deletePhotoMutation = useMutation({
        mutationFn: deleteProfilePhoto,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] })
            toast.success('Profile photo removed')
        },
        onError: () => toast.error("Couldn't remove the photo — try again."),
    })

    const handlePhotoSelected = async (file: File) => {
        setCompressing(true)
        let toUpload = file
        try {
            toUpload = await compressAvatarImage(file)
        } catch (err) {
            console.error('Failed to compress profile photo:', err)
            toast.error("Couldn't process that image — try a different file.")
            setCompressing(false)
            return
        }
        setCompressing(false)

        if (toUpload.size > MAX_AVATAR_FILE_SIZE) {
            toast.error('That photo is too large — max 500KB.')
            return
        }
        uploadPhotoMutation.mutate(toUpload)
    }

    return (
        <div className="p-6 max-w-3xl mx-auto animate-fade-in">
            <div className="bg-card rounded-xl border border-[var(--border)] p-6 flex flex-col gap-5 min-w-0">
                <div className="flex items-center gap-4 min-w-0">
                    <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) handlePhotoSelected(file)
                            e.target.value = ''
                        }}
                    />
                    <Avatar initials={getInitials(user?.fullname)} size="xl" index={0} src={user?.profilePhoto?.url} />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">Profile Photo</p>
                        <p className="text-xs text-muted-foreground mt-0.5 mb-2">JPG, PNG or WEBP. Max 500KB.</p>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => photoInputRef.current?.click()}
                                disabled={compressing || uploadPhotoMutation.isPending}
                            >
                                {(compressing || uploadPhotoMutation.isPending) && <Loader2 size={13} className="animate-spin" />}
                                {compressing ? 'Processing…' : uploadPhotoMutation.isPending ? 'Uploading…' : 'Upload Photo'}
                            </Button>
                            {user?.profilePhoto && (
                                <button
                                    type="button"
                                    onClick={() => deletePhotoMutation.mutate()}
                                    disabled={deletePhotoMutation.isPending}
                                    className="text-xs font-medium text-rose-500 hover:text-rose-700"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <Divider />
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 min-w-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                        <div>
                            <Input label="Full Name" {...register('fullname')} />
                            <FieldError message={errors.fullname?.message} />
                        </div>
                        <div>
                            <Input
                                label="Email Address"
                                type="email"
                                value={user?.email ?? ''}
                                disabled
                                title="Contact support to change your email address"
                            />
                        </div>
                        <div>
                            <Input label="Phone" type="tel" {...register('phone')} />
                            <FieldError message={errors.phone?.message} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" size="sm" disabled={!isDirty || isSubmitting} onClick={() => reset()}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={!isDirty || isSubmitting}>
                            {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                            {isSubmitting ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
