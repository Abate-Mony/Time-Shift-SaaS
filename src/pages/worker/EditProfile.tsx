import { Avatar, Input } from "@/components/ui"
import { updateWorkerProfile } from "@/utils/api-request-functions"
import { editProfileSchema } from "@/utils/schemas"
import type { EditProfileForm, EditProfileFormInput, User } from "@/utils/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronLeft, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { useNavigate, useOutletContext } from "react-router"

const GENDER_OPTIONS: NonNullable<User["gender"]>[] = ["Male", "Female", "Other", "Prefer not to say"]

const FieldError = ({ message }: { message?: string }) => {
    if (!message) return null
    return <p className="text-xs text-red-500 mt-1">{message}</p>
}

export default function EditProfileScreen() {
    const navigate = useNavigate()
    const user = useOutletContext<{ user: User }>()?.user

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<EditProfileFormInput, unknown, EditProfileForm>({
        resolver: zodResolver(editProfileSchema),
        defaultValues: {
            fullname: user?.fullname ?? "",
            email: user?.email ?? "",
            phone: user?.phone ?? "",
            gender: user?.gender ?? "",
        },
    })

    const onSubmit = async (data: EditProfileForm) => {
        const ok = await updateWorkerProfile(data)
        if (ok) navigate(-1)
    }

    return (
        <div className="flex flex-col gap-4 pb-4 animate-fade-in">
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors -mb-1"
            >
                <ChevronLeft size={16} /> Back
            </button>

            <div>
                <h2 className="text-lg font-bold text-slate-900">Edit Profile</h2>
                <p className="text-xs text-slate-400 mt-1">Update your personal details</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <Avatar initials={user?.fullname?.slice(0, 3)} size="xl" index={0} />
                    <div>
                        <p className="text-sm font-semibold text-slate-800">{user?.fullname}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <div>
                        <Input label="Full Name" {...register("fullname")} />
                        <FieldError message={errors.fullname?.message} />
                    </div>

                    <div>
                        <Input label="Email Address" type="email" {...register("email")} />
                        <FieldError message={errors.email?.message} />
                    </div>

                    <div>
                        <Input label="Phone" type="tel" {...register("phone")} />
                        <FieldError message={errors.phone?.message} />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700">Gender</label>
                        <select
                            {...register("gender")}
                            className="h-9 px-3 border border-[#E2E8F0] rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6] transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Not specified</option>
                            {GENDER_OPTIONS.map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                        <FieldError message={errors.gender?.message} />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="mt-2 h-11 rounded-xl bg-[#1E3A5F] text-white text-sm font-bold hover:bg-[#162D4A] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm shadow-[#1E3A5F]/25 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                        Save Changes
                    </button>
                </form>
            </div>
        </div>
    )
}
