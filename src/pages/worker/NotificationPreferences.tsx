import { Switch } from "@/components/ui/switch"
import { updateNotificationPreferences } from "@/utils/api-request-functions"
import { defaultNotificationPreferences, type NotificationPreferences, type User } from "@/utils/types"
import { Bell, ChevronLeft } from "lucide-react"
import { useState } from "react"
import { useNavigate, useOutletContext } from "react-router"

const SECTIONS: {
    title: string
    rows: { key: keyof NotificationPreferences; label: string; description: string }[]
}[] = [
    {
        title: "Job Alerts",
        rows: [
            { key: "jobAssigned", label: "New job assigned", description: "When a manager assigns you a shift" },
            { key: "jobCancelled", label: "Job cancelled", description: "When an assigned shift is cancelled" },
            { key: "shiftReminder", label: "Shift reminders", description: "A reminder before your shift starts" },
            { key: "scheduleChanged", label: "Schedule changes", description: "When the time or location of a shift changes" },
        ],
    },
    {
        title: "Pay",
        rows: [
            { key: "payment", label: "Payment received", description: "When a payout has been sent to you" },
        ],
    },
    {
        title: "Communication Channels",
        rows: [
            { key: "email", label: "Email notifications", description: "" },
            { key: "push", label: "Push notifications", description: "" },
            { key: "sms", label: "SMS alerts", description: "" },
        ],
    },
]

function Row({
    label, description, checked, onCheckedChange,
}: { label: string; description?: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between gap-3 py-3.5">
            <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{label}</p>
                {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
            </div>
            <Switch
                checked={checked}
                onCheckedChange={onCheckedChange}
                className="shrink-0 data-[state=checked]:bg-[#1E3A5F]"
            />
        </div>
    )
}

export default function NotificationPreferencesScreen() {
    const navigate = useNavigate()
    const user = useOutletContext<{ user: User }>()?.user

    const [prefs, setPrefs] = useState<NotificationPreferences>(
        user?.notificationPreferences ?? defaultNotificationPreferences
    )

    const setPref = (key: keyof NotificationPreferences, value: boolean) => {
        setPrefs(prev => ({ ...prev, [key]: value }))
        updateNotificationPreferences({ [key]: value })
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
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                        <Bell size={15} className="text-slate-500" />
                    </span>
                    Notification Preferences
                </h2>
                <p className="text-xs text-slate-400 mt-1">Choose what you want to hear about, and how</p>
            </div>

            {SECTIONS.map(section => (
                <div key={section.title} className="bg-white rounded-2xl border border-[#E2E8F0] px-5 shadow-sm">
                    <div className="py-3.5 border-b border-[#F1F5F9]">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{section.title}</p>
                    </div>
                    <div className="divide-y divide-[#F8FAFC]">
                        {section.rows.map(row => (
                            <Row
                                key={row.key}
                                label={row.label}
                                description={row.description}
                                checked={prefs[row.key]}
                                onCheckedChange={v => setPref(row.key, v)}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
