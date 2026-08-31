import { useState } from 'react'
import { Input } from '@/components/ui'
import { Button } from '@/components/ui/button'

function Toggle({ label, description, defaultOn }: { label: string; description?: string; defaultOn?: boolean }) {
    const [on, setOn] = useState(defaultOn ?? false)
    return (
        <div className="flex items-center justify-between py-3.5 min-w-0">
            <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{label}</p>
                {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
            </div>
            <button
                onClick={() => setOn(!on)}
                className={`w-10 h-6 rounded-full transition-colors shrink-0 ${on ? 'bg-[#1E3A5F]' : 'bg-slate-200'} relative`}
            >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${on ? 'left-5' : 'left-1'}`} />
            </button>
        </div>
    )
}

export default function SecuritySettings() {
    return (
        <div className="p-6 max-w-3xl mx-auto animate-fade-in flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 flex flex-col gap-4 min-w-0">
                <h3 className="text-sm font-semibold text-slate-800">Change Password</h3>
                <Input label="Current Password" type="password" placeholder="••••••••" />
                <Input label="New Password" type="password" placeholder="••••••••" />
                <Input label="Confirm New Password" type="password" placeholder="••••••••" />
                <div className="flex justify-end">
                    <Button size="sm">Update Password</Button>
                </div>
            </div>
            <div className="bg-white rounded-xl border border-[#E2E8F0] px-6 min-w-0">
                <div className="py-4 border-b border-[#F1F5F9]">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Security Settings</p>
                </div>
                <Toggle label="Two-factor authentication" description="Add an extra layer of security" />
                <Toggle label="Login notifications" description="Get notified of new sign-ins" defaultOn />
                <Toggle label="Session timeout" description="Auto logout after 8 hours of inactivity" defaultOn />
                <div className="pb-4" />
            </div>
        </div>
    )
}
