import { Input } from '@/components/ui'
import { Button } from '@/components/ui/button'
import type { iUser } from '@/layouts/dashboardlayout'
import { Globe, Lock } from 'lucide-react'
import { useOutletContext } from 'react-router'

export default function CompanySettings() {
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
        <div className="p-6 max-w-3xl mx-auto animate-fade-in">
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 flex flex-col gap-4 min-w-0">
                <h3 className="text-sm font-semibold text-slate-800">Company Information</h3>
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
