import { Button } from '@/components/ui/button'
import type { iUser } from '@/layouts/dashboardlayout'
import { Check, Lock } from 'lucide-react'
import { useOutletContext } from 'react-router'

export default function BillingSettings() {
    const { user } = useOutletContext<{ user: iUser }>()
    const isAdmin = user?.role === 'admin'

    if (!isAdmin) {
        return (
            <div className="p-6 max-w-3xl mx-auto animate-fade-in">
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 flex items-center gap-3 min-w-0">
                    <Lock size={16} className="text-amber-600 shrink-0" />
                    <p className="text-sm text-slate-600">You don't have access to this.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-3xl mx-auto animate-fade-in flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-5 min-w-0">
                    <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-slate-800">Current Plan</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Billed monthly</p>
                    </div>
                    <span className="bg-[#1E3A5F] text-white text-xs font-semibold px-3 py-1 rounded-full shrink-0">Enterprise</span>
                </div>
                <div className="flex items-end gap-1 mb-4">
                    <span className="text-3xl font-bold text-slate-900">£149</span>
                    <span className="text-slate-500 text-sm mb-1">/month</span>
                </div>
                <div className="flex flex-col gap-2 mb-5">
                    {['Unlimited jobs', 'Up to 50 workers', 'Advanced analytics', 'Payroll export', 'Priority support', 'GPS tracking'].map(f => (
                        <div key={f} className="flex items-center gap-2">
                            <Check size={14} className="text-emerald-500 shrink-0" />
                            <span className="text-sm text-slate-700">{f}</span>
                        </div>
                    ))}
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm">Change Plan</Button>
                    <Button variant="destructive" size="sm">Cancel Subscription</Button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 min-w-0">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">Payment Method</h3>
                <div className="flex items-center gap-3 p-3.5 border border-[#E2E8F0] rounded-xl min-w-0">
                    <div className="w-10 h-7 bg-slate-800 rounded flex items-center justify-center shrink-0">
                        <span className="text-white text-[10px] font-bold">VISA</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800">Visa ending in 4242</p>
                        <p className="text-xs text-slate-400">Expires 08/2027</p>
                    </div>
                    <button className="ml-auto text-xs text-blue-600 font-medium hover:text-blue-800 shrink-0">Update</button>
                </div>
            </div>
        </div>
    )
}
