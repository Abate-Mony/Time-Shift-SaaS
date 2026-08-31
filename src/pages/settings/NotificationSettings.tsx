import { useState } from 'react'

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

export default function NotificationSettings() {
    return (
        <div className="p-6 max-w-3xl mx-auto animate-fade-in">
            <div className="bg-white rounded-xl border border-[#E2E8F0] px-6 min-w-0">
                <div className="py-4 border-b border-[#F1F5F9]">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Job Alerts</p>
                </div>
                <Toggle label="Job started" description="When a worker starts a job" defaultOn />
                <Toggle label="Job completed" description="When a worker finishes a job" defaultOn />
                <Toggle label="Job rejected" description="When a worker rejects an assignment" defaultOn />
                <Toggle label="Unassigned jobs" description="Alert when a job has no workers" defaultOn />
                <div className="py-4 border-b border-t border-[#F1F5F9] mt-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Team Alerts</p>
                </div>
                <Toggle label="New worker registered" defaultOn />
                <Toggle label="Worker goes offline" description="When GPS tracking is lost" />
                <Toggle label="Overtime alerts" description="When a worker exceeds hours threshold" defaultOn />
                <div className="py-4 border-b border-t border-[#F1F5F9] mt-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Communication Channels</p>
                </div>
                <Toggle label="Email notifications" defaultOn />
                <Toggle label="Push notifications" defaultOn />
                <Toggle label="SMS alerts" />
                <div className="pb-4" />
            </div>
        </div>
    )
}
